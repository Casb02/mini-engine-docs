---
title: Kamers en rollen
description: Wat een kamer is, hoe je er een maakt en meedoet, welke sleutels er bestaan, en wat de spelleider, spelers en het gedeelde scherm te zien krijgen.
section: SDK
group: Concepten
order: 1
---

# Kamers en rollen

Een kamer is één spelsessie: één spel, een groep deelnemers en een gedeelde spelstand. Mini Engine bewaart de kamer en stuurt elk aangesloten apparaat zijn eigen weergave ervan.

## Kamercodes

Een kamercode bestaat uit zes letters uit `ABCDEFGHJKLMNPQRSTUVWXYZ`: geen I en geen O, zodat je hem makkelijk voorleest. Codes zijn niet hoofdlettergevoelig; de SDK zet ze zelf om naar hoofdletters. Een kamer verloopt na twaalf uur zonder activiteit. Aangesloten apparaten houden een actieve kamer levend.

## Drie rollen

| Rol | Apparaat | Hoe je hem krijgt | Mag |
| --- | --- | --- | --- |
| `host` | Het apparaat waarop de kamer is gemaakt | Bij het maken van de kamer | Kamer beheren: rondes starten en sluiten, spelers verwijderen, kamer sluiten, schermsleutel opvragen. Bij een eigen spel ook acties verwerken en de spelstand publiceren |
| `player` | De eigen telefoon van elke deelnemer | Bij meedoen met een naam | Klaarzetten, acties sturen, de kamer verlaten |
| `display` | Een laptop of tv in de kamer | Via de schermsleutel van de host | Alleen meekijken |

Een maker die meespeelt, houdt de rol `host` en krijgt daarnaast een spelersplek met een eigen `player_id`. Een maker die alleen leidt of de tv is, heeft `player_id: null`. Zie [spelleidermodi](spelleidermodi.md).

## Een kamer op miniengine.nl

De pagina's onder `/home` zijn de speelomgeving van Mini Engine. Als je je spel als testversie speelt, kom je ze allemaal tegen:

| Pagina | Wat je er doet |
| --- | --- |
| `/home` | Een kamercode invullen, of een spel kiezen om zelf te beginnen. Sinds 0.7 staan de uitgelichte spellen eerst |
| `/home/games` | Alle spellen als kaarten. Sinds 0.7 staan de uitgelichte bovenaan, en zoek je op titel, beschrijving, maker en id. Tot 0.6.1 heette deze pagina `/home/spellen` |
| `/home/new/<spel>` | Een kamer maken voor dat spel: naam, spelleidermodus, de instellingen uit je `settings_schema`, een eigen set, en onder **Meer opties** het aantal spelers, het gedeelde scherm en later aansluiten |
| `/home/join?room=CODE` | Een naam invullen en meedoen |
| `/room/CODE/ROL` | De kamer zelf: deze pagina laadt je spelpagina in een iframe; zie [pagina's per rol](../game-bouwen/rolpaginas.md) |
| `/home/account` | Inloggen, een account maken, resultaten en achievements bekijken, en je eigen geüploade spellen aan- of uitzetten |
| `/home/sets` | Eigen sets bekijken en maken, zoals een eigen vragenlijst voor een quiz |

De maker opent het gedeelde scherm via **Kamer** → **Open het gedeelde scherm**, bijvoorbeeld op een laptop aan de tv. Spelers doen mee met de code, met de uitnodigingslink of door de QR-code te scannen. Een klik op de kamercode kopieert de uitnodigingslink; **Toon QR** opent een grote QR-code.

De hostsleutel blijft in het browsertabblad waarmee de kamer is gemaakt. Ververs je dat tabblad, dan speel je gewoon verder. Een ander apparaat kan die rol niet overnemen: er is geen hostoverdracht tussen apparaten.

Deelt de maker per ongeluk de link uit de adresbalk, zoals `/room/HWKRTZ/host`, dan krijgt een ander daarmee niet de host. Sinds 0.6.4 gaat zo'n link in een tabblad zonder die plek naar de andere rol die het tabblad in die kamer wel heeft, en anders naar `/home/join?room=HWKRTZ`, met de code al ingevuld. Hetzelfde geldt voor een link naar een spelerspagina.

## Maken en meedoen

Met de SDK maak je een kamer met `api.createRoom()` en doe je mee met `api.joinRoom()`; zie [ApiClient](../sdk/api-client.md#kamers).

- **Namen** zijn 1 tot 24 tekens zonder controletekens, en uniek binnen de kamer, ongeacht hoofdletters. Een meespelende maker zonder naam heet `Spelleider`.
- **Capaciteit.** De maker kiest het maximum aantal spelers tussen `min_players` en `max_players` van het spel; standaard het maximum van het spel, met 24 als bovengrens. De plek van een meespelende maker telt mee.
- **Meedoen** kan normaal alleen in de lobby. Tijdens het spel alleen als het spel en de kamer [later aansluiten](rondes.md#later-aansluiten) toestaan.
- **Eén plek per account.** Met hetzelfde account nog eens meedoen geeft `already_joined`; hervat dan de bestaande sessie.

## Sleutels

Elke rol heeft een geheime kamersleutel. De SDK stuurt hem mee bij elk verzoek en in het eerste websocketbericht.

- Kamersleutels staan los van accountsleutels. Een account vervangt geen kamersleutel.
- Zet sleutels nooit in een queryparameter of logregel.
- De SDK bewaart kamersleutels in `sessionStorage` onder `mini-engine:CODE:ROLE`; zie [sessiehelpers](../sdk/sessies.md).
- Eén kamersleutel heeft één actieve verbinding. Een nieuwe verbinding met dezelfde sleutel vervangt de oude; die krijgt de reden `session_replaced`.
- De schermsleutel reist in het fragment van de schermlink (`/room/CODE/display#TOKEN`). De kamerpagina bewaart hem en haalt hem uit de adresbalk voordat het spel laadt. Vraagt de host een nieuwe schermlink op, dan werkt de vorige niet meer.

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
| `host_player_id` (sinds 0.5.1) | ja | ja | ja |
| `settings` en `config` | ja | ja | ja |

`api.roomInfo(code)` geeft zonder sleutel alleen code, spel, status, aantallen, capaciteit, runtime en config. Geen namen en geen spelstand.

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
  "host_player_id": "a71e…",
  "players": [
    { "id": "a71e…", "name": "Dani", "connected": true, "ready": true, "account_id": null },
    { "id": "5f0c…", "name": "Sander", "connected": true, "ready": true, "account_id": null }
  ],
  "public_state": { "votes": {} },
  "you": { "role": "player", "player_id": "5f0c…" },
  "runtime": "host",
  "config": { "host_mode": "playing", "display_enabled": true, "allow_late_join": false },
  "round_id": "9b1e…",
  "set": null,
  "private_state": null
}
```

Dit is het stemspel uit de [scaffolder](../game-bouwen/eerste-game.md), waarin de maker Dani meespeelt. Sander ziet het vanaf zijn eigen telefoon. `host_connected` zegt alleen of de host verbonden is.

`host_player_id` is de spelersplek van de maker als die meespeelt, zoals hier, en anders `null`. Elke rol krijgt het veld, zodat iedere pagina kan zeggen wie het spel start, bijvoorbeeld *Dani start het spel als iedereen klaar is*. Het veld bestaat sinds 0.5.1. Meer over `version` en het bijwerken van state staat bij [state en versies](state-en-versies.md); alle velden staan bij [types](../sdk/types.md#snapshot).

## Kameropties

De `config` van een kamer heeft drie velden:

| Veld | Standaard | Wijzigen |
| --- | --- | --- |
| `host_mode` | De standaardmodus van het spel | Nooit; kies bij het maken |
| `display_enabled` | `true` als het spel een schermpagina heeft | Door de host, alleen in de lobby |
| `allow_late_join` | `false` | Door de host, alleen in de lobby, en alleen als het spel later aansluiten ondersteunt |

Onbekende configvelden worden afgewezen. De host wijzigt opties met [`client.configure()`](../sdk/realtime-client.md#configure-config).
