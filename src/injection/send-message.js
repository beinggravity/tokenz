import { readCompose, focusCompose, resolveEditable } from './compose-inject.js';

const SEND_SELECTORS = [
  'button[data-testid="send-button"]',
  'button[aria-label="Send prompt"]',
  'button[aria-label="Send message"]',
  '#composer-submit-button',
  'button[id*="submit"]',
];

function visible(el) {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 4 && r.height > 4;
}

export function findSendButton() {
  for (const sel of SEND_SELECTORS) {
    const nodes = document.querySelectorAll(sel);
    for (const n of nodes) {
      if (n instanceof HTMLElement && visible(n) && !n.disabled) return n;
    }
  }
  return null;
}

function pressEnterOnCompose(compose) {
  const target = resolveEditable(compose);
  if (!target) return;
  focusCompose(target);
  for (const opts of [
    { key: 'Enter', code: 'Enter', keyCode: 13 },
    { key: 'Enter', code: 'Enter', keyCode: 13, shiftKey: false, ctrlKey: false },
  ]) {
    target.dispatchEvent(new KeyboardEvent('keydown', { ...opts, bubbles: true, cancelable: true }));
    target.dispatchEvent(new KeyboardEvent('keypress', { ...opts, bubbles: true, cancelable: true }));
    target.dispatchEvent(new KeyboardEvent('keyup', { ...opts, bubbles: true }));
  }
}

function clickButton(btn) {
  btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  btn.click();
}

/**
 * Click send and verify the compose box cleared or generation started.
 * @param {import('./adapter-interface.js').SiteAdapter} adapter
 * @param {HTMLElement} compose
 */
export async function sendAndVerify(adapter, compose) {
  const beforeLen = readCompose(compose).length;
  if (beforeLen < 3) return false;

  for (let attempt = 0; attempt < 4; attempt++) {
    const btn = findSendButton();
    if (btn) clickButton(btn);
    else pressEnterOnCompose(compose);

    await sleep(250 + attempt * 150);

    if (adapter.isGenerating?.()) return true;

    const cur = adapter.findComposeBox?.() || compose;
    const afterLen = readCompose(cur);
    if (afterLen.length < beforeLen * 0.2) return true;

  }

  return adapter.isGenerating?.() || false;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
