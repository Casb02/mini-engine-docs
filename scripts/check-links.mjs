#!/usr/bin/env node
// Controleert alle interne links en ankers in site/. Externe links worden overgeslagen.
// Gebruik: node scripts/check-links.mjs [--allow-missing-pdf]
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const BASE = process.env.DOCS_BASE ?? '/mini-engine-docs/';
const PDF = (await readFile(join(ROOT, 'build.mjs'), 'utf8')).match(/^const PDF = '([^']+)';$/m)[1];
const allowMissingPdf = process.argv.includes('--allow-missing-pdf');

if (!existsSync(SITE)) {
  console.error('site/ bestaat niet. Draai eerst: node build.mjs');
  process.exit(1);
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const pages = await walk(SITE);
const idCache = new Map();
async function idsOf(file) {
  if (!idCache.has(file)) {
    const html = await readFile(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

const problems = [];
const warnings = [];
let checked = 0;

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
      const isPdf = relative(SITE, target).split(sep).join('/') === PDF;
      (isPdf && allowMissingPdf ? warnings : problems).push(`${rel}: ontbrekend doel: ${raw}`);
      continue;
    }
    if (hash && target.endsWith('.html')) {
      const ids = await idsOf(target);
      if (!ids.has(decodeURIComponent(hash))) problems.push(`${rel}: onbekend anker #${hash} in ${raw}`);
    }
  }
}

const unique = (list) => [...new Set(list)];
if (warnings.length) console.warn(`waarschuwing  ${PDF} ontbreekt nog (${warnings.length} verwijzingen). Zet de pdf in static/${PDF} en bouw opnieuw.`);
if (problems.length) {
  for (const problem of unique(problems)) console.error(`fout  ${problem}`);
  console.error(`\n${unique(problems).length} kapotte interne link(s) in ${pages.length} pagina's.`);
  process.exit(1);
}
console.log(`Geen kapotte interne links: ${checked} links en ankers in ${pages.length} pagina's gecontroleerd.`);
