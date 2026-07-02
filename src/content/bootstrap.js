import { getAdapterForCurrentSite } from '../injection/adapter-registry.js';
import { parseFile } from '../parsing/pipeline.js';
import { deliverMarkdown } from '../chunking/delivery.js';
import { loadSettings, syncEnabledToDom } from '../shared/settings.js';
import { formatFileBlock } from '../shared/format.js';
import { EVENT_FILES, EVENT_READY, EVENT_CLEANUP } from '../shared/brand.js';
import { showActiveBadge, hideActiveIndicators, setStatus, clearStatus, lockHud, unlockHud } from '../ui/glass-ui.js';

let adapter = null;
let enabled = true;
let draining = false;
/** @type {File[]} */
const pendingFiles = [];

boot();

async function boot() {
  adapter = getAdapterForCurrentSite();
  if (!adapter) return;

  document.addEventListener(EVENT_FILES, onFilesEvent);
  document.addEventListener(EVENT_READY, onReady);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      void applyEnabledState(changes.settings.newValue);
    }
  });

  await applyEnabledState();
}

function onFilesEvent(e) {
  const files = /** @type {CustomEvent} */ (e).detail?.files;
  if (!files?.length || !enabled) return;
  pendingFiles.push(...files);
  void drainQueue();
}

function onReady() {
  if (enabled) showActiveBadge();
}

async function drainQueue() {
  if (draining) return;
  draining = true;

  try {
    while (enabled) {
      if (!pendingFiles.length) break;
      const batch = pendingFiles.splice(0, pendingFiles.length);
      await handleFiles(batch);
    }
  } finally {
    draining = false;
    if (pendingFiles.length && enabled) void drainQueue();
  }
}

async function applyEnabledState(override) {
  const settings = override
    ? { ...(await loadSettings()), ...override }
    : await loadSettings();

  const wasEnabled = enabled;
  enabled = settings.enabled !== false;
  syncEnabledToDom(enabled);

  if (!enabled) {
    pendingFiles.length = 0;
    document.dispatchEvent(new CustomEvent(EVENT_CLEANUP, { bubbles: true }));
    hideActiveIndicators();
    clearStatus();
    return;
  }

  if (!wasEnabled) {
    showActiveBadge();
  } else if (!document.getElementById('tokenz-center-hud')) {
    setTimeout(showActiveBadge, 400);
  }
}

async function handleFiles(files) {
  if (!adapter || !enabled) return;

  const supported = files.filter((f) => /\.(txt|md|docx|html?|pdf)$/i.test(f.name));
  if (!supported.length) {
    setStatus('Unsupported file', 'warn', { detail: 'Use TXT, MD, DOCX, HTML, or PDF.' });
    return;
  }

  const settings = await loadSettings();

  try {
    const sections = [];
    let fileIndex = 0;

    for (const file of supported) {
      fileIndex++;
      setStatus(
        supported.length > 1 ? `File ${fileIndex} of ${supported.length}` : 'Extracting text',
        'info',
        { detail: file.name, progress: (fileIndex / supported.length) * 42, center: true },
      );

      const result = await parseFile(file, {
        useOcr: true,
        ocrApiKey: settings.ocrApiKey || undefined,
      });

      if (!result.success || !result.markdown?.trim()) {
        setStatus('Could not read file', 'error', {
          detail: result.error || file.name,
          persist: true,
          center: true,
        });
        return;
      }

      sections.push(formatFileBlock(file.name, result.markdown));
    }

    const combined = sections.join('\n\n');
    const wordApprox = combined.split(/\s+/).length;

    const willSplit = combined.length > 25_000;

    if (willSplit) {
      lockHud();
      setStatus('Large document — splitting required', 'info', {
        detail: `${combined.length.toLocaleString()} chars · 25,000 limit per send`,
        progress: 50,
        center: true,
        lock: true,
      });
    } else {
      setStatus('Inserting into message box', 'info', {
        detail: `${supported.length} file${supported.length > 1 ? 's' : ''} · ${combined.length.toLocaleString()} characters`,
        progress: 55,
        center: true,
      });
    }

    const delivery = await deliverMarkdown(combined, adapter, {
      onProgress: ({ current, total, mode, wrappedChars }) => {
        const pct = willSplit ? 50 + (current / total) * 48 : 55 + (current / total) * 40;
        if (mode === 'multi-turn') {
          setStatus(`Sending part ${current} of ${total}`, 'info', {
            detail: `Auto-send in progress · ~${(wrappedChars ?? 0).toLocaleString()} chars this part · do not close tab`,
            progress: pct,
            center: true,
            lock: true,
          });
        } else {
          setStatus('Inserting into message box', 'info', {
            detail: supported.length > 1 ? `${supported.length} files → one message` : 'Almost ready',
            progress: pct,
            center: true,
          });
        }
      },
      onBudgetWarning: (w) => setStatus('Context warning', 'warn', { detail: w.message, persist: true, center: true, lock: true }),
    });

    if (!delivery.success) {
      unlockHud();
      setStatus('Insertion failed', 'error', { detail: delivery.error || 'Try a smaller file.', persist: true, center: true, unlock: true });
      return;
    }

    const modeDetail =
      delivery.mode === 'multi-turn'
        ? `Sent ${delivery.chunksDelivered} parts automatically. Add your question when ready.`
        : 'Ready — add your question and send.';

    unlockHud();
    setStatus('Document ready', 'success', {
      detail: `${combined.length.toLocaleString()} chars · ~${wordApprox.toLocaleString()} words. ${modeDetail}`,
      progress: 100,
      center: true,
      unlock: true,
    });
  } catch (err) {
    unlockHud();
    setStatus('Something went wrong', 'error', {
      detail: err instanceof Error ? err.message : 'Unknown error',
      persist: true,
      center: true,
    });
  }
}
