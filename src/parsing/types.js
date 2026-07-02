export function createSummary(partial) {
  return {
    fileKind: partial.fileKind ?? 'unknown',
    fileName: partial.fileName ?? '',
    lossless: partial.lossless ?? true,
    ocrRequired: partial.ocrRequired ?? false,
    ocrRequiredPages: partial.ocrRequiredPages ?? [],
    warnings: partial.warnings ?? [],
    stats: partial.stats ?? { charCount: 0 },
    extractionMethod: partial.extractionMethod ?? 'native',
  };
}

export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.docx', '.html', '.htm', '.pdf'];

export function detectFileKind(name) {
  const n = name.toLowerCase();
  if (n.endsWith('.txt')) return 'txt';
  if (n.endsWith('.md')) return 'md';
  if (n.endsWith('.docx')) return 'docx';
  if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
  if (n.endsWith('.pdf')) return 'pdf';
  return 'unknown';
}
