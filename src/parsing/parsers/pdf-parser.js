import { createSummary } from '../types.js';
import { ensurePdfWorker, pdfjsLib } from '../pdfjs-browser.js';

export async function parsePdf(file, options = {}) {
  ensurePdfWorker();
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const texts = [];
  const ocrPages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it) => ('str' in it ? it.str : '')).join(' ').trim();
    if (text.length < 20) ocrPages.push(i);
    else texts.push(text);
  }

  const markdown = texts.join('\n\n---\n\n');
  const allOcr = ocrPages.length === pdf.numPages;

  return {
    success: !allOcr || options.allowOcr,
    markdown,
    error: allOcr ? 'Scanned PDF — enable OCR in extension popup.' : undefined,
    summary: createSummary({
      fileKind: 'pdf', fileName: file.name, lossless: !ocrPages.length,
      ocrRequired: ocrPages.length > 0, ocrRequiredPages: ocrPages,
      extractionMethod: ocrPages.length ? 'mixed' : 'native',
      stats: { charCount: markdown.length, pageCount: pdf.numPages },
      warnings: ocrPages.length ? [`${ocrPages.length} page(s) need OCR.`] : [],
    }),
  };
}
