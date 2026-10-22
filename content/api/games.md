---
title: Spellen en assets
description: De openbare routes voor gezondheid, de spellencatalogus, rolpagina's, gameassets en de SDK-bundle.
section: HTTP API
order: 2
toc_depth: 3
---

# Spellen en assets

Deze routes zijn openbaar en hebben geen sleutel nodig.

## GET /api/health

```json
{ "status": "ok", "version": "0.5.1" }
```

`version` is de gebouwde versie van de engine.

## GET /api/v1/games

Alle spellen die aanstaan, met metadata, instellingenschema, icoon, achievements en soorten sets.

```json
{
  "games": [
    {
      "id": "jeopardy",
      "title": "Jeopardy",
      "description": "Kies een vraag, druk als eerste en speel samen voor de punten. Eén team, meerdere buzzers.",
      "version": "2.0.0",
      "min_players": 1,
      "max_players": 100,
      "has_display": true,
      "supports_late_join": false,
      "default_settings": { "team_count": 3 },
      "settings_schema": {
        "type": "object",
        "properties": { "team_count": { "type": "integer", "minimum": 2, "maximum": 6 } },
        "required": ["team_count"],
        "additionalProperties": false
      },
      "runtime": "server",
      "host_modes": ["moderator"],
      "default_host_mode": "moderator",
      "achievements": [
        { "id": "eerste-antwoord", "title": "Eerste goede antwoord", "description": "Geef een goed antwoord in een show." },
        { "id": "winnaar", "title": "Winnaar", "description": "Win een show met je team." },
        { "id": "foutloos", "title": "Foutloos", "description": "Geef minstens drie goede antwoorden in één show, zonder fout." },
        { "id": "eigen-bord", "title": "Eigen bord", "description": "Speel een show op een eigen vragenbord." }
      ],
      "set_kinds": [
        {
          "id": "board",
          "title": "Vragenbord",
          "description": "Eén tot zes categorieën met elk vijf vragen.",
          "schema": {
            "type": "object",
            "properties": { "categories": { "type": "array", "minItems": 1, "maxItems": 6, "items": { "…": "…" } } },
            "required": ["categories"],
            "additionalProperties": false
          }
        }
      ]
    }
  ]
}
```

Ontbrekende manifestvelden krijgen hier hun standaardwaarde: `runtime: "host"`, `host_modes: ["moderator"]`, `default_host_mode: "moderator"`, `supports_late_join: true`, en lege lijsten voor `achievements` en `set_kinds`. Alle velden staan bij [package en manifest](../game-bouwen/package-en-manifest.md#velden). Het volledige schema van het vragenbord staat bij [eigen sets](../concepten/eigen-sets.md#het-schemadialect).

`icon` staat er sinds 0.5.1, precies zoals het manifest het opgeeft, bijvoorbeeld `"icon": "assets/icon.svg"`. Heeft het spel geen icoon, dan ontbreekt het veld; de ingebouwde spellen hebben er geen. Laad het icoon van het gewone assetadres van de actieve versie, `/games/{id}/{icon}?v={version}`, en toon het als `<img alt="">`, zodat een script in de SVG nooit draait. De regels staan bij [package en manifest](../game-bouwen/package-en-manifest.md#icon).

```json
{ "id": "vier-pionnen", "title": "Vier pionnen", "version": "0.2.0", "icon": "assets/icon.svg", "…": "…" }
```

`achievements` en `set_kinds` zijn er sinds 0.5. Ze komen uit de actieve versie van het spel. Een kamer die een oudere versie speelt, gebruikt de achievements en soorten sets van die versie.

## GET /api/v1/games/{id}

De metadata van één spel, in dezelfde vorm als een item hierboven. Onbekend: `404 game_not_found`.

## GET /api/v1/games/{id}/{role}

De HTML van de rolpagina: `host`, `player` of `display`. De kamerinterface laadt deze route in een iframe met `?room=CODE`. Bestaat de pagina niet: `404 game_page_not_found`.

## GET /games/{id}/assets/{path}

Een publiek bestand uit de map `assets/` van het spel, met een Content-Type op basis van de extensie. Paden met `.`, `..`, lege delen of backslashes worden geweigerd. Onbekend: `404 asset_not_found`.

## GET /sdk/mini-engine.js

De SDK-bundle die de engine serveert. Spelpagina's importeren hem met:

```js
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';
```

## Pagina's van de engine

| Pad | Inhoud |
| --- | --- |
| `/` | Doorverwijzing naar `/home` |
| `/home` | De startpagina: een kamercode invullen of een spel kiezen. Bij meer dan vier spellen staan er drie willekeurige, met een knop *Bekijk alle N spellen* |
| `/home/spellen` | Alle spellen die aanstaan (sinds 0.5.1) |
| `/home/new/{id}` | Een kamer maken voor een spel; een onbekend spel geeft 404 |
| `/home/join` | Meedoen met een naam, met `?room=CODE` |
| `/home/account` | Inloggen, een account maken, resultaten en achievements; sinds 0.5.1 ook **Mijn spellen** voor wie zelf spellen uploadde |
| `/home/sets`, `/home/sets/{id}` | Mijn sets: eigen sets bekijken, maken en bewerken (sinds 0.5) |
| `/demo/…` | Oude adressen; ze sturen door naar hetzelfde pad onder `/home`, met de query erbij |
| `/room/{code}/{role}` | De kamerinterface die de rolpagina van het spel laadt |
| `/static/{name}` | Bestanden uit de webmap van de engine |
