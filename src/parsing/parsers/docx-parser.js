import mammoth from 'mammoth';
import { createSummary } from '../types.js';
import { htmlToMarkdown } from '../html-to-markdown.js';

export async function parseDocx(file) {
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const markdown = htmlToMarkdown(value);
  return {
    success: true, markdown,
    summary: createSummary({
      fileKind: 'docx', fileName: file.name, lossless: true, extractionMethod: 'native',
      stats: { charCount: markdown.length },
    }),
  };
}
