import TurndownService from 'turndown';

let td;
function getTd() {
  if (!td) td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  return td;
}

export function htmlToMarkdown(html) {
  return getTd().turndown(html).replace(/\n{3,}/g, '\n\n').trim();
}

export function normalizePlainText(t) {
  return t.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}
