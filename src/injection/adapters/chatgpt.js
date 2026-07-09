import { defineAdapter } from '../adapter-interface.js';
import { injectText, readCompose, resolveEditable } from '../compose-inject.js';
import { findSendButton, sendAndVerify } from '../send-message.js';

const STOP = [
  'button[data-testid="stop-button"]',
  'button[aria-label="Stop generating"]',
  'button[aria-label="Stop streaming"]',
];

function visible(el) {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 8 && r.height > 8;
}

function inViewport(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

function findCompose() {
  const selectors = [
    '#prompt-textarea',
    '[data-testid="prompt-textarea"]',
    'div.ProseMirror[contenteditable="true"]',
  ];

  const candidates = [];
  const seen = new Set();

  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach((n) => {
      if (!(n instanceof HTMLElement) || seen.has(n)) return;
      seen.add(n);
      if (!visible(n)) return;
      const el = resolveEditable(n);
      if (el && !candidates.includes(el)) candidates.push(el);
    });
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);
  return candidates[0];
}

export const chatgptAdapter = defineAdapter({
  id: 'chatgpt',
  hostPatterns: ['chatgpt.com', 'chat.openai.com'],

  findComposeBox: findCompose,

  async waitForComposeBox() {
    for (let i = 0; i < 100; i++) {
      const el = findCompose();
      if (el) return el;
      await new Promise((r) => setTimeout(r, 150));
    }
    return null;
  },

  findSendButton,

  findFileInputs() {
    return [...document.querySelectorAll('input[type="file"]')].filter((e) => e instanceof HTMLInputElement);
  },

  findDropZones() { return []; },

  isGenerating() {
    return STOP.some((s) => visible(document.querySelector(s)));
  },

  async waitUntilIdle(opts = {}) {
    const timeout = opts.timeoutMs ?? 180000;
    const start = Date.now();
    let saw = false;
    while (Date.now() - start < timeout) {
      if (this.isGenerating()) {
        saw = true;
      } else if (saw) {
        await new Promise((r) => setTimeout(r, 500));
        if (!this.isGenerating()) return 'idle';
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return saw ? 'timeout' : 'idle';
  },

  getPerMessageCharLimit() { return 25_000; },

  findLatestAssistantMessage() {
    const nodes = document.querySelectorAll('[data-message-author-role="assistant"]');
    const last = nodes[nodes.length - 1];
    return last instanceof HTMLElement ? last : null;
  },

  insertIntoCompose(el, text, opts) {
    if (!injectText(el, text, { append: !!opts.append })) {
      throw new Error('Could not write text into ChatGPT compose box.');
    }
  },

  clearCompose(el) {
    injectText(el, '', { append: false });
  },

  isSendReady() {
    const c = findCompose();
    return c ? readCompose(c).length > 0 && !!findSendButton() : false;
  },

  async clickSend() {
    const c = findCompose();
    if (!c) return;
    await sendAndVerify(this, c);
  },
});
