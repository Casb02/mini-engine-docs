---
title: Websocketprotocol
nav_title: Websocket
description: Verbinden, authenticeren, alle client- en serverberichten, bevestigingen, heartbeats en sluitredenen van de websocket per kamer.
section: HTTP API
order: 5
toc_depth: 3
---

# Websocketprotocol

Elke kamer heeft één websocketroute. Daarover ontvang je snapshots en stuur je opdrachten. De [MiniEngine-client](../sdk/realtime-client.md) van de SDK doet dit allemaal voor je; deze pagina beschrijft wat er over de lijn gaat.

## Verbinden

```text
GET /api/v1/rooms/{code}/ws
```

Gebruik `ws://` lokaal en `wss://` achter HTTPS. Stuur binnen vijf seconden het eerste tekstbericht:

```json
{ "type": "auth", "token": "ROOM_SECRET" }
```

De engine antwoordt met de snapshot voor jouw rol:

```json
{ "type": "snapshot", "room": { "code": "HWKRTZ", "status": "lobby", "version": 1, "…": "…" } }
```

Te laat of geen geldig auth-bericht: een `error` met `auth_timeout` of `unauthorized`, en de verbinding sluit.

Eén kamersleutel heeft één actieve verbinding. Een nieuwe verbinding met dezelfde sleutel vervangt de oude.

## Berichten van de client

Elk bericht is JSON-tekst met een `type`. Een optionele `request_id` (string, maximaal 64 bytes) koppelt het antwoord aan je verzoek.

| `type` | Velden naast `type` en `request_id` | Wie |
| --- | --- | --- |
| `action` | `name`, `data`, optioneel `action_id` | Speler; host bij een serverspel |
| `ready` | `ready` | Deelnemer, lobby |
| `configure` | `expected_version`, gedeeltelijke `config` | Host, lobby |
| `set_state` | `expected_version`, `public_state`, optioneel `host_state` en `player_states` | Host, hostruntime |
| `settings` | `expected_version`, volledig `settings` | Host |
| `lifecycle` | `status` | Host |
| `ping` | geen | Iedereen |

Voorbeeld:

```json
{ "type": "action", "request_id": "12", "name": "buzz", "data": {}, "action_id": "b7f0…" }
```

Binaire berichten worden geweigerd. Een tweede `auth` ook.

## Berichten van de server

| `type` | Inhoud | Wanneer |
| --- | --- | --- |
| `snapshot` | `room` | Na authenticatie en bij elke wijziging die jouw rol aangaat |
| `ack` | `request_id` | Je opdracht is gelukt |
| `error` | `request_id`, `error: { code, message }` | Je opdracht is mislukt, of een verbindingsfout |
| `action` | `player_id`, `name`, `data`, `request_id` | Alleen naar de host van een hostspel: een speleractie |
| `closed` | `reason` | De engine sluit de verbinding |

```json
{ "type": "ack", "request_id": "12" }
{ "type": "error", "request_id": "12", "error": { "code": "buzzer_closed", "message": "Deze buzzer staat niet open voor jouw team." } }
```

## Volgorde en bevestiging

Bij een geslaagde mutatie stuurt de engine eerst de bijgewerkte snapshot voor jouw rol en daarna de `ack`. De `ack` bevat zelf geen state.

- **Serverspel:** de `ack` bevestigt dat de wijziging is opgeslagen.
- **Hostspel, actie van een speler:** de `ack` bevestigt alleen dat de actie in de wachtrij van de host staat. De host ontvangt haar als `{ "type": "action", "player_id": "…", "name": "vote", "data": { "yes": true }, "request_id": "12" }` en moet zelf valideren en publiceren.

Snapshots komen ook zonder eigen verzoek binnen: als iemand meedoet, zich klaarzet, verbindt of wegvalt. Die veranderen de versie niet altijd.

## Heartbeat

De engine stuurt elke vijftien seconden een websocket-ping. Hoort hij 45 seconden niets van de client (geen pong, ping of bericht), dan sluit hij met `heartbeat_timeout`. Aangesloten apparaten houden zo ook de kamer levend.

## Achterlopen

Loopt een speler of scherm achter op de events, dan krijgt die een verse snapshot. Loopt de host achter, dan sluit de engine diens verbinding met `host_lagged`; de host verbindt opnieuw en krijgt dan de actuele stand.

## Sluitredenen

| Reden | Soort | Betekenis |
| --- | --- | --- |
| `session_revoked` | definitief | Sleutel ingetrokken |
| `room_deleted` | definitief | Kamer verwijderd |
| `room_expired` | definitief | Twaalf uur geen activiteit |
| `session_replaced` | definitief | Zelfde sleutel elders verbonden; de sleutel blijft geldig voor bewust hervatten |
| `host_lagged` | tijdelijk | Host liep achter |
| `heartbeat_timeout` | tijdelijk | Geen teken van leven |
| `rate_limit` | tijdelijk | Meer dan 240 berichten per seconde (host) of 60 (anderen) |
| `server_shutdown` | tijdelijk | Engine stopt of herstart |

Bij een tijdelijke reden verbindt de SDK opnieuw met een oplopende wachttijd. Opdrachten die nog open stonden, speelt de SDK niet opnieuw af.

## Grenzen

| Grens | Waarde |
| --- | --- |
| Bericht | maximaal 96 KiB |
| Authenticatie | binnen 5 seconden |
| Berichten per seconde | 240 voor de host, 60 voor spelers en scherm |
| `request_id` | maximaal 64 bytes |
| Gelijktijdige verbindingen per engine | 1024 |
