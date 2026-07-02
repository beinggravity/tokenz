/** Format extracted text as: filename [ content ] */
export function formatFileBlock(fileName, content) {
  const body = (content || '').trim();
  return `${fileName} [ ${body} ]`;
}
