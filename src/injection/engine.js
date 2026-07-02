import { readCompose } from './compose-inject.js';

export async function waitForComposeBox(adapter) {
  if (adapter.waitForComposeBox) return adapter.waitForComposeBox();
  for (let i = 0; i < 40; i++) {
    const el = adapter.findComposeBox();
    if (el) return el;
    await sleep(200);
  }
  return null;
}

export async function waitForGenerationIdle(adapter) {
  if (adapter.waitUntilIdle) return adapter.waitUntilIdle();
  const start = Date.now();
  let saw = false;
  while (Date.now() - start < 120000) {
    if (adapter.isGenerating()) saw = true;
    else if (saw || Date.now() - start > 600) return 'idle';
    await sleep(300);
  }
  return 'timeout';
}

export function readComposeText(el) { return readCompose(el); }

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
