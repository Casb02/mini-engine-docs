---
title: Ontwikkelaars
description: De routes onder /api/v1/dev waarmee een ontwikkelaar met een dev-key games uploadt, versies beheert en games aan- of uitzet.
section: API
order: 5
toc_depth: 3
---

# Ontwikkelaars

Deze routes staan onder `/api/v1/dev` en verwachten een dev-key: `Authorization: Bearer med_…`. Een ongeldige, verlopen of ingetrokken key geeft 401 `unauthorized`. Je krijgt een key van wie de server beheert, en alleen voor een account met een bevestigd e-mailadres. De [me-CLI](../publiceren/cli.md) gebruikt precies deze routes.

## Objecten

Een **DevGame**:

```json
{
  "id": "quiz-night",
  "title": "Quiz Night",
  "enabled": true,
  "blocked": false,
  "active_version": "1.1.0",
  "created_at": 1792660000,
  "updated_at": 1792663600,
  "versions": [Release, …]
}
```

Een **Release**:

```json
{
  "version": "1.1.0",
  "title": "Quiz Night",
  "content_hash": "9f2c…",
  "size": 48213,
  "file_count": 7,
  "created_at": 1792663600,
  "active": true,
  "in_use": false
}
```

`in_use` is `true` zolang een lopende kamer die versie speelt. Versies staan nieuwste eerst.

## Wie ben ik

### GET /api/v1/dev/me

```json
{
  "account": { "id": "uuid", "username": "sander", "display_name": "Sander" },
  "token": { "id": "uuid", "label": "laptop", "expires_at": null }
}
```

## Games

### GET /api/v1/dev/games

`{ "games": [DevGame, …] }` van jouw account.

### GET /api/v1/dev/games/{id}

Eén DevGame. Een game van iemand anders geeft 404 `game_not_found`.

### PUT /api/v1/dev/games/{id}

```json
{ "enabled": false }
```

Zet de game uit of aan en geeft de DevGame terug. Uit betekent: weg uit `GET /api/v1/games` en `/home`, geen nieuwe kamers en geen HTML of assets zonder kamer; lopende kamers spelen door via hun eigen versie. Heeft de beheerder de game geblokkeerd, dan geeft aanzetten 403 `game_blocked`.

### DELETE /api/v1/dev/games/{id}

Verwijdert de game met alle versies: 204. Zolang een kamer hem speelt: 409 `game_in_use`. Een geblokkeerde game kun je niet verwijderen (403 `game_blocked`); alleen de beheerder kan de blokkade opheffen.

## Versies

### POST /api/v1/dev/games/{id}/versions

Uploadt een nieuwe versie. De body is JSON met alle bestanden als base64, hoogstens 16 MiB:

```json
{
  "files": {
    "manifest.json": "eyJpZCI6InF1aXotbmlnaHQiLC4uLn0=",
    "host.html": "PCFkb2N0eXBlIGh0bWw+…",
    "player.html": "PCFkb2N0eXBlIGh0bWw+…",
    "assets/app.js": "aW1wb3J0IHsgTWluaUVuZ2luZSB9…"
  },
  "activate": true
}
```

Antwoord 201:

```json
{ "game": DevGame, "release": Release }
```

De eerste versie van een nieuwe game wordt altijd actief; latere versies alleen met `"activate": true`. Bestaat de game nog niet, dan wordt hij van jou.

| Fout | Wanneer |
| --- | --- |
| 400 `invalid_request` | Ongeldig pakket: manifest, rolpagina's, settingsschema, pad, base64, versienaam, `runtime` niet `host`, of te groot |
| 403 `forbidden` | De game is van een andere ontwikkelaar |
| 409 `game_id_taken` | Het id hoort bij een ingebouwde game |
| 409 `version_exists` | Deze versie bestaat al voor deze game |
| 409 `quota_games` | Je hebt al 10 games |
| 409 `quota_releases` | Deze game heeft al 10 versies |
| 413 | De body is groter dan 16 MiB |

Paden zijn relatief, met `/`, zonder lege segmenten, `.` of `..` en zonder backslash. Verder gelden dezelfde regels als voor [games op schijf](../game-bouwen/package-en-manifest.md).

### POST /api/v1/dev/games/{id}/versions/{version}/activate

Maakt een bestaande versie actief, ook om terug te gaan naar een oudere. Geeft de DevGame terug. Onbekende versie: 404 `release_not_found`.

### DELETE /api/v1/dev/games/{id}/versions/{version}

Verwijdert één versie: 204.

| Fout | Wanneer |
| --- | --- |
| 409 `release_active` | Dit is de actieve versie |
| 409 `release_in_use` | Een lopende kamer speelt deze versie |
| 404 `release_not_found` | Deze versie bestaat niet |

## Kamers en versies

Elke kamer onthoudt zijn versie in `game_version` (in `GET /api/v1/rooms/{code}/info` en in snapshots). `GET /api/v1/games/{id}/{role}?room=CODE` serveert de HTML van die versie, met asset-URL's onder `GET /releases/{id}/{version}/assets/…`. Die route serveert alleen de actieve versie van een game die aan staat, of een versie die een lopende kamer speelt. Zie [versies en kamers](../publiceren/versies.md).
