import { chunkForSend, chunkForPaste, splitChunkHalf } from './chunker.js';
import { checkReplyForBudgetWarning, extractAssistantText } from './context-budget.js';
import { waitForComposeBox, waitForGenerationIdle } from '../injection/engine.js';
import { injectText, readCompose, isConnected } from '../injection/compose-inject.js';
import { sendAndVerify } from '../injection/send-message.js';
import { loadSettings } from '../shared/settings.js';

const EXISTING_MIN = 40;

/**
 * >sendLimit chars → multi-turn: each send part holds up to ~sendLimit chars of body + ACK header.
 */
export async function deliverMarkdown(markdown, adapter, callbacks = {}) {
  let compose = await waitForComposeBox(adapter);
  if (!compose) return fail('Could not find the message box. Click the chat input and try again.');

  const settings = await loadSettings();
  const sendLimit = adapter.getPerMessageCharLimit?.() ?? settings.sendCharLimit;
  const pasteLimit = settings.pasteCharLimit;

  const existing = readCompose(compose).trim();
  const hasExisting = existing.length > EXISTING_MIN;
  const combined = hasExisting ? `${existing}\n\n${markdown}` : markdown;

  if (combined.length > sendLimit) {
    injectText(compose, '', { append: false });
    await sleep(200);
    compose = await waitForComposeBox(adapter);
    if (!compose) return fail('Could not find the message box. Click the chat input and try again.');

    const chunks = chunkForSend(combined, sendLimit);
    return deliverMultiTurn(chunks, compose, adapter, callbacks);
  }

  if (hasExisting) {
    const pasteChunks = chunkForPaste(markdown, pasteLimit);
    const appended = await deliverAccumulate(pasteChunks, compose, adapter, callbacks, { appendOnly: true });
    if (appended.success) return appended;
    return fail('Could not append to the message box. Click the input and try again.');
  }

  const pasteChunks = chunkForPaste(markdown, pasteLimit);
  const accumulated = await deliverAccumulate(pasteChunks, compose, adapter, callbacks);

  if (accumulated.success) return accumulated;
  return fail('Could not insert text into the message box. Click the input and try again.');
}

async function resolveCompose(adapter, current) {
  if (current && isConnected(current)) {
    const fresh = adapter.findComposeBox?.();
    return fresh || current;
  }
  return waitForComposeBox(adapter);
}

async function deliverAccumulate(chunks, compose, adapter, callbacks, opts = {}) {
  const appendOnly = opts.appendOnly ?? false;
  let composeEl = compose;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk.body?.trim()) continue;

    callbacks.onProgress?.({
      current: i + 1,
      total: chunks.length,
      mode: 'accumulate',
      pasteSteps: chunks.length,
    });

    composeEl = await resolveCompose(adapter, composeEl);
    if (!composeEl) {
      return { success: false, mode: 'silent-accumulate', chunksDelivered: i, warnings: [], error: 'no-compose' };
    }

    const shouldAppend = appendOnly || i > 0;
    const ok = await injectWithRetry(adapter, composeEl, chunk.body, shouldAppend, { allowSplit: true });
    if (!ok) {
      return { success: false, mode: 'silent-accumulate', chunksDelivered: i, warnings: [], error: 'accumulate-failed' };
    }

    await sleep(i === 0 ? 100 : 200);
  }

  return { success: true, mode: 'silent-accumulate', chunksDelivered: chunks.length, warnings: [] };
}

async function injectWithRetry(adapter, compose, text, append, opts = {}) {
  const allowSplit = opts.allowSplit ?? false;
  let queue = [text];
  let composeEl = compose;

  while (queue.length) {
    const piece = queue.shift();
    if (!piece) continue;

    composeEl = await resolveCompose(adapter, composeEl);
    if (!composeEl) return false;

    const lenBefore = readCompose(composeEl).length;
    const doAppend = append || lenBefore > EXISTING_MIN;
    let injected = false;

    try {
      if (adapter.insertIntoCompose) {
        adapter.insertIntoCompose(composeEl, piece, { append: doAppend });
        injected = true;
      } else {
        injected = injectText(composeEl, piece, { append: doAppend });
      }
    } catch {
      injected = false;
    }

    if (!injected) {
      try {
        injected = injectText(composeEl, piece, { append: doAppend });
      } catch { injected = false; }
    }

    await sleep(120);
    const lenAfter = readCompose(composeEl).length;
    const growth = lenAfter - lenBefore;

    if (growth >= Math.min(piece.length * 0.45, piece.length - 20)) continue;
    if (piece.length < 80 && growth > 0) continue;

    if (!allowSplit) return false;

    const refreshed = await waitForComposeBox(adapter);
    if (refreshed) {
      composeEl = refreshed;
      const lb = readCompose(composeEl).length;
      try {
        if (adapter.insertIntoCompose) adapter.insertIntoCompose(composeEl, piece, { append: doAppend || lb > EXISTING_MIN });
        else if (injectText(composeEl, piece, { append: doAppend || lb > EXISTING_MIN })) continue;
      } catch { /* fall through */ }
      await sleep(120);
      if (readCompose(composeEl).length > lenBefore) continue;
    }

    if (piece.length < 1500) return false;

    const halves = splitChunkHalf(piece, 1500);
    if (halves.length < 2) return false;
    queue = [...halves, ...queue];
  }

  composeEl = await resolveCompose(adapter, composeEl);
  return composeEl ? readCompose(composeEl).length > 0 : false;
}

async function deliverMultiTurn(chunks, compose, adapter, callbacks) {
  const warnings = [];

  for (let i = 0; i < chunks.length; i++) {
    const payload = chunks[i].wrapped || chunks[i].body;
    callbacks.onProgress?.({
      current: i + 1,
      total: chunks.length,
      mode: 'multi-turn',
      wrappedChars: payload.length,
      bodyChars: chunks[i].body?.length ?? 0,
    });

    const composeEl = await waitForComposeBox(adapter);
    if (!composeEl) return fail(`Could not find the message box at part ${i + 1} of ${chunks.length}.`);

    const ok = await injectWithRetry(adapter, composeEl, payload, false, { allowSplit: false });
    if (!ok) return fail(`Could not insert part ${i + 1} of ${chunks.length}.`);

    await sleep(300);

    const sent = await sendAndVerify(adapter, composeEl);
    if (!sent) {
      return fail(`Could not auto-send part ${i + 1}. Text is in the box — press Send, then drop files again.`);
    }

    if (i < chunks.length - 1) {
      const idle = await waitForGenerationIdle(adapter);
      if (idle === 'timeout') return fail(`Timed out waiting for AI after part ${i + 1}.`);

      const assistantEl = adapter.findLatestAssistantMessage?.();
      const warn = checkReplyForBudgetWarning(extractAssistantText(assistantEl), i + 1);
      if (warn) {
        warnings.push(warn);
        callbacks.onBudgetWarning?.(warn);
      }

      await sleep(600);
    }
  }

  return { success: true, mode: 'multi-turn', chunksDelivered: chunks.length, warnings };
}

function fail(error) {
  return { success: false, mode: 'silent-accumulate', chunksDelivered: 0, warnings: [], error };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
