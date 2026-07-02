/** Context-budget warning when AI replies too much during multi-turn delivery. */

export function checkReplyForBudgetWarning(replyText, chunkIndex) {
  const t = (replyText || '').trim();
  if (!t || t.length <= 120) return null;
  if (/^(ok|got it|received|acknowledged|part \d+)/i.test(t) && t.length < 80) return null;

  return {
    type: 'over-long-reply',
    message: `AI replied at length to part ${chunkIndex} — this uses context budget. Consider a fresh chat.`,
    chunkIndex,
  };
}

export function extractAssistantText(el) {
  if (!el) return '';
  return (el.innerText || el.textContent || '').trim();
}
