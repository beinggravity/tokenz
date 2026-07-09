export const DEFAULT_OCR_API_KEY = 'helloworld';

export async function parseWithOcrSpace(blob, fileName, apiKey = DEFAULT_OCR_API_KEY) {
  const fd = new FormData();
  fd.append('apikey', apiKey?.trim() || DEFAULT_OCR_API_KEY);
  fd.append('file', blob, fileName);
  fd.append('language', 'eng');
  fd.append('isOverlayRequired', 'false');
  fd.append('OCREngine', '2');
  if (fileName.toLowerCase().endsWith('.pdf')) fd.append('filetype', 'PDF');

  const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: fd });
  const data = await res.json();
  const text = (data.ParsedResults || []).map((r) => r.ParsedText || '').join('\n\n').trim();
  if (!text) return { success: false, text: '', error: 'OCR returned no text.' };
  return { success: true, text, confidence: 0.85, warnings: ['OCR text — not guaranteed accurate.'] };
}
