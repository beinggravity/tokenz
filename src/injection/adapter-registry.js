import { claudeAdapter } from './adapters/claude.js';
import { chatgptAdapter } from './adapters/chatgpt.js';
import { resolveAdapter } from './adapter-interface.js';

const ADAPTERS = [claudeAdapter, chatgptAdapter];

export function getAdapterForCurrentSite(hostname = window.location.hostname) {
  return resolveAdapter(hostname, ADAPTERS);
}
