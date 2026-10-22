---
title: Kamers en rollen
description: Wat een kamer is, welke sleutels er bestaan, en wat de spelleider, spelers en het gedeelde scherm te zien krijgen.
section: Concepten
order: 1
---

# Kamers en rollen

Een kamer is één spelsessie: één spel, een groep deelnemers en een gedeelde spelstand. De engine bewaart de kamer in SQLite en stuurt elk aangesloten apparaat zijn eigen weergave ervan.

## Kamercodes

Een kamercode bestaat uit zes letters uit `ABCDEFGHJKLMNPQRSTUVWXYZ`: geen I en geen O. Codes zijn niet hoofdlettergevoelig; de SDK zet ze zelf om naar hoofdletters. Een kamer verloopt na twaalf uur zonder activiteit. Aangesloten apparaten houden een actieve kamer levend.

## Drie rollen

| Rol | Hoe je hem krijgt | Mag |
| --- | --- | --- |
| `host` | Bij het maken van de kamer | Kamer beheren: instellingen, apparaatopties, rondes, spelers verwijderen, kamer sluiten, schermsleutel opvragen |
| `player` | Bij meedoen met een naam | Klaarzetten, acties sturen, de kamer verlaten |
| `display` | Via de schermsleutel van de host | Alleen meekijken |

Een maker die meespeelt, houdt de rol `host` en krijgt daarnaast een spelersplek met een eigen `player_id`. Een aparte spelleider heeft `player_id: null`. Zie [spelleidermodi](spelleidermodi.md).

## Sleutels

Elke rol heeft een geheime kamersleutel. Je stuurt die als `Authorization: Bearer <token>` bij HTTP, of in het eerste websocketbericht. De engine bewaart alleen hashes van sleutels.

- Kamersleutels staan los van accountsleutels. Een account vervangt geen kamersleutel.
- Zet sleutels nooit in een queryparameter of logregel.
- De SDK bewaart kamersleutels in `sessionStorage` onder `mini-engine:CODE:ROLE`.
- Eén kamersleutel heeft één actieve verbinding. Een nieuwe verbinding met dezelfde sleutel vervangt de oude; die krijgt de reden `session_replaced`.

Een speler die de kamer verlaat of wordt verwijderd, verliest zijn sleutel. Uitschakelen van het gedeelde scherm trekt de schermsleutel blijvend in; na opnieuw inschakelen vraagt de host een nieuwe op.

## Wat ziet wie?

Elke rol krijgt een eigen projectie van de kamer, de *snapshot*.

| Veld | Host | Speler | Scherm |
| --- | --- | --- | --- |
| `public_state` | ja | ja | ja |
| `host_state` | ja | nee | nee |
| `player_states` (alle spelers) | ja | nee | nee |
| `private_state` (eigen deel) | als de host meespeelt | ja | nee |
| Namen, aanwezigheid, klaarstatus, account-id's | ja | ja | ja |
| `settings` en `config` | ja | ja | ja |

De openbare route `/api/v1/rooms/{code}/info` geeft alleen code, spel, status, aantallen, capaciteit, runtime en config. Geen namen en geen spelstand.

## Een snapshot

Zo ziet de snapshot van een speler eruit (ID's ingekort):

```json
{
  "code": "HWKRTZ",
  "game_id": "my-vote",
  "status": "lobby",
  "version": 1,
  "max_players": 24,
  "settings": { "prompt": "Nog een ronde?", "allow_change": true },
  "host_connected": true,
  "players": [
    { "id": "5f0c…", "name": "Sander", "connected": true, "ready": true, "account_id": null }
  ],
  "public_state": { "votes": {} },
  "you": { "role": "player", "player_id": "5f0c…" },
  "runtime": "host",
  "config": { "host_mode": "moderator", "display_enabled": true, "allow_late_join": false },
  "round_id": "9b1e…",
  "private_state": null
}
```

Dit is een stemspel uit de [scaffolder](../game-bouwen/eerste-game.md) met een aparte spelleider. `host_connected` zegt alleen of de host verbonden is. Serveracties hangen niet van die vlag af. Meer over `version` en het bijwerken van state staat bij [state en versies](state-en-versies.md).

## Kameropties

De `config` van een kamer heeft drie velden:

| Veld | Standaard | Wijzigen |
| --- | --- | --- |
| `host_mode` | De standaardmodus van het spel | Nooit; kies bij het maken |
| `display_enabled` | `true` als het spel een schermpagina heeft | Door de host, alleen in de lobby |
| `allow_late_join` | `false` | Door de host, alleen in de lobby, en alleen als het spel later aansluiten ondersteunt |

Onbekende configvelden worden afgewezen.
