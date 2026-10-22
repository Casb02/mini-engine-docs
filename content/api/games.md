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
{ "status": "ok", "version": "0.2.0" }
```

`version` is de gebouwde versie van de engine.

## GET /api/v1/games

Alle geïnstalleerde spellen, met metadata en instellingenschema.

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
      "default_host_mode": "moderator"
    }
  ]
}
```

Ontbrekende manifestvelden krijgen hier hun standaardwaarde: `runtime: "host"`, `host_modes: ["moderator"]`, `default_host_mode: "moderator"` en `supports_late_join: true`. Alle velden staan bij [package en manifest](../game-bouwen/package-en-manifest.md#velden).

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
| `/` | Doorverwijzing naar `/demo` |
| `/demo` | De werkbank: kamers maken, meedoen, account |
| `/room/{code}/{role}` | De kamerinterface die de rolpagina van het spel laadt |
| `/static/{name}` | Bestanden uit de webmap van de engine |
