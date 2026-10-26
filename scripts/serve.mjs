#!/usr/bin/env node
// Minimale statische server voor site/. Bedient de site op / én op het GitHub Pages-pad
// /mini-engine-docs/, zodat ook 404.html (met absolute links) lokaal klopt.
// Gebruik: node scripts/serve.mjs [poort]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const BASE = process.env.DOCS_BASE ?? '/mini-engine-docs/';
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
};

async function fileFor(urlPath) {
  let path = decodeURIComponent(urlPath.split('?')[0]);
  if (path.startsWith(BASE)) path = '/' + path.slice(BASE.length);
  const full = resolve(join(SITE, path));
  if (!full.startsWith(SITE)) return null;
  try {
    const info = await stat(full);
    return info.isDirectory() ? join(full, 'index.html') : full;
  } catch {
    return null;
  }
}

createServer(async (request, response) => {
  const file = await fileFor(request.url || '/');
  try {
    if (!file) throw new Error('not found');
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': TYPES['.html'] });
    response.end(await readFile(join(SITE, '404.html')).catch(() => 'Niet gevonden'));
  }
}).listen(PORT, () => {
  console.log(`Mini Engine Docs: http://localhost:${PORT}/  (ook op http://localhost:${PORT}${BASE})`);
});
