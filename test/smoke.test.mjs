import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatFileBlock } from '../src/shared/format.js';
import { DEFAULT_SETTINGS } from '../src/shared/settings.js';
import {
  chunkForSend,
  chunkForPaste,
  maxBodyCharsPerSendPart,
  splitTextBodies,
} from '../src/chunking/chunker.js';
import { getSendLimit, SEND_CHAR_LIMIT, needsSendSplit } from '../src/shared/brand.js';

test('formatFileBlock wraps as filename [ content ]', () => {
  assert.equal(formatFileBlock('doc.txt', 'hello world'), 'doc.txt [ hello world ]');
});

test('send limit is 25k', () => {
  assert.equal(SEND_CHAR_LIMIT, 25_000);
  assert.equal(getSendLimit('chatgpt'), 25_000);
});

test('does not split at or below 25k', () => {
  assert.equal(needsSendSplit(25_000), false);
  assert.equal(needsSendSplit(25_001), true);
  const chunks = chunkForSend('x'.repeat(25_000));
  assert.equal(chunks.length, 1);
});

test('every wrapped send part is <= 25k', () => {
  for (const size of [50_000, 79_537, 120_000]) {
    const chunks = chunkForSend('x'.repeat(size));
    assert.ok(chunks.length >= 2, `size ${size}`);
    for (const c of chunks) {
      assert.ok(
        c.wrapped.length <= SEND_CHAR_LIMIT,
        `size ${size} part ${c.index}: wrapped ${c.wrapped.length}`,
      );
    }
  }
});

test('79537 chars splits into balanced parts not one 48k chunk', () => {
  const chunks = chunkForSend('x'.repeat(79_537));
  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every((c) => c.wrapped.length <= SEND_CHAR_LIMIT));
  assert.ok(chunks[0].wrapped.length < 30_000, `first part was ${chunks[0].wrapped.length}`);
});

test('paste chunks are internal only and smaller', () => {
  const paste = chunkForPaste('x'.repeat(20_000), 8_000);
  assert.equal(paste.length, 3);
  assert.ok(paste.every((c) => c.body.length <= 8_000));
});

test('default settings include enabled toggle', () => {
  assert.equal(DEFAULT_SETTINGS.enabled, true);
});

test('wrapForMultiTurn includes do-not-analyze instruction', () => {
  const chunks = chunkForSend('x'.repeat(50_000));
  assert.match(chunks[0].wrapped, /analyze/i);
  assert.match(chunks[0].wrapped, /ACK|Ready/i);
});

test('splitTextBodies respects paragraph boundaries', () => {
  const big = 'a'.repeat(5000) + '\n\n' + 'b'.repeat(5000);
  const parts = splitTextBodies(big, 6000);
  assert.ok(parts.length >= 2);
  assert.ok(parts.every((p) => p.length <= 6000));
});

test('multi-file style content stays under limit per send part', () => {
  const combined = [
    formatFileBlock('a.txt', 'a'.repeat(20_000)),
    formatFileBlock('b.txt', 'b'.repeat(20_000)),
    formatFileBlock('c.txt', 'c'.repeat(20_000)),
  ].join('\n\n');
  assert.ok(combined.length > SEND_CHAR_LIMIT);
  const chunks = chunkForSend(combined);
  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every((c) => c.wrapped.length <= SEND_CHAR_LIMIT));
});
