---
title: Websocketprotocol
nav_title: Websocket
description: Verbinden, authenticeren, alle client- en serverberichten, realtime-events en -waarden, bevestigingen, heartbeats, sluitredenen en grenzen van de websocket per kamer.
section: API
order: 6
toc_depth: 3
---

# Websocketprotocol

Elke kamer heeft één websocketroute. Daarover ontvang je snapshots, stuur je opdrachten en gaan de [realtime](../concepten/realtime.md)-events en -waarden. De [websocketclient](../sdk/realtime-client.md) van de SDK doet dit allemaal voor je; deze pagina beschrijft wat er over de lijn gaat.

## Verbinden

```text
GET /api/v1/rooms/{code}/ws
```

Gebruik `ws://` lokaal en `wss://` achter HTTPS. Stuur binnen vijf seconden het eerste tekstbericht:

```json
{ "type": "auth", "token": "ROOM_SECRET" }
```

De server antwoordt met de snapshot voor jouw rol, en meteen daarna met de huidige realtimewaarden van de kamer:

```json
{ "type": "snapshot", "room": { "code": "HWKRTZ", "status": "lobby", "version": 1, "…": "…" } }
{ "type": "rt.values", "values": [] }
```

Te laat of geen geldig auth-bericht: een `error` met `auth_timeout` of `unauthorized`, en de verbinding sluit.

Eén kamersleutel heeft één actieve verbinding. Een nieuwe verbinding met dezelfde sleutel vervangt de oude. Vanaf dat moment kan de oude verbinding ook geen realtimeberichten meer sturen of ontvangen.

## Berichten van de client

Elk bericht is JSON-tekst met een `type`. Een optionele `request_id` (string, maximaal 64 bytes) koppelt het antwoord aan je verzoek.

### Opdrachten

| `type` | Velden naast `type` en `request_id` | Wie |
| --- | --- | --- |
| `action` | `name`, `data`, optioneel `action_id` | Speler; host bij een serverspel. Bij een hostspel nooit de host, ook niet als die meespeelt |
| `ready` | `ready` | Deelnemer, lobby. De plek van een meespelende maker in een hostspel staat al klaar |
| `configure` | `expected_version`, gedeeltelijke `config` | Host, lobby |
| `set_state` | `expected_version`, `public_state`, optioneel `host_state` en `player_states` | Host, hostruntime |
| `settings` | `expected_version`, volledig `settings` | Host |
| `lifecycle` | `status` | Host |
| `award` | `player_id`, `achievement_id` | Host, hostruntime, tijdens of na het spel (sinds 0.5) |
| `ping` | geen | Iedereen |

Voorbeeld:

```json
{ "type": "action", "request_id": "12", "name": "buzz", "data": {}, "action_id": "b7f0…" }
{ "type": "award", "request_id": "13", "player_id": "5f0c…", "achievement_id": "winnaar" }
```

`award` kent een [achievement](../concepten/achievements.md) toe en volgt dezelfde regels als [`POST /api/v1/rooms/{code}/achievements`](kamers.md#post-api-v1-rooms-code-achievements).

Binaire berichten worden geweigerd. Een tweede `auth` ook.

### Realtime

Sinds 0.5. Realtimeberichten hebben geen `request_id` en krijgen geen `ack`.

| `type` | Velden naast `type` | Wie |
| --- | --- | --- |
| `rt.emit` | `channel`, optioneel `data`, `to` en `echo` | Iedereen |
| `rt.set` | `key`, `value` (`null` wist de sleutel) | Iedereen |
| `rt.reset` | geen | Alleen de host: wist alle waarden in de kamer |

```json
{ "type": "rt.emit", "channel": "pressed", "data": { "clue": "c2-300" } }
{ "type": "rt.emit", "channel": "emoji", "data": "applaus", "to": "display" }
{ "type": "rt.set", "key": "kart", "value": { "x": 12, "y": 4 } }
{ "type": "rt.reset" }
```

- `channel` en `key`: 1 tot 64 tekens, letters, cijfers, `_`, `.`, `:` of `-`.
- `data` en `value`: elke JSON-waarde, hoogstens 2 KiB. `data` is `null` als je het weglaat.
- `to`: `"all"` (standaard), `"host"`, `"players"`, `"display"` of een lijst van hoogstens 16 speler-id's. `"players"` en een lijst met id's bereiken ook een meespelende host.
- `echo: true` stuurt het event ook terug naar jezelf. Standaard krijg je je eigen event niet.
- `from` of `ts` meesturen mag niet; de server zet die zelf.

Een ongeldig realtimebericht geeft een `error` met `invalid_request` en `request_id: null`; `rt.reset` door een ander dan de host geeft `forbidden`. De verbinding blijft in beide gevallen open.

## Berichten van de server

| `type` | Inhoud | Wanneer |
| --- | --- | --- |
| `snapshot` | `room` | Na authenticatie en bij elke wijziging die jouw rol aangaat |
| `ack` | `request_id` | Je opdracht is gelukt |
| `error` | `request_id`, `error: { code, message }` | Je opdracht is mislukt, of een verbindingsfout |
| `action` | `player_id`, `name`, `data`, `request_id` | Alleen naar de host van een hostspel: een speleractie |
| `achievement` | `player_id`, `achievement: { id, title, description }` | Naar de hele kamer: iemand verdiende een achievement voor het eerst (sinds 0.5) |
| `rt.event` | `channel`, `data`, `from`, `ts` | Een realtime-event voor jou |
| `rt.value` | `key`, `value`, `from`, `ts` | Een realtimewaarde veranderde; `value: null` betekent gewist |
| `rt.values` | `values: [{ key, value, from, ts }]` | Eén keer per verbinding, direct na de eerste snapshot: alle huidige waarden |
| `rt.reset` | `from`, `ts` | De host wiste alle waarden |
| `rt.throttled` | `dropped` | Er vielen realtimeberichten van jou weg; hoogstens eens per 5 seconden |
| `closed` | `reason` | De server sluit de verbinding |

```json
{ "type": "ack", "request_id": "12" }
{ "type": "error", "request_id": "12", "error": { "code": "buzzer_closed", "message": "Deze buzzer staat niet open voor jouw team." } }
{ "type": "rt.event", "channel": "pressed", "data": { "clue": "c2-300" }, "from": { "role": "player", "player_id": "5f0c…" }, "ts": 1792656419123 }
{ "type": "rt.value", "key": "kart", "value": { "x": 12, "y": 4 }, "from": { "role": "player", "player_id": "5f0c…" }, "ts": 1792656419150 }
{ "type": "rt.throttled", "dropped": 12 }
```

`from` is `{ "role": "host" | "player" | "display", "player_id": "…" | null }`. Een meespelende host heeft rol `host` én een `player_id`. `ts` is het moment waarop de server het bericht ontving, in milliseconden sinds de Unix-epoch.

Een `rt.value` gaat naar iedereen behalve de afzender. Verlaat een speler de kamer of wordt hij verwijderd, dan stuurt de server voor elke sleutel van die speler een `rt.value` met `value: null`. Een `rt.reset` gaat naar iedereen, ook naar de host die hem stuurde.

## Volgorde en bevestiging

Bij een geslaagde mutatie stuurt de server eerst de bijgewerkte snapshot voor jouw rol en daarna de `ack`. De `ack` bevat zelf geen state.

- **Serverspel:** de `ack` bevestigt dat de wijziging is opgeslagen.
- **Hostspel, actie van een speler:** de `ack` bevestigt alleen dat de actie in de wachtrij van de host staat. De host ontvangt haar als `{ "type": "action", "player_id": "…", "name": "vote", "data": { "yes": true }, "request_id": "12" }` en moet zelf valideren en publiceren.
- **`award`:** de `ack` bevestigt dat de achievement is opgeslagen, of dat de speler hem al had. Er komt geen snapshot bij, want de spelstand verandert niet.

Snapshots komen ook zonder eigen verzoek binnen: als iemand meedoet, zich klaarzet, verbindt of wegvalt. Die veranderen de versie niet altijd.

Realtimeberichten staan buiten deze volgorde. Ze hebben geen `ack`, geen versie en geen vaste plek ten opzichte van snapshots: een event kan vóór of na de snapshot van een bijbehorende actie aankomen. Ook het bericht `achievement` hoort niet bij de spelstand.

## Heartbeat

De server stuurt elke vijftien seconden een websocket-ping. Hoort hij 45 seconden niets van de client (geen pong, ping of bericht), dan sluit hij met `heartbeat_timeout`. Aangesloten apparaten houden zo ook de kamer levend.

## Achterlopen

Loopt een speler of scherm achter op de events, dan krijgt die een verse snapshot. Loopt de host achter, dan sluit de server diens verbinding met `host_lagged`; de host verbindt opnieuw en krijgt dan de actuele stand.

Realtime heeft een eigen wachtrij per kamer van 1024 berichten. Wie daarop achterloopt, mist de oudste realtimeberichten. Dat sluit de verbinding niet en levert ook geen nieuwe snapshot op.

## Budget voor realtime

Elke verbinding mag 60 realtimeberichten per seconde sturen, met pieken tot 120. Dat budget staat los van de grens voor opdrachten. Daarboven laat de server berichten stilletjes vallen en stuurt hij hoogstens eens per 5 seconden een `rt.throttled` met het aantal. Een `rt.set` boven de grens van 64 sleutels per afzender of 256 KiB per kamer telt daar ook bij. De verbinding sluit nooit om realtime.

## Sluitredenen

| Reden | Soort | Betekenis |
| --- | --- | --- |
| `session_revoked` | definitief | Sleutel ingetrokken |
| `room_deleted` | definitief | Kamer verwijderd |
| `room_expired` | definitief | Twaalf uur geen activiteit |
| `session_replaced` | definitief | Zelfde sleutel elders verbonden; de sleutel blijft geldig voor bewust hervatten |
| `host_lagged` | tijdelijk | Host liep achter |
| `heartbeat_timeout` | tijdelijk | Geen teken van leven |
| `rate_limit` | tijdelijk | Meer dan 240 opdrachten per seconde (host) of 60 (anderen); realtime telt niet mee |
| `server_shutdown` | tijdelijk | De server stopt of herstart |

Bij een tijdelijke reden verbindt de SDK opnieuw met een oplopende wachttijd. Opdrachten die nog open stonden, speelt de SDK niet opnieuw af, en realtimeberichten ook niet.

## Grenzen

| Grens | Waarde |
| --- | --- |
| Bericht | maximaal 96 KiB |
| Authenticatie | binnen 5 seconden |
| Opdrachten per seconde | 240 voor de host, 60 voor spelers en scherm |
| `request_id` | maximaal 64 bytes |
| Gelijktijdige verbindingen per server | 1024 |
| Realtimeberichten per verbinding | 60 per seconde, pieken tot 120 |
| `data` of `value` van een realtimebericht | 2 KiB |
| Kanaalnaam en sleutel | 1 tot 64 tekens: `A-Z a-z 0-9 _ . : -` |
| Ontvangers van een event | hoogstens 16 speler-id's |
| Realtimesleutels per afzender | 64 |
| Realtimewaarden per kamer | 256 KiB samen |
| Realtimewachtrij per kamer | 1024 berichten |
| Achievements toekennen | 30 per kamer per minuut |
