---
title: Kamers
description: Alle kamerroutes van de HTTP API met methode, pad, toegang, request, response en foutcodes.
section: HTTP API
order: 3
toc_depth: 3
---

# Kamers

Kamerroutes staan onder `/api/v1/rooms`. Behalve maken, meedoen en de openbare info vragen ze een kamersleutel als `Authorization: Bearer <token>`. Muterende routes geven de bijgewerkte snapshot voor jouw rol terug. Dezelfde handelingen kun je ook via de [websocket](websocket.md) doen.

## Maken en meedoen

### POST /api/v1/rooms

Maakt een kamer. **Toegang:** iedereen; met een optionele accountsleutel wordt het account aan de spelersplek van de maker gekoppeld.

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

**Antwoord** `201`:

```json
{ "code": "HWKRTZ", "token": "HOST_SECRET", "role": "host", "player_id": "creator-uuid", "display_token": "DISPLAY_SECRET" }
```

Bij `host_mode: "moderator"` is `player_id` `null`. Staat het scherm uit, dan ontbreekt `display_token`.

**Fouten:** `400 invalid_request` (onbekende modus, capaciteit, instellingen of config; later aansluiten of scherm bij een spel dat het niet ondersteunt; een hostspel met een andere modus dan `moderator`), `401 unauthorized` (ongeldige accountsleutel), `404 game_not_found`, `429 rate_limit`, `503 room_limit`.

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

**Fouten:** `404 room_not_found`.

### GET /api/v1/rooms/{code}

De snapshot voor de rol van de sleutel. **Toegang:** host, speler of scherm.

Elke snapshot bevat `code`, `game_id`, `status`, `version`, `max_players`, `settings`, `host_connected`, `players`, `public_state`, `you`, `runtime`, `config` en `round_id`. De host krijgt ook `host_state` en `player_states`, en `private_state` als hij meespeelt. Een speler krijgt `private_state`. Zie [kamers en rollen](../concepten/kamers-en-rollen.md#een-snapshot).

**Fouten:** `401 unauthorized`, `404 room_not_found`.

### GET /api/v1/rooms/{code}/game-data

De geheime `data.json` van het spel, of `null` als het spel er geen heeft. **Toegang:** host.

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
