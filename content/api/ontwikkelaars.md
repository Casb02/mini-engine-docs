---
title: Ontwikkelaars
description: De routes onder /api/v1/dev waarmee een ontwikkelaar met een dev-key games uploadt, versies beheert, games aan- of uitzet, privé maakt en accounts uitnodigt.
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
  "private": true,
  "invites": 2,
  "active_version": "1.1.0",
  "created_at": 1792660000,
  "updated_at": 1792663600,
  "versions": [Release, …]
}
```

`private` en `invites` zijn er sinds 0.9: of de game [privé](../publiceren/overzicht.md#privespellen) is, en het aantal accounts dat je hebt uitgenodigd. Ook `GET /api/v1/accounts/games` geeft ze.

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

Zet de game uit of aan en geeft de DevGame terug. Uit betekent: weg uit `GET /api/v1/games` en `/home`, geen nieuwe kamers en geen HTML of assets zonder kamer; lopende kamers spelen door via hun eigen versie. Heeft de beheerder de game geblokkeerd, dan geeft aanzetten 403 `game_blocked`, en verandert er niets.

Sinds 0.9 kan de body ook `private` hebben. Beide velden zijn optioneel, maar er moet er minstens één in staan:

```json
{ "private": true }
```

- `private: true` maakt de game privé: alleen jij en de accounts die je uitnodigt, zien hem en maken er een kamer mee. Stond hij bij de uitgelichte spellen, dan gaat hij eruit.
- `private: false` maakt hem weer openbaar. De uitnodigingen blijven bewaard en tellen weer als je hem opnieuw privé maakt.
- Alleen een echte verandering komt in het [logboek](#in-het-logboek); twee keer privé maken geeft één regel.
- Geen `enabled` en geen `private`: 400 `invalid_request`, *Geef enabled of private mee.* Onbekende velden: 422 `invalid_json`. Een server ouder dan 0.9 antwoordt op `private` ook met 422 `invalid_json`.

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
  "activate": true,
  "private": true
}
```

Antwoord 201:

```json
{ "game": DevGame, "release": Release }
```

De eerste versie van een nieuwe game wordt altijd actief; latere versies alleen met `"activate": true`. Bestaat de game nog niet, dan wordt hij van jou.

`private` is er sinds 0.9 en is optioneel:

- Een **nieuwe** game met `"private": true` is privé vanaf het begin. De server legt dat vast in dezelfde stap als de game zelf, dus de eerste versie staat nooit even openbaar.
- Bij een **bestaande** game zet `true` of `false` de stand voordat de nieuwe versie actief kan worden.
- Zonder `private` blijft de stand zoals hij was: een upload maakt een privégame nooit openbaar. Een nieuwe game zonder `private` is openbaar, zoals voorheen.
- Een server ouder dan 0.9 weigert het veld met 422 `invalid_json` en bewaart dan niets.
- `"private": true` in `manifest.json` maakt een game niet privé. Staat het daar wel en in het verzoek niet, dan weigert de server de upload (400 `invalid_request`), zodat zo'n game niet per ongeluk voor iedereen live gaat.

| Fout | Wanneer |
| --- | --- |
| 400 `invalid_request` | Ongeldig pakket: manifest, rolpagina's, settingsschema, pad, base64, versienaam, `runtime` niet `host`, of te groot. Sinds 0.9 ook `"private": true` in het manifest zonder `"private": true` in het verzoek |
| 403 `forbidden` | De game is van een andere ontwikkelaar. Zit je aan je limiet, dan krijg je sinds 0.9 eerst `quota_games` |
| 409 `game_id_taken` | Het id hoort bij een ingebouwde game; sinds 0.7 alleen nog `common-dice` |
| 409 `version_exists` | Deze versie bestaat al voor deze game |
| 409 `quota_games` | Je zit aan je limiet voor games: standaard 10 per account. Alleen een nieuwe game telt; een nieuwe versie van een bestaande niet. Sinds 0.9 krijg je het aan je limiet voor elk id dat niet van jou is, ook als een ander het heeft. Let op de code, niet op de tekst: die noemt het aantal games dat je hebt |
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

## Uitnodigingen

Sinds 0.9. Wie je uitnodigt, ziet je game als die privé is en kan er een kamer mee maken, ook zonder dev-key. Een uitnodiging hoort bij het account, niet bij de naam. Je kunt ook voor een openbare game uitnodigen; de uitnodiging telt zodra hij privé is. Zie [privéspellen](../publiceren/overzicht.md#privespellen).

Een **Invite**:

```json
{ "username": "dani", "display_name": "Dani", "invited_at": 1792700400 }
```

### GET /api/v1/dev/games/{id}/invites

```json
{
  "private": true,
  "invites": [
    { "username": "dani", "display_name": "Dani", "invited_at": 1792700400 },
    { "username": "sander", "display_name": "Sander", "invited_at": 1792700400 }
  ]
}
```

De uitnodigingen op gebruikersnaam. Een game van iemand anders of een onbekende game: 404 `game_not_found`, *Je hebt geen game met dit id.*

### POST /api/v1/dev/games/{id}/invites

```json
{ "usernames": ["dani", "sander"] }
```

Nodigt een of meer accounts uit. De server trimt de namen en maakt ze klein, zoals bij inloggen, en telt een dubbele naam één keer. Hij kent alleen kale namen: een `@` ervoor haalt de CLI weg, de server niet. Het is alles of niets: klopt één naam niet, dan verandert er niets. Een account dat al was uitgenodigd, geeft geen fout.

Antwoord 200: de hele lijst na de wijziging, plus wie er nieuw bij kwam:

```json
{ "private": true, "invites": [Invite, …], "added": ["sander"] }
```

| Fout | Wanneer | Melding |
| --- | --- | --- |
| 400 `invalid_request` | Een lege lijst, of meer dan 50 namen na het ontdubbelen | *Nodig 1 tot 50 accounts tegelijk uit.* |
| 400 `invalid_request` | Een naam is je eigen account | *Dit is je eigen game; die kun je altijd starten.* |
| 404 `account_not_found` | Een naam hoort bij geen account, ook een naam in een ongeldige vorm | *Er is geen account met de gebruikersnaam dani.*, met de eerste naam die niet bestaat |
| 404 `game_not_found` | De game is niet van jou, of bestaat niet | *Je hebt geen game met dit id.* |
| 409 `quota_invites` | De game zou meer dan 50 uitnodigingen krijgen | *Een game heeft hoogstens 50 uitnodigingen, en deze heeft er al 50. Trek er eerst een in.* |
| 422 `invalid_json` | Een andere body | |

### DELETE /api/v1/dev/games/{id}/invites/{username}

Trekt één uitnodiging in: 204. Kamers die al lopen, spelen door. Eigen sets die de genodigde voor de game maakte, kan die nog bekijken en verwijderen.

| Fout | Wanneer | Melding |
| --- | --- | --- |
| 404 `account_not_found` | Er is geen account met die naam | *Er is geen account met de gebruikersnaam dani.* |
| 404 `invite_not_found` | Dat account is niet uitgenodigd | *@dani is niet uitgenodigd voor deze game.* |
| 404 `game_not_found` | De game is niet van jou, of bestaat niet | *Je hebt geen game met dit id.* |

Een server ouder dan 0.9 kent deze routes niet en antwoordt met 404 `not_found`.

## In het logboek

Wie de server beheert, ziet in het logboek wat er met games gebeurt. Sinds 0.9 staan daar ook privé en de uitnodigingen in, met jouw gebruikersnaam en het id van de game:

| Actie | Wanneer | Op de beheerpagina |
| --- | --- | --- |
| `game.private` | Een bestaande game wordt privé, met `PUT` of bij een upload | *@cas maakte Zeeslag privé*, met *en haalde het uit de uitgelichte spellen* als de game uitgelicht was |
| `game.public` | Een privégame wordt openbaar | *@cas maakte Zeeslag openbaar* |
| `game.invite` | Per nieuwe uitnodiging | *@cas nodigde @dani uit voor Zeeslag* |
| `game.uninvite` | Een uitnodiging wordt ingetrokken | *@cas trok de uitnodiging van @dani voor Zeeslag in* |
| `release.upload` | Elke upload, zoals voorheen, nu met `private` in de details: de stand na de upload | *@cas uploadde versie 0.1.0 van Zeeslag als privéspel en maakte die actief* |

Een nieuwe game die privé begint, krijgt alleen `release.upload` met `"private": true`, geen `game.private`.

## Kamers en versies

Elke kamer onthoudt zijn versie in `game_version` (in `GET /api/v1/rooms/{code}/info` en in snapshots). `GET /api/v1/games/{id}/{role}?room=CODE` serveert de HTML van die versie, met asset-URL's onder `GET /rooms/{code}/assets/…` (sinds 0.9; daarvoor `/releases/{id}/{version}/assets/…`). Die route geeft de bestanden van de versie van de kamer, zolang de kamer loopt, ook bij een privégame. In tekstbestanden (HTML, CSS, JavaScript, JSON, SVG) wijzen ook absolute paden `/games/{id}/assets/…` ernaartoe, dus een lettertype dat je stylesheet zo noemt, komt ook uit de kamer.

`GET /releases/{id}/{version}/assets/…` blijft bestaan voor pagina's van vóór 0.9: de actieve versie van een game die aan staat, of een versie die een lopende kamer van een openbare game speelt. Van een privégame alleen de actieve versie, met de accountsessie van jou of een genodigde als bearer; anders 404 `asset_not_found`, zoals bij een onbekende game. Zie [versies en kamers](../publiceren/versies.md).
