import { detectFileKind, createSummary, SUPPORTED_EXTENSIONS } from './types.js';
import { parseTxt } from './parsers/txt-parser.js';
import { parseDocx } from './parsers/docx-parser.js';
import { parseHtml } from './parsers/html-parser.js';
import { runOcr, wrapOcrText } from './ocr/ocr-module.js';

export async function parseFile(file, options = {}) {
  const kind = detectFileKind(file.name);
  if (kind === 'unknown') {
    return { success: false, markdown: '', error: 'Unsupported type. Drop standard documents or code files.', summary: createSummary({ fileName: file.name }) };
  }

  let result;
  switch (kind) {
    case 'txt': case 'md': result = await parseTxt(file); break;
    case 'docx': result = await parseDocx(file); break;
    case 'html': result = await parseHtml(file); break;
    case 'pdf': result = await (await import('./parsers/pdf-parser.js')).parsePdf(file, options); break;
    default: result = { success: false, markdown: '', error: 'Unhandled kind', summary: createSummary({ fileName: file.name }) };
  }

  if (result.summary.ocrRequired && options.useOcr !== false && result.summary.ocrRequiredPages?.length) {
    const ocr = await runOcr(file, { apiKey: options.ocrApiKey });
    if (ocr.success && ocr.text) {
      const ocrMd = wrapOcrText(ocr.text);
      const combined = result.markdown ? `${result.markdown}\n\n---\n\n${ocrMd}` : ocrMd;
      return { success: true, markdown: combined, summary: { ...result.summary, lossless: false, stats: { ...result.summary.stats, charCount: combined.length } } };
    }
  }

  return result;
}
