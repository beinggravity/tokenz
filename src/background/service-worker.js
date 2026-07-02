import { DEFAULT_SETTINGS } from '../shared/settings.js';
import { parseWithOcrSpace } from '../parsing/ocr/ocr-space-client.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings').then((d) => {
    if (!d.settings) chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  });
});

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg.type === 'OCR_PARSE') {
    const { buffer, fileName, apiKey } = msg.payload;
    parseWithOcrSpace(new Blob([buffer]), fileName, apiKey).then(sendResponse);
    return true;
  }
  return false;
});
