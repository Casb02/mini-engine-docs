#!/usr/bin/env node
// Bouwt de Mini Engine-documentatie: content/**/*.md + template.html → site/.
// Kleur in codeblokken komt tijdens de build (highlight.js); in de browser draait alleen static/site.js voor de kopieerknoppen.
import { readFile, writeFile, mkdir, readdir, rm, cp, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import http from 'highlight.js/lib/languages/http';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('bash', bash);
hljs.registerAliases(['sh', 'shell'], { languageName: 'bash' });
hljs.registerLanguage('http', http);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('yaml', yaml);
const CODE_LABELS = { sh: 'Shell', bash: 'Shell', shell: 'Shell', js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript', json: 'JSON', http: 'HTTP', yaml: 'YAML' };

const ROOT = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(ROOT, 'content');
const STATIC = join(ROOT, 'static');
const OUT = join(ROOT, 'site');

// De enige absolute basis-URL. Alleen 404.html gebruikt hem, omdat GitHub Pages die pagina
// op willekeurige diepte serveert. Alle andere pagina's linken relatief.
// Lokaal 404 testen: DOCS_BASE=/ node build.mjs (of gebruik `npm run serve`, dat beide paden bedient).
const BASE = process.env.DOCS_BASE ?? '/mini-engine-docs/';

// Volgorde van de secties in de navigatie. De `section` uit de front matter moet hierin staan.
const SECTIONS = [
  'Start',
  'Snel aan de slag',
  'Concepten',
  'Een game bouwen',
  'Publiceren',
  'SDK-referentie',
  'HTTP API',
  'Bouwen met AI',
  'Branding',
];

const PDF = 'downloads/MiniEngine-API-v0.3.pdf';
const VERSION = '0.3';

// ---------- helpers ----------

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function slugify(text) {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'sectie'
  );
}

const stripTags = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

function parseFrontMatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`${file}: front matter ontbreekt`);
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const pair = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!pair) throw new Error(`${file}: ongeldige front-matterregel: ${line}`);
    let value = pair[2].trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    else if (/^-?\d+(\.\d+)?$/.test(value)) value = Number(value);
    else if (value === 'true' || value === 'false') value = value === 'true';
    data[pair[1]] = value;
  }
  return { data, body: source.slice(match[0].length) };
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

const toPosix = (p) => p.split(sep).join('/');

/** Relatieve prefix naar de siteroot voor een uitvoerbestand, bijvoorbeeld '../'. */
const rootFor = (out) => '../'.repeat(out.split('/').length - 1);

// ---------- pagina's inlezen ----------

const files = await walk(CONTENT);
const pages = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const { data, body } = parseFrontMatter(source, file);
  const src = toPosix(relative(CONTENT, file));
  for (const key of ['title', 'description', 'section']) {
    if (!data[key]) throw new Error(`${src}: front matter mist '${key}'`);
  }
  if (!SECTIONS.includes(data.section)) throw new Error(`${src}: onbekende sectie '${data.section}'`);
  pages.push({
    src,
    out: src.replace(/\.md$/, '.html'),
    title: data.title,
    navTitle: data.nav_title || data.title,
    description: data.description,
    section: data.section,
    order: Number(data.order ?? 100),
    layout: data.layout || 'doc',
    toc: data.toc !== false,
    tocDepth: Number(data.toc_depth ?? 2),
    body,
  });
}
pages.sort(
  (a, b) =>
    SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) ||
    a.order - b.order ||
    a.src.localeCompare(b.src),
);
const bySrc = new Map(pages.map((page) => [page.src, page]));

// ---------- Markdown ----------

function renderMarkdown(page) {
  const headings = [];
  const used = new Set();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(stripTags(html));
        let n = 2;
        const base = id;
        while (used.has(id)) id = `${base}-${n++}`;
        used.add(id);
        if (depth === 1) return `<h1 id="${id}">${html}</h1>\n`;
        if (depth <= 3) headings.push({ depth, id, text: stripTags(html) });
        const anchor =
          depth <= 4
            ? ` <a class="anchor" href="#${id}" aria-label="Directe link naar ${escapeHtml(stripTags(html))}">#</a>`
            : '';
        return `<h${depth} id="${id}">${html}${anchor}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const language = (lang || '').trim().split(/\s+/)[0].toLowerCase();
        const cls = language ? ` class="hljs language-${escapeHtml(language)}"` : ' class="hljs"';
        const body = hljs.getLanguage(language)
          ? hljs.highlight(text, { language, ignoreIllegals: true }).value
          : escapeHtml(text);
        const label = CODE_LABELS[language];
        return `<div class="codeblock">${label ? `<span class="code-lang">${label}</span>` : ''}<button class="copy" type="button" hidden>Kopieer</button><pre class="code" tabindex="0"><code${cls}>${body}</code></pre></div>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const target = resolveHref(page, href);
        const external = /^https?:\/\//.test(target);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(target)}"${titleAttr}${external ? ' class="external"' : ''}>${text}</a>`;
      },
    },
  });
  let html = marked.parse(page.body.replace(/\{\{root\}\}/g, rootFor(page.out)));
  html = html
    .replace(/<table>/g, '<div class="table-wrap" tabindex="0"><table>')
    .replace(/<\/table>/g, '</table></div>');
  // Links in ruwe HTML-blokken (bijvoorbeeld op de startpagina) krijgen dezelfde .md → .html-vertaling.
  html = html.replace(/href="([^"#:]+\.md(?:#[^"]*)?)"/g, (_, href) => `href="${resolveHref(page, href)}"`);
  return { html, headings };
}

/** Vertaalt een relatieve .md-link naar het juiste relatieve .html-pad. */
function resolveHref(page, href) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href;
  const [path, hash] = href.split('#');
  if (!path.endsWith('.md')) return href;
  const targetSrc = posix.normalize(posix.join(posix.dirname(page.src), path));
  const target = bySrc.get(targetSrc);
  if (!target) throw new Error(`${page.src}: link naar onbekende pagina ${href}`);
  let rel = posix.relative(posix.dirname(page.out), target.out);
  return hash ? `${rel}#${hash}` : rel;
}

// ---------- template ----------

const template = await readFile(join(ROOT, 'template.html'), 'utf8');

function navHtml(current, root) {
  let html = '';
  for (const section of SECTIONS) {
    const items = pages.filter((page) => page.section === section);
    if (!items.length) continue;
    const list = items
      .map((page) => {
        const active = current && page.src === current.src;
        return `<li><a href="${root}${page.out}"${active ? ' aria-current="page"' : ''}>${escapeHtml(page.navTitle)}</a></li>`;
      })
      .join('');
    html += `<div class="nav-group"><p class="nav-heading">${escapeHtml(section)}</p><ul>${list}</ul></div>`;
  }
  return html;
}

function tocHtml(headings, depth) {
  const items = headings.filter((h) => h.depth <= depth);
  if (items.filter((h) => h.depth === 2).length < 3) return '';
  let html = '<ul>';
  let open = false;
  for (const h of items) {
    if (h.depth === 2) {
      if (open) html += '</ul></li>';
      html += `<li><a href="#${h.id}">${escapeHtml(h.text)}</a>`;
      const next = items[items.indexOf(h) + 1];
      if (next && next.depth === 3) {
        html += '<ul>';
        open = true;
      } else {
        html += '</li>';
        open = false;
      }
    } else {
      html += `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`;
    }
  }
  if (open) html += '</ul></li>';
  return html + '</ul>';
}

function pagerHtml(page, root) {
  const index = pages.indexOf(page);
  const prev = pages[index - 1];
  const next = pages[index + 1];
  if (!prev && !next) return '';
  const link = (target, rel, label) =>
    target
      ? `<a class="pager-${rel}" rel="${rel}" href="${root}${target.out}"><span class="pager-label">${label}</span><span class="pager-title">${escapeHtml(target.title)}</span></a>`
      : '<span></span>';
  return `<nav class="pager" aria-label="Vorige en volgende pagina">${link(prev, 'prev', 'Vorige')}${link(next, 'next', 'Volgende')}</nav>`;
}

function fill(values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`template: onbekende plaatshouder ${key}`);
    return values[key];
  });
}

function renderPage(page, { root, content, headings, isNotFound = false }) {
  const toc = page.toc ? tocHtml(headings, page.tocDepth) : '';
  const tocBlock = toc
    ? `<aside class="toc toc-wide" aria-labelledby="toc-wide-title"><p class="toc-title" id="toc-wide-title">Op deze pagina</p>${toc}</aside>`
    : '';
  const tocInline = toc
    ? `<details class="toc toc-inline"><summary>Op deze pagina</summary>${toc}</details>`
    : '';
  const crumbs =
    page.layout === 'home' || isNotFound
      ? ''
      : `<p class="crumb">${escapeHtml(page.section)}</p>`;
  return fill({
    root,
    title: escapeHtml(page.layout === 'home' ? 'Mini Engine Docs' : `${page.title} – Mini Engine Docs`),
    description: escapeHtml(page.description),
    nav: navHtml(isNotFound ? null : page, root),
    layout: page.layout,
    has_toc: toc ? 'with-toc' : 'without-toc',
    toc_inline: tocInline,
    toc: tocBlock,
    crumb: crumbs,
    content,
    pager: isNotFound ? '' : pagerHtml(page, root),
    pdf: `${root}${PDF}`,
    version: VERSION,
  });
}

// ---------- schrijven ----------

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
if (existsSync(STATIC)) await cp(STATIC, OUT, { recursive: true });
await writeFile(join(OUT, '.nojekyll'), '');

for (const page of pages) {
  const { html, headings } = renderMarkdown(page);
  const out = join(OUT, page.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, renderPage(page, { root: rootFor(page.out), content: html, headings }));
}

// 404: absolute links via BASE, omdat de pagina op elk pad kan verschijnen.
const notFound = {
  src: '404.md',
  out: '404.html',
  title: 'Pagina niet gevonden',
  description: 'Deze pagina bestaat niet (meer).',
  section: 'Start',
  layout: 'doc',
  toc: false,
};
const notFoundBody = `<h1 id="niet-gevonden">Deze pagina bestaat niet</h1>
<p class="lead">De link is oud of bevat een typfout. Kies een onderwerp in het menu, of begin opnieuw op de startpagina.</p>
<p><a class="button" href="${BASE}index.html">Naar de startpagina</a></p>`;
await writeFile(join(OUT, '404.html'), renderPage(notFound, { root: BASE, content: notFoundBody, headings: [], isNotFound: true }));

const pdfPresent = existsSync(join(OUT, PDF));
const size = (await stat(join(OUT, 'index.html'))).size;
console.log(
  `Gebouwd: ${pages.length} pagina's + 404.html naar ${toPosix(relative(process.cwd(), OUT)) || '.'}/ (index ${size} bytes).` +
    (pdfPresent ? '' : `\nLet op: ${PDF} ontbreekt nog; zet de pdf in static/${PDF}.`),
);
