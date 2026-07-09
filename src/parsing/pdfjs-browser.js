import * as pdfjsLib from 'pdfjs-dist';

export function ensurePdfWorker() {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('dist/pdf.worker.min.mjs');
}

export { pdfjsLib };
