---
title: Je eerste game
description: Maak met me game new in vijf minuten een speelbaar stemspel, speel het met me dev op je eigen computer en pas het aan.
section: SDK
group: Aan de slag
order: 2
---

# Je eerste game

De Mini Engine SDK bevat een scaffolder die een compleet, speelbaar stemspel maakt, met een pagina voor de spelleider, een voor elke speler en een gedeeld scherm. De CLI levert dezelfde scaffolder mee als `me game new`, en speelt je spel met `me dev` meteen op je eigen computer. Daarna pas je het aan tot je eigen spel.

## Wat je nodig hebt

- Node.js 22 of nieuwer.
- De [me-CLI](../publiceren/cli.md).

```sh
npm install -g github:Casb02/mini-engine-cli
```

## In vijf minuten

```sh
me game new mijn-spel
cd mijn-spel
me dev
```

`me dev` opent een overzicht in je browser met de spelleider, het gedeelde scherm en twee spelers naast elkaar. Je speelt zelf mee: *Iedereen doet mee* (`playing`) is de standaardmodus van het voorbeeld, en je plek staat meteen klaar. Zet de twee spelers klaar, start de stemronde op de spelleiderspagina en stem op elke stoel. Sla je een bestand op, dan laden de stoelen opnieuw en blijft de kamer bestaan. Stoppen doe je met Ctrl+C.

Meer over `me dev`, en hoe je daarna op een echte server test, staat bij [testen](testen.md).

## De slug

De eerste parameter is de slug van je spel. Die wordt de id in het manifest en de naam van de map.

- Maximaal 48 tekens: kleine letters, cijfers en losse streepjes.
- Begint met een letter. Dus `mijn-spel` en `quiz2` mogen, `2quiz` en `mijn--spel` niet.
- De map mag nog niet bestaan. De scaffolder overschrijft nooit iets.
- De titel wordt afgeleid van de slug: `mijn-spel` wordt *Mijn Spel*.

Met `me game new mijn-spel --dir spellen/mijn-spel` kies je een andere map.

## Wat je krijgt

```text
mijn-spel/
  manifest.json         id, titel, spelers, instellingen, runtime
  host.html             pagina voor de spelleider
  player.html           pagina voor elke speler
  display.html          het gedeelde scherm
  assets/
    app.js              spelregels en weergave voor alle rollen
    style.css           opmaak
  jsconfig.json         alleen voor je editor: types voor /sdk/mini-engine.js
  types/
    mini-engine.d.ts    gebundelde typedeclaraties van de SDK
  README.md             uitleg bij dit spel
  .meignore             wat me game upload overslaat
```

Het stemspel is een complete game met `runtime: "host"`: de spelleider controleert stemmen, publiceert de stand, toont totalen aan alle rollen en ondersteunt meerdere rondes. Laat het spelleiderstabblad open tijdens het spelen.

## Waar pas je wat aan?

| Wil je | Pas aan |
| --- | --- |
| Een andere vraag of standaardinstellingen | `manifest.json`: `default_settings` en `settings_schema` |
| Andere spelregels | `assets/app.js`: de host-reducer |
| Een andere weergave | `host.html`, `player.html`, `display.html` en `assets/style.css` |
| Geheime speldata, zoals antwoorden | Een `data.json`, die alleen de host leest met `gameData()` |

## Typecontrole in je editor

`assets/app.js` is gewone JavaScript met JSDoc-types, dus de browser draait het zonder build. `jsconfig.json` koppelt de import `/sdk/mini-engine.js` aan de typedeclaraties in `types/`. VS Code en andere editors met TypeScript pakken dat vanzelf op. Vanuit een terminal:

```sh
npx -p typescript tsc -p jsconfig.json
```

Alleen bestanden onder `assets/` zijn publiek. `jsconfig.json` en `types/` staan in `.meignore`, dus `me game upload` laat ze thuis.

## Zonder de CLI

De scaffolder zit ook in het SDK-pakket, als `create-mini-game`. Die maakt hetzelfde spel, zonder `.meignore`:

```sh
npx -p @casb02/mini-engine-sdk create-mini-game mijn-spel
npx -p @casb02/mini-engine-sdk create-mini-game --help
```

Het pakket staat in GitHub Packages; zie [het SDK-overzicht](../sdk/overzicht.md#in-een-eigen-project) voor de eenmalige instelling. Met `--directory pad/naar/mijn-spel` kies je een andere map; de laatste mapnaam moet dan gelijk zijn aan de slug.

> Open gegenereerde HTML niet via `file://` of een losse static server. De pagina's hebben kamers, sessies, websockets en de SDK op `/sdk/mini-engine.js` nodig. `me dev` levert die op je eigen computer, net als Mini Engine online.

## Volgende stap

Lees hoe je [test](testen.md), hoe [een package en manifest](package-en-manifest.md) in elkaar zitten, of ga meteen naar [de browserhost schrijven](browserhost.md). Klaar om te spelen met vrienden? Zie [je game publiceren](../publiceren/overzicht.md).
