<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-donker.png">
  <img alt="Mini Engine Docs" src=".github/assets/banner-licht.png" width="100%">
</picture>

# Mini Engine Docs

De documentatiesite voor wie een spel bouwt voor Mini Engine: de SDK, de CLI, de API en het merk. Statische HTML, geen JavaScript-frameworks, op `https://docs.miniengine.nl/`.

Deze repository is publiek. De site gaat over de SDK, de CLI, de API die zij gebruiken en het merk. Zet hier geen sleutels, interne adressen, beheerroutes of details over hoe Mini Engine zelf draait of gehost wordt.

## Bouwen

Vereist Node.js 20 of nieuwer.

```sh
npm ci
node build.mjs
```

`build.mjs` zet `content/**/*.md` om naar `site/`, met `template.html` als enige sjabloon, en kopieert `static/` (stijl, lettertypes, logo's, favicon, downloads) mee. De afhankelijkheden zijn [marked](https://marked.js.org/) en highlight.js, allebei vastgezet.

## Lokaal bekijken

```sh
npm run serve          # of: node scripts/serve.mjs 4173
```

Open `http://localhost:4173/`. De server bedient de site ook op `http://localhost:4173/mini-engine-docs/`, zodat ook `404.html` klopt. `npx serve site` werkt ook, behalve voor de 404-pagina.

## Controleren

```sh
npm run check          # bouwen + linkcontrole
```

`scripts/check-links.mjs` volgt elke interne `href`, `src` en `srcset`, inclusief ankers, en controleert dat de vaste downloads er staan. Externe links slaat hij over. Een kapotte link of een ontbrekende download laat de controle falen.

## Schrijven

Elke pagina is een Markdown-bestand met front matter:

```markdown
---
title: Kamers en rollen
nav_title: Kamers en rollen      # optioneel, korter label in het menu
description: Eén zin voor zoekmachines en de meta-beschrijving.
section: SDK
group: Concepten                 # alleen in een sectie met groepen
order: 1
toc_depth: 3                     # optioneel: ook ###-koppen in "Op deze pagina"
toc: false                       # optioneel: geen inhoudsopgave
---
```

- Het menu heeft vijf secties, in deze volgorde: `Start`, `SDK`, `CLI`, `API` en `Branding` (`SECTIONS` in `build.mjs`).
- De sectie `SDK` is verdeeld in groepen: `Aan de slag`, `Een game bouwen`, `Concepten` en `Referentie` (`GROUPS` in `build.mjs`). Een pagina in die sectie moet een `group` hebben; andere secties hebben er geen. Binnen een groep of sectie sorteert `order`.
- Link naar andere pagina's met hun relatieve `.md`-pad, bijvoorbeeld `[runtimes](../concepten/runtimes.md)`. De build maakt er `.html` van en stopt bij een link naar een onbekende pagina.
- Gebruik `{{root}}` voor bestanden uit `static/`, bijvoorbeeld `{{root}}brand/woordmerk-licht.svg`.
- Koppen krijgen automatisch een id en een ankerlink. De inhoudsopgave verschijnt bij drie of meer `##`-koppen.
- Schrijf in het Nederlands, rustig en in zinnen, met sentence case. Merkregels: `content/branding.md`.

## Verhuisde pagina's

Verhuist een pagina, zet het oude adres dan in `REDIRECTS` in `build.mjs`, met de nieuwe `.md`-bron als doel. De build schrijft op het oude adres een kleine pagina die doorstuurt, en de linkcontrole volgt die. Een pagina die verdwijnt zonder opvolger geeft gewoon een 404.

## Downloads

De API-referentie (`static/downloads/MiniEngine-API-v0.6.pdf`, de openbare editie), het brandbook (`static/downloads/MiniEngine-Brandbook.pdf`) en de logobestanden (`static/downloads/MiniEngine-logos.zip`) staan in `DOWNLOADS` in `build.mjs`. De build en de linkcontrole falen als een ervan ontbreekt. De kop en de voettekst linken naar de pdf uit `PDF` in `build.mjs`; zet een nieuwe editie ernaast en pas `PDF` aan. De pdf komt uit het merkpakket en beschrijft alleen wat een client, een game of de CLI gebruikt.

## URL's en BASE

Alle pagina's linken relatief, dus de site werkt onder elk pad, ook als losse bestanden. Alleen `404.html` gebruikt absolute links, omdat hij op elk pad kan verschijnen. Die basis staat op één plek: `BASE` in `build.mjs` (standaard `/mini-engine-docs/`, of zet `DOCS_BASE`). Voor een eigen domein zonder pad: `DOCS_BASE=/ node build.mjs`.

## Publiceren

De site wordt gebouwd met `build.mjs` en gepubliceerd met GitHub Pages. Bij elke push naar `main` bouwt `.github/workflows/pages.yml` de site met `DOCS_BASE: /`, controleert de links en zet `site/` online. `site/` staat in `.gitignore`.

## Licenties

De lettertypes Space Grotesk en DM Sans vallen onder de SIL Open Font License 1.1; de licentieteksten staan naast de bestanden in `static/fonts/`. Logo's en kleuren komen uit het merkpakket van Mini Engine (merk v1.0).
