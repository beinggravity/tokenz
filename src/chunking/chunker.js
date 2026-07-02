import { getPasteLimit, SEND_CHAR_LIMIT } from '../shared/brand.js';

/** Split plain text into parts <= maxChars (paragraph-aware). Returns body strings only. */
export function splitTextBodies(markdown, maxChars) {
  if (maxChars < 1) return markdown ? [markdown.slice(0, SEND_CHAR_LIMIT)] : [];
  if (markdown.length <= maxChars) return [markdown];

  const parts = [];
  const paras = markdown.split(/\n\n+/);
  let cur = '';

  for (const p of paras) {
    const next = cur ? `${cur}\n\n${p}` : p;
    if (next.length <= maxChars) { cur = next; continue; }
    if (cur) parts.push(cur);
    if (p.length > maxChars) {
      for (let i = 0; i < p.length; i += maxChars) parts.push(p.slice(i, i + maxChars));
      cur = '';
    } else cur = p;
  }
  if (cur) parts.push(cur);
  return parts;
}

/** Only attached to chunks sent via auto multi-turn. */
export function wrapForMultiTurn(body, index, total) {
  const noWork = 'Do not summarize, analyze, or work on the content yet.';

  const header =
    index === 1
      ? `[Tokenz — Part ${index} of ${total}]\nI'm sending a large document in ${total} parts. Reply only "ACK" or "Ready". ${noWork} Wait until the final part arrives.`
      : index === total
        ? `[Tokenz — Part ${index} of ${total} — FINAL]\nLast part. Reply only "ACK". You now have the complete document.`
        : `[Tokenz — Part ${index} of ${total}]\nReply only "ACK". ${noWork} More parts are coming.`;

  return `${header}\n\n---\n\n${body}`;
}

function headerOverhead(index, total) {
  return wrapForMultiTurn('', index, total).length;
}

/** Conservative max body size using the largest possible ACK header. */
export function maxBodyCharsPerSendPart(total = 99) {
  const overhead = Math.max(
    headerOverhead(1, total),
    headerOverhead(2, total),
    headerOverhead(total, total),
  );
  return Math.max(1000, SEND_CHAR_LIMIT - overhead - 32);
}

function maxBodyForWrapped(index, total) {
  return Math.max(500, SEND_CHAR_LIMIT - headerOverhead(index, total) - 16);
}

/** Re-split any body whose wrapped message would exceed 25k. */
function enforceWrappedLimit(bodies) {
  let list = [...bodies];
  let guard = 0;

  while (guard++ < 500) {
    const total = list.length;
    let changed = false;

    for (let i = 0; i < list.length; i++) {
      const wrapped = wrapForMultiTurn(list[i], i + 1, total);
      if (wrapped.length <= SEND_CHAR_LIMIT) continue;

      const maxBody = maxBodyForWrapped(i + 1, total);
      if (list[i].length <= maxBody) {
        const hard = Math.max(500, Math.floor(maxBody * 0.85));
        const pieces = splitTextBodies(list[i], hard);
        if (pieces.length <= 1) {
          list[i] = list[i].slice(0, hard);
          changed = true;
          break;
        }
        list.splice(i, 1, ...pieces);
        changed = true;
        break;
      }

      const pieces = splitTextBodies(list[i], maxBody);
      list.splice(i, 1, ...pieces);
      changed = true;
      break;
    }

    if (!changed) break;
  }

  return list;
}

/**
 * Split for multi-turn sends only when content > 25k.
 * Every wrapped send part is guaranteed <= 25k chars.
 */
export function chunkForSend(markdown) {
  if (markdown.length <= SEND_CHAR_LIMIT) {
    return [{ index: 1, total: 1, body: markdown, wrapped: markdown }];
  }

  const estimateParts = Math.ceil(markdown.length / maxBodyCharsPerSendPart());
  let bodies = splitTextBodies(markdown, maxBodyCharsPerSendPart(estimateParts));
  bodies = enforceWrappedLimit(bodies);

  const total = bodies.length;
  const chunks = bodies.map((body, i) => ({
    index: i + 1,
    total,
    body,
    wrapped: wrapForMultiTurn(body, i + 1, total),
  }));

  for (const c of chunks) {
    if (c.wrapped.length > SEND_CHAR_LIMIT) {
      throw new Error(`Tokenz internal error: part ${c.index} exceeds ${SEND_CHAR_LIMIT} chars`);
    }
  }

  return chunks;
}

/** Internal paste chunks for filling compose box (single message). */
export function chunkForPaste(markdown, pasteLimit) {
  const bodies = splitTextBodies(markdown, pasteLimit);
  return bodies.map((body, i) => ({
    index: i + 1,
    total: bodies.length,
    body,
  }));
}

/** @deprecated use chunkForPaste or chunkForSend */
export function chunkMarkdown(markdown, maxChars) {
  const bodies = splitTextBodies(markdown, maxChars);
  const total = bodies.length;
  return bodies.map((body, i) => ({
    index: i + 1,
    total,
    body,
    wrapped: wrapForMultiTurn(body, i + 1, total),
  }));
}

/** Only for paste retry when a single paste step fails — never for send parts. */
export function splitChunkHalf(body, minSize = 1500) {
  if (body.length < minSize * 2) return [body];
  const mid = Math.floor(body.length / 2);
  let splitAt = body.lastIndexOf('\n', mid);
  if (splitAt < mid * 0.3) splitAt = mid;
  const a = body.slice(0, splitAt).trim();
  const b = body.slice(splitAt).trim();
  return [a, b].filter((s) => s.length >= minSize);
}

export { getPasteLimit };
