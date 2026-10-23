---
title: Package en manifest
description: De mapstructuur van een gamepackage, alle velden van manifest.json met icon, host_modes, achievements en set_kinds, het settings_schema en de grenzen die gecontroleerd worden.
section: SDK
group: Een game bouwen
order: 1
toc_depth: 3
---

# Package en manifest

Een spel is een map met een `manifest.json`, de pagina's per rol en een map `assets/`. `me dev` en `me game upload` controleren het package met dezelfde regels als de server, zodat je een fout al op je eigen computer ziet.

## Mapstructuur

```text
mijn-spel/
  manifest.json      verplicht
  host.html          verplicht
  player.html        verplicht
  display.html       verplicht bij has_display: true
  assets/            publieke bestanden: scripts, stijl, beelden, geluid, icoon
  data.json          optioneel: geheime speldata voor de host
  tests/             optioneel: je eigen tests, niet geüpload
```

- De `id` in het manifest heeft 1 tot 48 kleine ASCII-letters, cijfers of streepjes. Een nieuw spel uit de scaffolder gebruikt de slug als id en als mapnaam.
- Alleen bestanden onder `assets/` zijn publiek, op `/games/{id}/assets/…`.
- `data.json` leest alleen de host, met `gameData()`. Zet antwoorden daar, nooit in `assets/` of in de HTML. Speelt een kamer met een [eigen set](../concepten/eigen-sets.md), dan geeft `gameData()` de set in plaats van `data.json`.
- Symlinks zijn niet toegestaan, net als bestanden die buiten de map wijzen.
- `me game upload` slaat verborgen bestanden, `node_modules/`, `tests/` en de patronen uit `.meignore` over; zie [de me-CLI](../publiceren/cli.md#wat-me-game-upload-meestuurt).

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
  "host_modes": ["playing", "tv"],
  "default_host_mode": "playing",
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
| `id` | string | 1 tot 48 kleine letters, cijfers of streepjes; uniek op de server |
| `title` | string | Niet leeg, maximaal 200 bytes |
| `description` | string | Maximaal 4000 bytes |
| `version` | string | Niet leeg, maximaal 100 bytes |
| `min_players` | getal | Minstens 1 en niet groter dan `max_players` |
| `max_players` | getal | Maximaal 100 |
| `has_display` | boolean | `true` vraagt een `display.html` |
| `default_settings` | object | Moet voldoen aan `settings_schema` |
| `settings_schema` | object | Zie hieronder |
| `runtime` | `"host"` of `"server"` | Standaard `"host"` |
| `host_modes` | lijst | Standaard `["moderator"]`. Niet leeg. Bij `runtime: "host"` een keuze uit `"playing"`, `"tv"` en `"moderator"`; zie [host_modes](#host-modes) |
| `default_host_mode` | string | Standaard `"moderator"`; moet in `host_modes` staan |
| `icon` | string | Optioneel, sinds 0.5.1. Pad naar een SVG in `assets/`; zie [icon](#icon) |
| `supports_late_join` | boolean | Standaard `true` voor oudere manifests |
| `achievements` | lijst | Optioneel, sinds 0.5. Hoogstens 50; zie [achievements](#achievements) |
| `set_kinds` | lijst | Optioneel, sinds 0.5. Hoogstens 4 soorten eigen sets; zie [set_kinds](#set-kinds) |

Kies `supports_late_join` voor een nieuw spel bewust. De kamer zet later aansluiten pas aan met `allow_late_join: true`, en dat wordt geweigerd als het spel het niet ondersteunt.

`runtime: "server"` is er alleen voor de ingebouwde spellen Common Dice en Jeopardy. Een eigen spel gebruikt altijd `"host"`; zie [runtimes](../concepten/runtimes.md).

### host_modes

`host_modes` zegt wie het spel mag leiden; de maker van de kamer kiest er een op de pagina voor een nieuwe kamer. Zie [spelleidermodi](../concepten/spelleidermodi.md).

| `runtime` | Toegestaan in `host_modes` |
| --- | --- |
| `"host"` | `"playing"`, `"tv"` en `"moderator"`, in elke combinatie. `playing` sinds 0.5.1, `tv` sinds 0.5.2; daarvoor alleen `["moderator"]` |
| `"server"` | `"moderator"`, `"playing"` en `"hostless"`, zoals het ingebouwde spel aangeeft |

`hostless` kan niet bij `runtime: "host"`: zonder een verbonden hosttabblad is er geen scheidsrechter. Een lege lijst, `hostless` bij een eigen spel of een `default_host_mode` die niet in de lijst staat, weigeren `me dev`, `me game upload` en de server.

Een gezelschapsspel (bord, kaart, dobbel, tekenen) biedt `["playing", "tv"]` met `playing` als standaard, zoals in het voorbeeld hierboven: *Iedereen doet mee* of *TV*. Zo zet `me game new` het sinds 0.5.2 ook. Gebruik `moderator` alleen als de maker echt alleen leidt, zoals een quizmaster die de antwoorden kent:

```json
"host_modes": ["moderator"],
"default_host_mode": "moderator"
```

Een manifest zonder `host_modes` betekent `["moderator"]`, zoals vóór 0.5.1. Met `playing` is de hostpagina ook de spelerspagina van de maker, met `tv` het gedeelde scherm: zie [als de maker meespeelt](browserhost.md#als-de-maker-meespeelt) en [als de host een tv is](browserhost.md#als-de-host-een-tv-is).

### icon

Sinds 0.5.1 kan een spel een eigen icoon meenemen. De startpagina, de lijst met alle spellen en de pagina voor een nieuwe kamer tonen het in het vierkantje van 52 pixels naast de titel. Zonder `icon` blijft alles zoals het was: de ingebouwde spellen houden hun eigen teken, andere spellen krijgen een tegel met de eerste letter van de titel.

```json
"icon": "assets/icon.svg"
```

De server controleert het icoon bij elke upload, en `me game upload` en `me dev` doen dat al op je eigen computer:

| Regel | Waarde |
| --- | --- |
| Pad | Begint met `assets/` en eindigt op `.svg` |
| Bestand | Staat in het package |
| Grootte | Hoogstens 64 KiB |
| Inhoud | Geldige UTF-8 en bevat `<svg` |
| Niet toegestaan | `<script`, `<foreignObject`, `javascript:` en event-attributen zoals `onload=`, ongeacht hoofdletters |

Klopt het icoon niet, dan noemen `me dev` en `me game upload` de reden (*manifest.json: icon …*); de server weigert een upload met *Invalid icon: …*.

De pagina's van Mini Engine laden het icoon als `<img alt="">`, vanaf het gewone assetadres van de actieve versie: `/games/{id}/{icon}?v={version}`. In een `<img>` voert de browser geen scripts uit een SVG uit.

Zo ontwerp je een icoon dat in de lijst past:

- Een vierkant `viewBox="0 0 48 48"`.
- Een volle tegel met een eigen achtergrond en afgeronde hoeken (`rx="12"`).
- Eén of twee eenvoudige vormen in de kleuren van je spel.
- Geen tekst, geen lettertypes en geen verwijzingen naar andere bestanden.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="12" fill="#1f3d2b"/>
  <circle cx="24" cy="24" r="11" fill="#f2c94c"/>
</svg>
```

## settings_schema

Het instellingenschema is een kleine, strikte subset van JSON Schema. Het schema en de standaardwaarden worden gecontroleerd bij `me dev` en bij elke upload, en de instellingen van elke kamer daarna.

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

Lijsten, geneste objecten, `$ref` en andere JSON Schema-onderdelen worden afgewezen met *Unsupported settings schema feature*.

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

### Instellingen liggen vast tijdens het spelen

De maker kiest de instellingen in het formulier voor een nieuwe kamer. Daarna liggen ze in de praktijk vast. Toon ze in je spel als gewone tekst, bijvoorbeeld een korte regel *Regels: 5 rondes, 30 seconden per vraag*, en zet er geen knoppen of velden bij om ze te wijzigen.

`setSettings` bestaat nog voor een spel dat het echt nodig heeft. Maar regels die veranderen terwijl mensen spelen, maken een spel oneerlijk. En een formulier dat bij elke snapshot opnieuw rendert, verliest makkelijk een klik.

## achievements

Sinds 0.5 kan een spel [achievements](../concepten/achievements.md) declareren:

```json
"achievements": [
  { "id": "winnaar", "title": "Winnaar", "description": "Win de ronde." },
  { "id": "unaniem", "title": "Unaniem", "description": "Iedereen stemde hetzelfde als jij." }
]
```

| Veld | Regel |
| --- | --- |
| `id` | 1 tot 48 tekens: kleine letters, cijfers, `_` of `-`, beginnend met een letter of cijfer. Uniek binnen het spel. |
| `title` | 1 tot 60 tekens, niet leeg, geen controletekens |
| `description` | 1 tot 160 tekens, niet leeg, geen controletekens |

In een eigen spel kent de host ze toe met `client.award(playerId, achievementId)`. Ze staan op het account apart van die van de ingebouwde spellen, omdat de server ze niet kan controleren.

## set_kinds

Sinds 0.5 kan een spel aangeven welke inhoud spelers zelf mogen maken en op hun account bewaren, zoals een eigen vragenbord. Elke soort heeft een schema:

```json
"set_kinds": [
  {
    "id": "deck",
    "title": "Kaartspel",
    "description": "Tien tot veertig stellingen om over te stemmen.",
    "schema": {
      "type": "object",
      "properties": {
        "cards": {
          "type": "array",
          "minItems": 10,
          "maxItems": 40,
          "items": { "type": "string", "minLength": 1, "maxLength": 120 }
        }
      },
      "required": ["cards"],
      "additionalProperties": false
    }
  }
]
```

`id`, `title` en `description` volgen dezelfde regels als bij achievements. Het `schema` gebruikt het schemadialect voor sets: objecten, lijsten, tekst, getallen en booleans, tot 8 niveaus diep. Dat is ruimer dan het platte `settings_schema` hierboven, maar wel begrensd. Alle regels staan bij [eigen sets](../concepten/eigen-sets.md#het-schemadialect).

De host leest de gekozen set met `gameData()`, en de snapshot noemt hem in `room.set`.

## Controle

Het hele manifest, ook `icon`, `achievements` en `set_kinds`, wordt op drie plekken met dezelfde regels gecontroleerd:

- `me dev` toont een fout in het overzicht en in de terminal, en laadt opnieuw zodra je hem hebt opgelost.
- `me game upload` controleert het package voordat er iets wordt verstuurd.
- De server controleert elke upload nog eens en weigert een ongeldig package met `400 invalid_request` en de reden.

## HTML en assets

- Verwijs naar assets en de SDK met absolute paden: `/games/mijn-spel/assets/app.js` en `/sdk/mini-engine.js`. Imports tussen je eigen modules schrijf je relatief; zie [versies en kamers](../publiceren/versies.md).
- Mini Engine stuurt een strikte Content-Security-Policy mee: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'`. Inline `<script>`-blokken en scripts, lettertypes of beelden van een CDN werken dus niet. Zet alles in `assets/`. `me dev` stuurt dezelfde policy mee.
- Inline stijlen en `data:`-beelden mogen wel.

## Vertrouwen

Een spel draait op dezelfde origin als de pagina's van Mini Engine. Het kan de kamersleutel van dat tabblad en een eventuele accountsessie uit de browser lezen. Daarom kan alleen publiceren wie een dev-key heeft; zie [je game publiceren](../publiceren/overzicht.md). Gebruik in je spel alleen code die je zelf begrijpt.
