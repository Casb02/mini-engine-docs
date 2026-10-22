---
title: Package en manifest
description: De mapstructuur van een gamepackage, alle velden van manifest.json, het settings_schema en de grenzen die de engine bij het opstarten controleert.
section: Een game bouwen
order: 2
toc_depth: 3
---

# Package en manifest

Een spel is een map in `games/` van de engine (of de map uit `MINI_ENGINE_GAMES`). De engine laadt alle packages bij het opstarten en weigert te starten als er een ongeldig package tussen zit.

## Mapstructuur

```text
games/mijn-spel/
  manifest.json      verplicht
  host.html          verplicht
  player.html        verplicht
  display.html       verplicht bij has_display: true
  assets/            publieke bestanden: scripts, stijl, beelden, geluid
  data.json          optioneel: geheime speldata voor de host
```

- De mapnaam is gelijk aan de `id` in het manifest: 1 tot 48 kleine ASCII-letters, cijfers of streepjes.
- Alleen bestanden onder `assets/` zijn publiek, op `/games/{id}/assets/…`.
- `data.json` leest alleen de host, via `GET /api/v1/rooms/{code}/game-data`. Zet antwoorden daar, nooit in `assets/` of in de HTML.
- Symlinks zijn niet toegestaan, net als bestanden die buiten de map wijzen.

### Grenzen van een package

| Grens | Waarde |
| --- | --- |
| Eén bestand | maximaal 2 MiB |
| Hele package | maximaal 10 MiB |
| Aantal bestanden | maximaal 4096 |
| Mapdiepte | maximaal 32 niveaus |

## Het manifest

Het manifest van het stemspel uit de scaffolder:

```json
{
  "id": "mijn-spel",
  "title": "Mijn Spel",
  "description": "A ready-to-play yes/no vote game. Customize the question and start voting.",
  "version": "0.1.0",
  "runtime": "host",
  "host_modes": ["moderator"],
  "default_host_mode": "moderator",
  "min_players": 1,
  "max_players": 24,
  "has_display": true,
  "default_settings": { "prompt": "Should we play another round?", "allow_change": true },
  "settings_schema": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string", "maxLength": 120 },
      "allow_change": { "type": "boolean" }
    },
    "required": ["prompt", "allow_change"],
    "additionalProperties": false
  }
}
```

### Velden

| Veld | Type | Regel |
| --- | --- | --- |
| `id` | string | Gelijk aan de mapnaam |
| `title` | string | Niet leeg, maximaal 200 bytes |
| `description` | string | Maximaal 4000 bytes |
| `version` | string | Niet leeg, maximaal 100 bytes |
| `min_players` | getal | Minstens 1 en niet groter dan `max_players` |
| `max_players` | getal | Maximaal 100 |
| `has_display` | boolean | `true` vraagt een `display.html` |
| `default_settings` | object | Moet voldoen aan `settings_schema` |
| `settings_schema` | object | Zie hieronder |
| `runtime` | `"host"` of `"server"` | Standaard `"host"` |
| `host_modes` | lijst | Standaard `["moderator"]`; bij `runtime: "host"` precies `["moderator"]` |
| `default_host_mode` | string | Standaard `"moderator"`; moet in `host_modes` staan |
| `supports_late_join` | boolean | Standaard `true` voor oudere manifests |

Kies `supports_late_join` voor een nieuw spel bewust. De kamer zet later aansluiten pas aan met `allow_late_join: true`, en de engine weigert dat als het spel het niet ondersteunt.

`runtime: "server"` kan alleen voor de ingebouwde spellen `common-dice` en `jeopardy`. Een manifest alleen installeert geen serverregels.

## settings_schema

Het instellingenschema is een kleine, strikte subset van JSON Schema. De engine controleert het schema en de standaardwaarden bij het opstarten, en elke instellingenwijziging daarna.

Op het hoogste niveau:

| Sleutel | Regel |
| --- | --- |
| `type` | Altijd `"object"` |
| `properties` | Object met één definitie per instelling |
| `required` | Optioneel: lijst met unieke namen uit `properties` |
| `additionalProperties` | Altijd `false` |
| `title`, `description`, `default` | Optionele annotaties |

Per instelling:

| Sleutel | Regel |
| --- | --- |
| `type` | `"integer"`, `"number"`, `"string"` of `"boolean"` |
| `enum` | Niet-lege lijst zonder dubbele waarden, elk van het juiste type |
| `minimum`, `maximum` | Alleen bij `integer` en `number`; minimum niet groter dan maximum |
| `maxLength` | Alleen bij `string`; een niet-negatief geheel getal |
| `title`, `description` | Tekst |
| `default` | Moet zelf geldig zijn |

Lijsten, geneste objecten, `$ref` en andere JSON Schema-onderdelen worden bij het opstarten afgewezen met *Unsupported settings schema feature*.

Een voorbeeld met grenzen en een keuzelijst:

```json
{
  "type": "object",
  "properties": {
    "rounds": { "type": "integer", "minimum": 1, "maximum": 20, "title": "Rondes" },
    "mode": { "type": "string", "enum": ["normal", "quick"] }
  },
  "required": ["rounds", "mode"],
  "additionalProperties": false
}
```

Bij het maken van een kamer worden de meegegeven instellingen over `default_settings` heen gelegd. Daarna vervangt de host instellingen altijd als geheel object.

## HTML en assets

- Verwijs naar assets en de SDK met absolute paden: `/games/mijn-spel/assets/app.js` en `/sdk/mini-engine.js`.
- De engine stuurt een strikte Content-Security-Policy mee: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'`. Inline `<script>`-blokken en scripts, lettertypes of beelden van een CDN werken dus niet. Zet alles in `assets/`.
- Inline stijlen en `data:`-beelden mogen wel.

## Vertrouwen

Lokaal geïnstalleerde packages zijn vertrouwde code op dezelfde origin als de engine. Ze kunnen kamersleutels en de accountsleutel van de demo lezen. Uploads van onbekende makers bestaan in 0.2 niet. Bekijk een package voordat je het installeert.
