import { defineAdapter } from '../adapter-interface.js';
import { injectText, readCompose } from '../compose-inject.js';

export const claudeAdapter = defineAdapter({
  id: 'claude',
  hostPatterns: ['claude.ai'],

  findComposeBox() {
    const el = document.querySelector('div.ProseMirror[contenteditable="true"], div[contenteditable="true"]');
    return el instanceof HTMLElement ? el : null;
  },

  async waitForComposeBox() {
    for (let i = 0; i < 50; i++) {
      const el = this.findComposeBox();
      if (el) return el;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  },

  findSendButton() {
    const el = document.querySelector('button[aria-label="Send message"], button[aria-label="Send"]');
    return el instanceof HTMLElement ? el : null;
  },

  findFileInputs() {
    return [...document.querySelectorAll('input[type="file"]')].filter((e) => e instanceof HTMLInputElement);
  },

  findDropZones() { return []; },

  isGenerating() {
    return !!document.querySelector('button[aria-label="Stop response"], button[aria-label="Stop generating"]');
  },

  async waitUntilIdle(opts = {}) {
    const timeout = opts.timeoutMs ?? 120000;
    const start = Date.now();
    let saw = false;
    while (Date.now() - start < timeout) {
      if (this.isGenerating()) saw = true;
      else if (saw || Date.now() - start > 800) return 'idle';
      await new Promise((r) => setTimeout(r, 300));
    }
    return 'timeout';
  },

  getPerMessageCharLimit() { return 25_000; },

  findLatestAssistantMessage() {
    const nodes = document.querySelectorAll('[data-testid="assistant-message"], .font-claude-message');
    const last = nodes[nodes.length - 1];
    return last instanceof HTMLElement ? last : null;
  },

  insertIntoCompose(el, text, opts) {
    if (!injectText(el, text, { append: !!opts.append })) throw new Error('Compose insert failed.');
  },

  clearCompose(el) {
    injectText(el, '', { append: false });
  },

  isSendReady() {
    const c = this.findComposeBox();
    return c ? readCompose(c).length > 0 : false;
  },

  clickSend() { this.findSendButton()?.click(); },
});
