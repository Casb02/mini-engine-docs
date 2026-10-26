#!/usr/bin/env node
// Controleert alle interne links en ankers in site/, en dat de vaste downloads er staan. Externe links worden overgeslagen.
// Gebruik: node scripts/check-links.mjs
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const BASE = process.env.DOCS_BASE ?? '/mini-engine-docs/';
const BUILD = await readFile(join(ROOT, 'build.mjs'), 'utf8');
const PDF = BUILD.match(/^const PDF = '([^']+)';$/m)[1];
const DOWNLOADS = BUILD.match(/^const DOWNLOADS = \[([^\]]*)\];$/m)[1]
  .split(',')
  .map((item) => item.trim())
  .map((item) => (item === 'PDF' ? PDF : item.replace(/^'|'$/g, '')));

if (!existsSync(SITE)) {
  console.error('site/ bestaat niet. Draai eerst: node build.mjs');
  process.exit(1);
}

async function walk(dir, extension = '.html') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full, extension)));
    else if (entry.name.endsWith(extension)) files.push(full);
  }
  return files;
}

const pages = await walk(SITE);
const SITE_URL = BUILD.match(/^const SITE_URL = '([^']+)';$/m)[1];
const idCache = new Map();
async function idsOf(file) {
  if (!idCache.has(file)) {
    const html = await readFile(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

const problems = [];
let checked = 0;

for (const file of DOWNLOADS) {
  if (!existsSync(join(SITE, file))) problems.push(`vaste download ontbreekt: ${file}`);
}

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const rel = relative(SITE, page).split(sep).join('/');
  for (const match of html.matchAll(/\s(?:href|src|srcset)="([^"]*)"/g)) {
    const raw = match[1].replace(/&amp;/g, '&');
    if (!raw || /^(https?:|mailto:|data:)/.test(raw)) continue;
    checked++;
    const [pathPart, hash] = raw.split('#');
    let target;
    if (!pathPart) target = page;
    else if (pathPart.startsWith('/')) {
      if (!pathPart.startsWith(BASE)) {
        problems.push(`${rel}: absolute link buiten BASE (${BASE}): ${raw}`);
        continue;
      }
      target = join(SITE, decodeURIComponent(pathPart.slice(BASE.length)));
    } else {
      target = resolve(dirname(page), decodeURIComponent(pathPart));
    }
    if (!target.startsWith(SITE)) {
      problems.push(`${rel}: link wijst buiten site/: ${raw}`);
      continue;
    }
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) {
      problems.push(`${rel}: ontbrekend doel: ${raw}`);
      continue;
    }
    if (hash && target.endsWith('.html')) {
      const ids = await idsOf(target);
      if (!ids.has(decodeURIComponent(hash))) problems.push(`${rel}: onbekend anker #${hash} in ${raw}`);
    }
  }
}

// De Markdown voor agents linkt absoluut, naar SITE_URL: elk zo'n adres moet in site/ bestaan.
const agentFiles = [...(await walk(SITE, '.md')), join(SITE, 'llms.txt'), join(SITE, 'llms-full.txt')];
for (const file of agentFiles) {
  const rel = relative(SITE, file).split(sep).join('/');
  if (!existsSync(file)) {
    problems.push(`agentbestand ontbreekt: ${rel}`);
    continue;
  }
  const text = await readFile(file, 'utf8');
  // Een adres eindigt bij een haakje, spatie, anker, aanhalingsteken, backtick of `<` (zoals in `<pagina>.md`).
  for (const match of text.matchAll(new RegExp(`${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^)\\s#<>"\\x60]*)`, 'g'))) {
    checked++;
    const target = join(SITE, decodeURIComponent(match[1]) || 'index.html');
    if (!existsSync(target)) problems.push(`${rel}: ontbrekend doel: ${match[0]}`);
  }
}

const unique = (list) => [...new Set(list)];
if (problems.length) {
  for (const problem of unique(problems)) console.error(`fout  ${problem}`);
  console.error(`\n${unique(problems).length} probleem/problemen in ${pages.length} pagina's.`);
  process.exit(1);
}
console.log(`Geen kapotte interne links: ${checked} links en ankers in ${pages.length} pagina's gecontroleerd, ${DOWNLOADS.length} vaste downloads aanwezig.`);
