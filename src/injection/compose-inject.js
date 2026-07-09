/**
 * ProseMirror-safe compose injection with append support and verification.
 */

export function resolveEditable(element) {
  if (!element) return null;
  if (element.isContentEditable) return element;
  const inner = element.querySelector('.ProseMirror[contenteditable="true"], [contenteditable="true"]');
  return inner instanceof HTMLElement ? inner : element;
}

export function isConnected(element) {
  const t = resolveEditable(element);
  return !!(t && document.body?.contains(t));
}

export function readCompose(element) {
  const t = resolveEditable(element);
  if (!t) return '';
  return (t.innerText || t.textContent || '').replace(/\u00a0/g, ' ').trim();
}

export function focusCompose(element) {
  const target = resolveEditable(element);
  if (!target) return false;
  try {
    target.scrollIntoView({ block: 'center', behavior: 'instant' });
  } catch { /* ignore */ }
  target.focus();
  return true;
}

function verifyWritten(expectedLen, writtenLen) {
  if (expectedLen < 100) return writtenLen >= Math.max(1, expectedLen * 0.5);
  if (expectedLen < 2000) return writtenLen >= expectedLen * 0.6;
  return writtenLen >= expectedLen * 0.8;
}

/**
 * @param {HTMLElement} element
 * @param {string} text
 * @param {{ append?: boolean }} opts
 * @returns {boolean}
 */
export function injectText(element, text, opts = {}) {
  const { append = false } = opts;
  if (!text || !isConnected(element)) return false;

  const target = resolveEditable(element);
  if (!target) return false;
  focusCompose(target);

  const sel = window.getSelection();
  if (!sel) return false;

  const range = document.createRange();
  const expectedLen = text.trim().length;
  const lenBefore = readCompose(element).length;

  if (append && lenBefore > 0) {
    range.selectNodeContents(target);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('insertText', false, '\n\n');
  } else if (!append) {
    range.selectNodeContents(target);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('delete', false);
  } else {
    range.selectNodeContents(target);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  const CHUNK = 3000;
  for (let i = 0; i < text.length; i += CHUNK) {
    document.execCommand('insertText', false, text.slice(i, i + CHUNK));
  }

  target.dispatchEvent(new InputEvent('input', {
    bubbles: true, composed: true, inputType: 'insertText', data: text,
  }));

  const lenAfter = readCompose(element).length;

  if (append && lenBefore > 0) {
    const growth = lenAfter - lenBefore;
    if (expectedLen < 100) return growth >= 1;
    return growth >= expectedLen * 0.55;
  }

  return verifyWritten(expectedLen, lenAfter);
}
