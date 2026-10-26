---
title: Spellen en assets
description: De openbare routes voor gezondheid, de spellencatalogus, rolpagina's, gameassets en de SDK-bundle.
section: API
order: 2
toc_depth: 3
---

# Spellen en assets

Deze routes zijn openbaar en hebben geen sleutel nodig.

## GET /api/health

```json
{ "status": "ok", "version": "0.8.1" }
```

`version` is de versie van Mini Engine op de server. `me doctor` toont hem ook; zie [upgraden](../upgraden.md#eerst-welke-versie-heb-ik).

## GET /api/v1/games

Alle spellen die aanstaan, met metadata, instellingenschema, icoon, achievements en soorten sets, en sinds 0.7 de uitgelichte spellen. Hier het ingebouwde Common Dice en een ingekort geüpload spel:

```json
{
  "games": [
    {
      "id": "common-dice",
      "title": "Common Dice",
      "description": "Eén worp voor de hele tafel. Stel je dobbelstenen in en laat iedereen meedoen.",
      "version": "2.0.0",
      "min_players": 1,
      "max_players": 100,
      "has_display": true,
      "supports_late_join": true,
      "default_settings": { "dice_count": 5, "sides": 6, "roll_permission": "everyone", "theme": "ivory" },
      "settings_schema": {
        "type": "object",
        "properties": {
          "dice_count": { "type": "integer", "minimum": 1, "maximum": 20 },
          "sides": { "type": "integer", "enum": [4, 6, 8, 10, 12, 20] },
          "roll_permission": { "type": "string", "enum": ["everyone", "owner"] },
          "theme": { "type": "string", "enum": ["ivory", "obsidian", "candy"] }
        },
        "required": ["dice_count", "sides", "roll_permission", "theme"],
        "additionalProperties": false
      },
      "runtime": "server",
      "host_modes": ["moderator", "playing", "hostless"],
      "default_host_mode": "hostless",
      "achievements": [
        { "id": "dubbel-zes", "title": "Dubbel zes", "description": "Gooi minstens twee zessen in één worp." },
        { "id": "hoogste-worp", "title": "Hoogste worp", "description": "Gooi de hoogste worp van de ronde." }
      ],
      "set_kinds": []
    },
    {
      "id": "quiz-bij-dani",
      "title": "Quiz bij Dani",
      "version": "0.2.0",
      "runtime": "host",
      "host_modes": ["playing", "tv"],
      "default_host_mode": "playing",
      "icon": "assets/icon.svg",
      "author": "Dani",
      "set_kinds": [
        {
          "id": "questions",
          "title": "Vragenlijst",
          "description": "Eén vraag per regel: de vraag, het goede antwoord en daarna de foute, gescheiden door |.",
          "schema": {
            "type": "object",
            "properties": { "questions": { "type": "array", "minItems": 3, "maxItems": 100, "items": { "type": "string", "minLength": 5, "maxLength": 300 } } },
            "required": ["questions"],
            "additionalProperties": false
          }
        }
      ],
      "…": "…"
    }
  ],
  "featured": ["quiz-bij-dani"]
}
```

Ontbrekende manifestvelden krijgen hier hun standaardwaarde: `runtime: "host"`, `host_modes: ["moderator"]`, `default_host_mode: "moderator"`, `supports_late_join: true`, en lege lijsten voor `achievements` en `set_kinds`. Alle velden staan bij [package en manifest](../game-bouwen/package-en-manifest.md#velden). Het schemadialect voor soorten sets staat bij [eigen sets](../concepten/eigen-sets.md#het-schemadialect).

`featured` is er sinds 0.7: de id's van hoogstens vier uitgelichte spellen, in de volgorde waarin de site ze toont. Er staan alleen spellen in die nu speelbaar zijn, dus elk id staat ook in `games`. Wie de site beheert, kiest ze; als ontwikkelaar stel je dat niet in. De types van SDK 0.6.0 en 0.7.0 kennen `featured` nog niet: `getGames()` heeft het type `{ games: Manifest[] }`.

`icon` staat er sinds 0.5.1, precies zoals het manifest het opgeeft, bijvoorbeeld `"icon": "assets/icon.svg"`. Heeft het spel geen icoon, dan ontbreekt het veld; ook Common Dice heeft er geen. Laad het icoon van het gewone assetadres van de actieve versie, `/games/{id}/{icon}?v={version}`, en toon het als `<img alt="">`, zodat een script in de SVG nooit draait. De regels staan bij [package en manifest](../game-bouwen/package-en-manifest.md#icon).

```json
{ "id": "vier-pionnen", "title": "Vier pionnen", "version": "0.2.0", "icon": "assets/icon.svg", "…": "…" }
```

Sinds 0.6.1 heeft een geüpload spel ook `author`: de weergavenaam van het account dat het uploadde. De server zet dat veld, en een `author` in het manifest wordt genegeerd. Het ingebouwde spel heeft het veld niet. De site toont het als "door …" op de spelkaart en "Gemaakt door …" op de pagina voor een nieuwe kamer.


`achievements` en `set_kinds` zijn er sinds 0.5. Ze komen uit de actieve versie van het spel. Een kamer die een oudere versie speelt, gebruikt de achievements en soorten sets van die versie.

## GET /api/v1/games/{id}

De metadata van één spel, in dezelfde vorm als een item hierboven. Onbekend: `404 game_not_found`.

## GET /api/v1/games/{id}/{role}

De HTML van de rolpagina: `host`, `player` of `display`. De kamerinterface laadt deze route in een iframe met `?room=CODE`. Bestaat de pagina niet: `404 game_page_not_found`.

## GET /games/{id}/assets/{path}

Een publiek bestand uit de map `assets/` van het spel, met een Content-Type op basis van de extensie. Paden met `.`, `..`, lege delen of backslashes worden geweigerd. Onbekend: `404 asset_not_found`.

## GET /sdk/mini-engine.js

De SDK-bundle die de server serveert. Spelpagina's importeren hem met:

```js
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';
```

## Pagina's van Mini Engine

| Pad | Inhoud |
| --- | --- |
| `/` | Doorverwijzing naar `/home` |
| `/home` | De startpagina: meedoen met een kamercode in zes tegels, of een spel kiezen uit de spelkaarten. Sinds 0.7 staan de uitgelichte spellen eerst, aangevuld tot vier spellen; bij meer spellen is die aanvulling willekeurig, met een link naar `/home/games` |
| `/home/games` | Alle spellen die aanstaan, als kaarten: icoon, maker, de eerste zin van de beschrijving, aantal spelers, tv, eigen sets en achievements. De hele kaart opent `/home/new/{id}`. Sinds 0.7 staan de uitgelichte spellen bovenaan, en zoekt een zoekveld in titel, beschrijving, maker en id, zonder op hoofdletters of accenten te letten; de zoekopdracht staat in `?q=`. Tot 0.6.1 heette deze pagina `/home/spellen` |
| `/home/new/{id}` | Een kamer maken voor een spel, met links de kaart en de hele beschrijving; een onbekend spel geeft 404 |
| `/home/join` | Meedoen met een naam, met `?room=CODE` |
| `/home/account` | Inloggen, een account maken, resultaten en achievements; sinds 0.5.1 ook **Mijn spellen** voor wie zelf spellen uploadde |
| `/home/sets`, `/home/sets/{id}` | Mijn sets: eigen sets bekijken, maken en bewerken (sinds 0.5). Na het bewaren opent `/home/sets/{id}?saved` |
| `/demo/…` | Oude adressen; ze sturen door naar hetzelfde pad onder `/home`, met de query erbij |
| `/room/{code}/{role}` | De kamerinterface die de rolpagina van het spel in een iframe laadt. Ze houdt het scherm aan (sinds 0.6.1), maakt het iframe zo groot als het zichtbare deel van het venster en neemt de `theme-color` van het spel over (sinds 0.6.5). Met `?wake` toont ze hoe dat gaat. Een host- of spelerslink in een tabblad zonder die plek gaat naar de andere rol van dat tabblad, of naar `/home/join?room=CODE` (sinds 0.6.4). Zie [pagina's per rol](../game-bouwen/rolpaginas.md#hoe-een-pagina-laadt) |
| `/og/games/{id}.png` | Sinds 0.6.1: de deelafbeelding van een spel dat aanstaat, getekend uit het icoon, de titel en het aantal spelers. Zie [linkvoorbeelden](../publiceren/overzicht.md#linkvoorbeelden) |
| `/og/rooms/{code}.png` | Sinds 0.6.1: de afbeelding bij een uitnodiging voor een bestaande kamer, met de titel van het spel en de code |
