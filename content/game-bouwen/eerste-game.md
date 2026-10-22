---
title: Je eerste game
description: Maak met create-mini-game in vijf minuten een speelbaar stemspel en speel het met een tweede apparaat.
section: Een game bouwen
order: 1
---

# Je eerste game

De Mini Engine SDK bevat een scaffolder, `create-mini-game`. Die maakt een compleet, speelbaar stemspel met een spelleiderspagina, een spelerspagina en een gedeeld scherm. Daarna pas je het aan tot je eigen spel.

## Wat je nodig hebt

- Node.js 22 of nieuwer.
- Een checkout van de openbare SDK-repository [`Casb02/mini-engine-sdk`](https://github.com/Casb02/mini-engine-sdk), of `me game new` uit de [CLI](../publiceren/cli.md).
- Een checkout van Mini Engine naast de SDK, bijvoorbeeld in `../mini-engine`.

## In vijf minuten

```sh
git clone git@github.com:Casb02/mini-engine-sdk.git
cd mini-engine-sdk
npm ci
npm run build
node bin/create-mini-game.mjs mijn-spel --directory ../mini-engine/games/mijn-spel
```

Herstart de engine vanuit de root van de engine-checkout:

```sh
cd ../mini-engine
cargo run
```

Open `/demo`, kies **Mijn Spel** en maak een kamer. Doe mee vanaf een tweede browser of apparaat, zet je klaar, en start de stemronde op de spelleiderspagina.

## De slug

De eerste parameter is de slug van je spel. Die wordt de id in het manifest en de naam van de map.

- Maximaal 48 tekens: kleine letters, cijfers en losse streepjes.
- Begint met een letter. Dus `mijn-spel` en `quiz2` mogen, `2quiz` en `mijn--spel` niet.
- Als je `--directory` opgeeft, moet de laatste mapnaam gelijk zijn aan de slug. De engine laadt een package alleen als map en manifest-id overeenkomen.
- De doelmap mag nog niet bestaan. De scaffolder overschrijft nooit iets.

```sh
node bin/create-mini-game.mjs ander-spel
node bin/create-mini-game.mjs ander-spel --directory /pad/naar/engine/games/ander-spel
node bin/create-mini-game.mjs --help
```

De titel wordt afgeleid van de slug: `mijn-spel` wordt *Mijn Spel*.

## Wat je krijgt

```text
games/mijn-spel/
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
```

Het stemspel is een complete hostruntime-game: de spelleider controleert stemmen, publiceert de stand, toont totalen aan alle rollen en ondersteunt meerdere rondes. Laat het spelleiderstabblad open tijdens het spelen.

## Waar pas je wat aan?

| Wil je | Pas aan |
| --- | --- |
| Een andere vraag of standaardinstellingen | `manifest.json`: `default_settings` en `settings_schema` |
| Andere spelregels | `assets/app.js`: de host-reducer |
| Een andere weergave | `host.html`, `player.html`, `display.html` en `assets/style.css` |
| Geheime speldata, zoals antwoorden | Een `data.json`, die alleen de host via een beveiligde route leest |

Herstart de engine na elke wijziging aan het package.

## Typecontrole in je editor

`assets/app.js` is gewone JavaScript met JSDoc-types, dus de browser draait het zonder build. `jsconfig.json` koppelt de import `/sdk/mini-engine.js` aan de typedeclaraties van de SDK. Binnen een engine-checkout gebruikt het de kopie van de engine (`web/mini-engine.d.ts`), elders de gebundelde kopie in `types/`. VS Code en andere editors met TypeScript pakken dat vanzelf op. Vanuit een terminal:

```sh
npx -p typescript tsc -p jsconfig.json
```

De engine serveert alleen bestanden onder `assets/`; `jsconfig.json` en `types/` negeert hij.

## Installeren vanuit een tarball

Wil je de SDK in een ander project gebruiken zonder de repository, maak dan een lokaal pakket:

```sh
# in de SDK-checkout
npm pack

# in je eigen project
npm install /absoluut/pad/naar/mini-engine-sdk/casb02-mini-engine-sdk-0.3.1.tgz
npx create-mini-game mijn-spel --directory /pad/naar/engine/games/mijn-spel
```

`npx` gebruikt hier de lokaal geïnstalleerde CLI. Het pakket staat niet op npm.

> Open gegenereerde HTML niet via `file://` of een losse static server. De engine levert de API, de kamersessies, de websockets en de assetroutes.

## Volgende stap

Lees hoe [een package en manifest](package-en-manifest.md) in elkaar zitten, of ga meteen naar [de browserhost schrijven](browserhost.md).
