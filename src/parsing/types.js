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

export const SUPPORTED_EXTENSIONS = [
  '.txt', '.md', '.docx', '.html', '.htm', '.pdf',
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', 
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.m', '.mm', '.sh', '.bat', '.ps1', 
  '.css', '.scss', '.less', '.json', '.yaml', '.yml', '.xml', '.csv', '.sql', 
  '.ini', '.toml', '.env', '.vue', '.svelte', '.astro', '.graphql', '.gql'
];

export function detectFileKind(name) {
  const n = name.toLowerCase();
  
  if (n.endsWith('.docx')) return 'docx';
  if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.md')) return 'md';

  if (SUPPORTED_EXTENSIONS.some(ext => n.endsWith(ext))) {
    return 'txt';
  }

  return 'unknown';
}
