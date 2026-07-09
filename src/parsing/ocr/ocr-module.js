export async function runOcr(file, options = {}) {
  const buf = await file.arrayBuffer();
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'OCR_PARSE', payload: { buffer: buf, fileName: file.name, apiKey: options.apiKey } },
      (r) => resolve(r ?? { success: false, error: 'No OCR response' }),
    );
  });
}

export function wrapOcrText(text) {
  return `> **OCR (not guaranteed accurate)**\n\n${text}`;
}
