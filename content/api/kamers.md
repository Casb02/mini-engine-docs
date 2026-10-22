---
title: Kamers
description: Alle kamerroutes van de HTTP API met methode, pad, toegang, request, response en foutcodes, ook voor eigen sets en achievements.
section: HTTP API
order: 3
toc_depth: 3
---

# Kamers

Kamerroutes staan onder `/api/v1/rooms`. Behalve maken, meedoen en de openbare info vragen ze een kamersleutel als `Authorization: Bearer <token>`. Muterende routes geven de bijgewerkte snapshot voor jouw rol terug. Dezelfde handelingen kun je ook via de [websocket](websocket.md) doen.

## Maken en meedoen

### POST /api/v1/rooms

Maakt een kamer. **Toegang:** iedereen. Met een optionele accountsleutel koppelt de engine het account aan de spelersplek van de maker (als die meespeelt), en onthoudt hij het als account van de host. Dat laatste is nodig om in een eigen spel [achievements toe te kennen](#post-api-v1-rooms-code-achievements).

```json
{
  "game_id": "common-dice",
  "name": "Hessel",
  "max_players": 12,
  "settings": { "dice_count": 5, "sides": 6 },
  "config": { "host_mode": "hostless", "display_enabled": true, "allow_late_join": false }
}
```

| Veld | Verplicht | Regel |
| --- | --- | --- |
| `game_id` | ja | Een geïnstalleerd spel |
| `name` | nee | Naam van een meespelende maker, 1 tot 24 tekens; standaard `Spelleider` |
| `max_players` | nee | Binnen `min_players` en `max_players` van het spel. Standaard het maximum van het spel, begrensd op 24 |
| `settings` | nee | Wordt over `default_settings` gelegd en daarna gecontroleerd |
| `config` | nee | Weggelaten velden: de standaardmodus van het spel, `display_enabled` gelijk aan `has_display`, `allow_late_join: false` |
| `set_id` | nee | Sinds 0.5. Een [eigen set](../concepten/eigen-sets.md) van het ingelogde account voor dit spel. Vraagt de accountsleutel. |

**Antwoord** `201`:

```json
{ "code": "HWKRTZ", "token": "HOST_SECRET", "role": "host", "player_id": "creator-uuid", "display_token": "DISPLAY_SECRET" }
```

Bij `host_mode: "moderator"` is `player_id` `null`. Staat het scherm uit, dan ontbreekt `display_token`.

Met `set_id` controleert de engine dat de set van jouw account is, bij `game_id` hoort, en dat zijn soort voorkomt in de versie van het spel die de kamer krijgt. Daarna controleert hij de inhoud opnieuw tegen die versie. De kamer krijgt een kopie: wijzig of verwijder je de set later, dan blijft de kamer met de kopie spelen. De snapshot toont welke set het is in het veld [`set`](#get-api-v1-rooms-code).

```json
{ "game_id": "jeopardy", "settings": { "team_count": 3 }, "set_id": "8a41c2d0-…" }
```

**Fouten:** `400 invalid_request` (onbekende modus, capaciteit, instellingen of config; later aansluiten of scherm bij een spel dat het niet ondersteunt; een hostspel met een andere modus dan `moderator`; een set van een ander spel, van een soort die deze versie niet kent of met inhoud die niet past), `401 unauthorized` (ongeldige accountsleutel, of `set_id` zonder accountsleutel), `404 game_not_found`, `404 set_not_found`, `409 release_changed` (het spel kreeg net een nieuwe versie; probeer het opnieuw), `429 rate_limit`, `503 room_limit`.

### POST /api/v1/rooms/{code}/join

Doet mee als speler. **Toegang:** iedereen; met een optionele accountsleutel.

```json
{ "name": "Sander" }
```

**Antwoord** `201`:

```json
{ "code": "HWKRTZ", "token": "PLAYER_SECRET", "role": "player", "player_id": "player-uuid" }
```

Namen zijn 1 tot 24 tekens zonder controletekens en uniek binnen de kamer, ongeacht hoofdletters. De body mag geen `account_id` bevatten.

**Fouten:** `400 invalid_request` (naam), `401 unauthorized`, `404 room_not_found`, `409 room_started`, `409 room_full`, `409 name_taken`, `409 already_joined`, `429 rate_limit`.

## Lezen

### GET /api/v1/rooms/{code}/info

Openbaar. Geen namen en geen spelstand.

```json
{
  "code": "HWKRTZ",
  "game_id": "common-dice",
  "status": "lobby",
  "player_count": 3,
  "max_players": 12,
  "config": { "host_mode": "hostless", "display_enabled": true, "allow_late_join": false },
  "runtime": "server"
}
```

Ook een eigen set staat er niet in; welke set de kamer speelt, zie je alleen in de snapshot.

**Fouten:** `404 room_not_found`.

### GET /api/v1/rooms/{code}

De snapshot voor de rol van de sleutel. **Toegang:** host, speler of scherm.

Elke snapshot bevat `code`, `game_id`, `game_version`, `status`, `version`, `max_players`, `settings`, `host_connected`, `players`, `public_state`, `you`, `runtime`, `config`, `round_id` en `set`. De host krijgt ook `host_state` en `player_states`, en `private_state` als hij meespeelt. Een speler krijgt `private_state`. Zie [kamers en rollen](../concepten/kamers-en-rollen.md#een-snapshot).

`set` is sinds 0.5 de [eigen set](../concepten/eigen-sets.md) waarmee de kamer speelt, voor alle rollen zichtbaar, of `null`:

```json
{ "set": { "id": "8a41c2d0-…", "kind": "board", "title": "Dani's filmavond" } }
```

De inhoud van de set staat nooit in een snapshot.

**Fouten:** `401 unauthorized`, `404 room_not_found`.

### GET /api/v1/rooms/{code}/game-data

De geheime speldata. **Toegang:** host.

- Speelt de kamer met een [eigen set](../concepten/eigen-sets.md), dan is dit de inhoud van die set, precies zoals de maker hem opsloeg.
- Anders is het de `data.json` van de versie die de kamer speelt, of `null` als het spel er geen heeft.

**Fouten:** `401 unauthorized`, `403 forbidden`, `404 room_not_found`.

## Spelen

### POST /api/v1/rooms/{code}/ready

Zet je klaarstatus. **Toegang:** deelnemer met een spelersplek, alleen in de lobby.

```json
{ "ready": true }
```

**Antwoord** `200`: de snapshot. Klaarzetten verhoogt de versie niet.

**Fouten:** `403 forbidden` (geen spelersplek), `409 room_started`.

### POST /api/v1/rooms/{code}/actions

Stuurt een actie. **Toegang:** bij een serverspel deelnemers en de host, volgens de spelregels; bij een hostspel alleen spelers. Het scherm nooit.

```json
{ "name": "roll", "data": { "held": [0, 2] }, "action_id": "3d6c1b0e-…" }
```

| Veld | Regel |
| --- | --- |
| `name` | 1 tot 64 tekens: letters, cijfers, `_`, `.`, `-` |
| `data` | Maximaal 8 KiB; een object bij serverspellen |
| `action_id` | Optioneel, 1 tot 64 tekens zonder controletekens |

**Antwoord** `200`: de snapshot. Bij een serverspel is de wijziging dan al opgeslagen. Bij een hostspel betekent het alleen dat de actie in de wachtrij van de host staat.

**Fouten:** `400 invalid_request`, `403 forbidden`, `409 host_offline`, `409 game_not_running` en de spelfouten van [Common Dice en Jeopardy](../concepten/acties.md#de-acties-van-de-ingebouwde-spellen).

### PUT /api/v1/rooms/{code}/state

Vervangt de volledige spelstand. **Toegang:** host, alleen bij `runtime: "host"`.

```json
{
  "expected_version": 4,
  "public_state": { "round": 1 },
  "host_state": { "answer": "Venus" },
  "player_states": { "player-uuid": { "cards": [1, 2] } }
}
```

Weggelaten `host_state` wordt `null`, weggelaten `player_states` wordt `{}`. Elke sleutel in `player_states` moet een bestaande speler zijn.

**Fouten:** `400 invalid_request` (onbekende speler), `403 forbidden` (geen host, of een serverspel), `409 version_conflict`, `413 state_too_large`.

### POST /api/v1/rooms/{code}/achievements

Sinds 0.5. Kent een [achievement](../concepten/achievements.md) van het spel toe aan een speler. **Toegang:** host, alleen bij `runtime: "host"`, tijdens of na het spel. Bij een serverspel kent de server zelf toe.

```json
{ "player_id": "5f0c…", "achievement_id": "winnaar" }
```

**Antwoord** `200`:

```json
{
  "player_id": "5f0c…",
  "achievement": { "id": "winnaar", "title": "Winnaar", "description": "Win de ronde." },
  "already_earned": false
}
```

De engine bewaart de achievement op het account van de speler met `source: "game"`, en stuurt de kamer een websocketbericht `achievement`. Had de speler hem al, dan verandert er niets, komt er geen bericht en is `already_earned` `true`.

De speler moet in de kamer zitten en een account hebben. Het id moet voorkomen in de versie van het spel die de kamer speelt. De kamer moet gemaakt zijn door iemand die was ingelogd, en de speler mag niet hetzelfde account hebben als de host.

**Fouten:** `invalid_json`, `401 unauthorized`, `403 forbidden` (geen host, of een serverspel), `403 not_eligible` (gast, kamer zonder account gemaakt, of je eigen account), `404 achievement_unknown`, `404 player_not_found`, `404 room_not_found`, `409 game_not_running` (de kamer staat in de lobby), `429 rate_limit` (meer dan 30 per kamer per minuut).

## Beheren

### PUT /api/v1/rooms/{code}/settings

Vervangt alle instellingen. **Toegang:** host.

```json
{ "expected_version": 4, "settings": { "dice_count": 3, "sides": 20, "roll_permission": "everyone", "theme": "candy" } }
```

Het object is maximaal 8 KiB. De engine controleert het tegen het schema van het spel en tegen de spelregels.

**Fouten:** `400 invalid_request`, `403 forbidden`, `409 version_conflict`, `409 teams_locked` (Jeopardy).

### PUT /api/v1/rooms/{code}/config

Wijzigt de kameropties. **Toegang:** host, alleen in de lobby.

```json
{ "expected_version": 4, "config": { "display_enabled": false, "allow_late_join": true } }
```

`host_mode` ligt vast; onbekende velden worden geweigerd. Uitschakelen van het scherm trekt de schermsleutel blijvend in.

**Fouten:** `400 invalid_request`, `403 forbidden`, `409 version_conflict`, `409 room_started`.

### POST /api/v1/rooms/{code}/lifecycle

Wijzigt de levensloop. **Toegang:** host.

```json
{ "status": "running" }
```

Toegestaan: `lobby → running`, `running → finished`, `finished → lobby`. Starten vraagt dat alle deelnemers klaarstaan. Terug naar de lobby geeft een nieuw `round_id` en reset klaarstatus en spelstand.

**Fouten:** `403 forbidden`, `409 invalid_transition`, `409 players_not_ready`, `409 teams_required` (Jeopardy).

### POST /api/v1/rooms/{code}/display-token

Maakt een nieuwe schermsleutel; de vorige werkt niet meer. **Toegang:** host, alleen als het scherm aanstaat.

```json
{ "token": "DISPLAY_SECRET" }
```

Deel hem via het fragment van de schermlink: `/room/CODE/display#DISPLAY_SECRET`.

**Fouten:** `403 forbidden`.

### POST /api/v1/rooms/{code}/leave

De speler verlaat de kamer en zijn sleutel wordt ingetrokken. **Toegang:** speler. **Antwoord:** `204`.

**Fouten:** `403 forbidden` (geen speler).

### DELETE /api/v1/rooms/{code}/players/{player_id}

Verwijdert een speler en trekt diens sleutel in. **Toegang:** host. **Antwoord:** `204`.

De maker kan zijn eigen spelersplek niet verwijderen.

**Fouten:** `400 invalid_request`, `403 forbidden`, `404 player_not_found`.

### DELETE /api/v1/rooms/{code}

Verwijdert de kamer en sluit alle verbindingen met de reden `room_deleted`. **Toegang:** host. **Antwoord:** `204`.

**Fouten:** `403 forbidden`, `404 room_not_found`.
