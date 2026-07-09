import * as esbuild from 'esbuild';
import { mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)));

const shared = {
  bundle: true,
  platform: 'browser',
  target: 'chrome110',
  sourcemap: true,
  logLevel: 'info',
  mainFields: ['browser', 'module', 'main'],
};

const entries = [
  {
    entryPoints: ['src/content/page-intercept.js'],
    outfile: 'dist/content/page-intercept.js',
    format: 'iife',
    define: { process: 'undefined', global: 'globalThis' },
  },
  {
    entryPoints: ['src/content/bootstrap.js'],
    outfile: 'dist/content/bootstrap.js',
    format: 'iife',
    define: { process: 'undefined', global: 'globalThis', 'import.meta.url': '""' },
    alias: { 'pdfjs-dist': join(rootDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.mjs') },
  },
  {
    entryPoints: ['src/background/service-worker.js'],
    outfile: 'dist/background/service-worker.js',
    format: 'esm',
    define: {},
  },
  {
    entryPoints: ['src/popup/popup.js'],
    outfile: 'dist/popup/popup.js',
    format: 'esm',
    define: {},
  },
];

for (const { outfile } of entries) mkdirSync(dirname(join(rootDir, outfile)), { recursive: true });

await Promise.all(
  entries.map(({ entryPoints, outfile, format, define, alias }) =>
    esbuild.build({ ...shared, format, define, alias, entryPoints, outfile }),
  ),
);

mkdirSync(join(rootDir, 'dist/content'), { recursive: true });
copyFileSync(
  join(rootDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  join(rootDir, 'dist/pdf.worker.min.mjs'),
);

mkdirSync(join(rootDir, 'icons'), { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(join(rootDir, 'icons', `icon${size}.png`), createSolidPng(size));
}

console.log('build complete');

function createSolidPng(size) {
  const rowSize = 1 + size * 4;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < size; x++) {
      const i = y * rowSize + 1 + x * 4;
      raw[i] = 74; raw[i + 1] = 108; raw[i + 2] = 247; raw[i + 3] = 255;
    }
  }
  return encodePng(size, size, deflateSync(raw));
}

function encodePng(w, h, idat) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
