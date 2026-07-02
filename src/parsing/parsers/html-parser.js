import { createSummary } from '../types.js';
import { htmlToMarkdown } from '../html-to-markdown.js';

export async function parseHtml(file) {
  const markdown = htmlToMarkdown(await file.text());
  return {
    success: true, markdown,
    summary: createSummary({ fileKind: 'html', fileName: file.name, lossless: true, extractionMethod: 'native', stats: { charCount: markdown.length } }),
  };
}
