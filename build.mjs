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
const SECTIONS = ['Start', 'SDK', 'CLI', 'API', 'Branding'];

// Optionele groepen binnen een sectie, in menuvolgorde. Een sectie met groepen vraagt een `group` per pagina.
const GROUPS = {
  SDK: ['Aan de slag', 'Een game bouwen', 'Concepten', 'Referentie'],
};

// De API-referentie als pdf: de openbare editie. Kop- en voettekst linken ernaar.
const PDF = 'downloads/MiniEngine-API-v0.6.pdf';

// Downloads die altijd in static/ moeten staan. De build en de linkcontrole falen zonder.
const DOWNLOADS = [PDF, 'downloads/MiniEngine-Brandbook.pdf', 'downloads/MiniEngine-logos.zip'];

// Oude adressen die naar een andere pagina zijn verhuisd. Elk krijgt een kleine doorverwijspagina.
// Pagina's die zijn verdwenen (zoals het hosten van de engine en api/beheer) staan hier niet; die geven 404.
const REDIRECTS = {
  'start/een-avond.html': 'index.md',
  'aan-de-slag/eerste-kamer.html': 'concepten/kamers-en-rollen.md#een-kamer-op-miniengine-nl',
};

const VERSION = '0.9';

// Het publieke adres van de site. Alleen de Markdown voor agents gebruikt het: een agent die één .md-bestand
// of llms-full.txt krijgt, kan dan toch elke link volgen.
const SITE_URL = 'https://docs.miniengine.nl/';

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
  const groups = GROUPS[data.section];
  if (groups && !groups.includes(data.group)) throw new Error(`${src}: sectie '${data.section}' vraagt een group uit ${groups.join(', ')}`);
  if (!groups && data.group) throw new Error(`${src}: sectie '${data.section}' heeft geen groepen`);
  pages.push({
    src,
    out: src.replace(/\.md$/, '.html'),
    title: data.title,
    navTitle: data.nav_title || data.title,
    description: data.description,
    section: data.section,
    group: data.group || null,
    order: Number(data.order ?? 100),
    layout: data.layout || 'doc',
    toc: data.toc !== false,
    tocDepth: Number(data.toc_depth ?? 2),
    body,
  });
}
const groupIndex = (page) => (page.group ? GROUPS[page.section].indexOf(page.group) : 0);
pages.sort(
  (a, b) =>
    SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) ||
    groupIndex(a) - groupIndex(b) ||
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

/** De pagina achter een relatieve .md-link, of null voor een link naar iets anders. Stopt bij een onbekende pagina. */
function targetOf(page, href) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return null;
  const [path, hash] = href.split('#');
  if (!path.endsWith('.md')) return null;
  const target = bySrc.get(posix.normalize(posix.join(posix.dirname(page.src), path)));
  if (!target) throw new Error(`${page.src}: link naar onbekende pagina ${href}`);
  return { target, hash };
}

/** Vertaalt een relatieve .md-link naar het juiste relatieve .html-pad. */
function resolveHref(page, href) {
  const found = targetOf(page, href);
  if (!found) return href;
  const rel = posix.relative(posix.dirname(page.out), found.target.out);
  return found.hash ? `${rel}#${found.hash}` : rel;
}

// ---------- Markdown voor agents ----------

/** Waarde van een HTML-attribuut, of ''. */
const attrOf = (attrs, name) => attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1] ?? '';

/** Haalt elk element met role="img" weg en laat alleen zijn beschrijving staan. Telt geneste tags van dezelfde naam mee. */
function describeImages(html) {
  const open = /<(\w+)(\s[^>]*\srole="img"[^>]*)>/;
  let match;
  while ((match = html.match(open))) {
    const [tag, name, attrs] = match;
    const tags = new RegExp(`<(/?)${name}\\b[^>]*>`, 'g');
    tags.lastIndex = match.index + tag.length;
    let depth = 1;
    let end = html.length;
    for (let next; depth && (next = tags.exec(html)); ) {
      depth += next[1] ? -1 : 1;
      if (!depth) end = next.index + next[0].length;
    }
    html = `${html.slice(0, match.index)}<p>*Afbeelding: ${attrOf(attrs, 'aria-label')}*</p>${html.slice(end)}`;
  }
  return html;
}

/** Ruwe HTML uit een pagina als leesbare Markdown. Kent alleen wat de pagina's gebruiken: lijsten, links met een titel
 * en een uitleg, afbeeldingen, nadruk en code. */
function htmlToMarkdown(html) {
  const decode = (text) => text.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  let text = describeImages(html)
    // Een link met een titel en een uitleg, zoals de routes op de startpagina en de downloads, wordt één lijstregel.
    .replace(/<li[^>]*>\s*(?=<a\s[^>]*>\s*<strong>)/g, '')
    .replace(/<a\s([^>]*)>\s*<strong>([\s\S]*?)<\/strong>\s*<span>([\s\S]*?)<\/span>\s*<\/a>/g, (_, attrs, title, about) => `<li>[${title}](${attrOf(attrs, 'href')}): ${about}</li>`)
    .replace(/<a\s([^>]*)>([\s\S]*?)<\/a>/g, (_, attrs, inner) => `[${inner}](${attrOf(attrs, 'href')})`)
    .replace(/<img\s([^>]*)>/g, (_, attrs) => (attrOf(attrs, 'alt') ? `![${attrOf(attrs, 'alt')}](${attrOf(attrs, 'src')})` : ''))
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, '**$2** ')
    .replace(/<code>([\s\S]*?)<\/code>/g, '`$1` ')
    .replace(/<figcaption>([\s\S]*?)<\/figcaption>/g, ' ($1)')
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (_, items) => {
      let n = 0;
      return items.replace(/<li[^>]*>/g, () => `\n${++n}. `);
    })
    .replace(/<li[^>]*>/g, '\n- ')
    .replace(/<\/(p|ul|ol|div)>/g, '\n\n')
    .replace(/<[^>]+>/g, ' ');
  text = decode(text)
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').replace(/ ([.,:;)])/g, '$1').trim())
    .join('\n');
  // Lijstregels horen bij elkaar; elk ander blok staat los.
  return text.replace(/\n{3,}/g, '\n\n').replace(/^(- .*|\d+\. .*)\n\n(?=- |\d+\. )/gm, '$1\n').trim();
}

/** De tekst van een pagina als Markdown voor agents: ruwe HTML omgezet, links absoluut en naar de .md-versies. */
function agentMarkdown(page) {
  const absolute = (href) => {
    const found = targetOf(page, href);
    if (found) return `${SITE_URL}${found.target.src}${found.hash ? `#${found.hash}` : ''}`;
    return href;
  };
  const tokens = new Marked({ gfm: true }).lexer(page.body.replace(/\{\{root\}\}/g, SITE_URL));
  let text = '';
  for (const token of tokens) {
    if (token.type === 'code') text += token.raw;
    else if (token.type === 'html') text += `${htmlToMarkdown(token.raw)}\n\n`;
    else text += token.raw;
  }
  // Codeblokken blijven zoals ze zijn; daarbuiten wijst elke link naar de .md-versie op de site.
  return text
    .split(/(```[\s\S]*?```)/)
    .map((part, i) => (i % 2 ? part : part.replace(/\]\(([^)\s]+)\)/g, (_, href) => `](${absolute(href)})`)))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Waar een pagina hoort in het menu, als één regel. */
const placeOf = (page) => (page.group ? `${page.section} · ${page.group}` : page.section);
const mdOut = (page) => page.out.replace(/\.html$/, '.md');

// ---------- template ----------

const template = await readFile(join(ROOT, 'template.html'), 'utf8');

function navHtml(current, root) {
  const list = (items) =>
    `<ul>${items
      .map((page) => {
        const active = current && page.src === current.src;
        return `<li><a href="${root}${page.out}"${active ? ' aria-current="page"' : ''}>${escapeHtml(page.navTitle)}</a></li>`;
      })
      .join('')}</ul>`;
  let html = '';
  for (const section of SECTIONS) {
    const items = pages.filter((page) => page.section === section);
    if (!items.length) continue;
    let body = '';
    if (GROUPS[section]) {
      for (const group of GROUPS[section]) {
        const inGroup = items.filter((page) => page.group === group);
        if (inGroup.length) body += `<p class="nav-subheading">${escapeHtml(group)}</p>${list(inGroup)}`;
      }
    } else {
      body = list(items);
    }
    html += `<div class="nav-group"><p class="nav-heading">${escapeHtml(section)}</p>${body}</div>`;
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
  const markdown = isNotFound ? '' : `${root}${mdOut(page)}`;
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
      : `<p class="crumb">${escapeHtml(page.group ? `${page.section} · ${page.group}` : page.section)}</p>`;
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
    alternate: markdown ? `<link rel="alternate" type="text/markdown" href="${markdown}" title="Deze pagina als Markdown">` : '',
    agents: markdown
      ? `Voor AI-agents: <a href="${markdown}">deze pagina als Markdown</a>, en <a href="${root}llms.txt">llms.txt</a> met alle pagina's.`
      : `Voor AI-agents: <a href="${root}llms.txt">llms.txt</a> met alle pagina's als Markdown.`,
  });
}

/** Een kleine doorverwijspagina voor een oud adres. Het doel is een .md-bron, zodat de build het controleert. */
function redirectHtml(from, to) {
  const [path, hash] = to.split('#');
  const target = bySrc.get(path);
  if (!target) throw new Error(`REDIRECTS: ${from} wijst naar onbekende pagina ${to}`);
  if (bySrc.has(from.replace(/\.html$/, '.md'))) throw new Error(`REDIRECTS: ${from} bestaat nog als pagina`);
  const rel = posix.relative(posix.dirname(from), target.out) + (hash ? `#${hash}` : '');
  const href = escapeHtml(rel);
  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${href}">
  <title>Verplaatst – Mini Engine Docs</title>
</head>
<body>
  <p>Deze pagina is verplaatst naar <a href="${href}">${escapeHtml(target.title)}</a>.</p>
</body>
</html>
`;
}

// ---------- schrijven ----------

const missing = DOWNLOADS.filter((file) => !existsSync(join(STATIC, file)));
if (missing.length) throw new Error(`Ontbrekende downloads in static/: ${missing.join(', ')}`);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
if (existsSync(STATIC)) await cp(STATIC, OUT, { recursive: true });
await writeFile(join(OUT, '.nojekyll'), '');

for (const [from, to] of Object.entries(REDIRECTS)) {
  const out = join(OUT, from);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, redirectHtml(from, to));
}

// Elke pagina twee keer: als HTML voor mensen en als Markdown voor agents, op hetzelfde pad met .md.
const agentPages = [];
for (const page of pages) {
  const { html, headings } = renderMarkdown(page);
  const out = join(OUT, page.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, renderPage(page, { root: rootFor(page.out), content: html, headings }));
  const text = agentMarkdown(page);
  agentPages.push({ page, text });
  const head = ['---', `title: ${JSON.stringify(page.title)}`, `description: ${JSON.stringify(page.description)}`, `section: ${JSON.stringify(placeOf(page))}`, `url: ${SITE_URL}${page.out}`, '---'];
  await writeFile(join(OUT, mdOut(page)), `${head.join('\n')}\n\n${text}\n`);
}

// llms.txt (zie llmstxt.org): de inhoudsopgave voor agents, per sectie en groep in menuvolgorde. llms-full.txt: alles in één bestand.
const intro = `> Documentatie voor wie een spel bouwt voor Mini Engine (miniengine.nl): de SDK, de CLI, de API en het merk. Editie ${VERSION}. Elke pagina staat hier als Markdown; de HTML-versie staat op hetzelfde pad met .html.`;
let index = `# Mini Engine Docs\n\n${intro}\n\nAlle pagina's in één bestand: ${SITE_URL}llms-full.txt\n`;
let place = '';
for (const { page } of agentPages) {
  if (placeOf(page) !== place) {
    place = placeOf(page);
    index += `\n## ${place}\n\n`;
  }
  index += `- [${page.title}](${SITE_URL}${mdOut(page)}): ${page.description}\n`;
}
await writeFile(join(OUT, 'llms.txt'), index);
const full = agentPages.map(({ page, text }) => `<!-- ${SITE_URL}${mdOut(page)} · ${placeOf(page)} -->\n\n${text}`);
await writeFile(join(OUT, 'llms-full.txt'), `# Mini Engine Docs\n\n${intro}\n\n${full.join('\n\n')}\n`);

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

const size = (await stat(join(OUT, 'index.html'))).size;
console.log(
  `Gebouwd: ${pages.length} pagina's (ook als .md, met llms.txt en llms-full.txt), ${Object.keys(REDIRECTS).length} doorverwijzingen en 404.html naar ${toPosix(relative(process.cwd(), OUT)) || '.'}/ (index ${size} bytes).`,
);
