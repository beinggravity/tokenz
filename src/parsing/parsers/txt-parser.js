import { createSummary } from '../types.js';
import { normalizePlainText } from '../html-to-markdown.js';

export async function readFileAsText(file) {
  if (file.size === 0) {
    throw new Error('File is 0 bytes — open it locally first if stored on OneDrive/iCloud.');
  }
  let text = await file.text();
  if (!text.trim() && file.size > 0) {
    text = new TextDecoder('utf-8', { fatal: false }).decode(await file.arrayBuffer());
  }
  return normalizePlainText(text);
}

export async function parseTxt(file) {
  const text = await readFileAsText(file);
  const kind = file.name.toLowerCase().endsWith('.md') ? 'md' : 'txt';
  if (!text) {
    return { success: false, markdown: '', error: `No text in "${file.name}".`, summary: createSummary({ fileKind: kind, fileName: file.name, stats: { charCount: 0 } }) };
  }
  return {
    success: true,
    markdown: text,
    summary: createSummary({
      fileKind: kind, fileName: file.name, lossless: true, extractionMethod: 'native',
      stats: { charCount: text.length, wordCount: text.split(/\s+/).filter(Boolean).length },
    }),
  };
}
