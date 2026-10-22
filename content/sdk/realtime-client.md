---
title: De websocketclient
nav_title: Websocketclient
description: MiniEngine, de websocketclient van de SDK, met verbinden, snapshots, acties, klaarzetten, instellingen, state publiceren, achievements toekennen, realtime en herverbinden.
section: SDK-referentie
order: 3
toc_depth: 3
---

# De websocketclient

`MiniEngine` houdt één websocketverbinding met een kamer open, ontvangt snapshots, stuurt opdrachten en verzorgt [realtime](../concepten/realtime.md). Hij werkt in de browser en in Node.

```ts
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';

const session = loadSession('HWKRTZ', 'player');
if (!session) throw new Error('Geen kamersleutel in deze sessie.');
const client = new MiniEngine(session);
client.on('snapshot', (room) => render(room));
client.connect();
await client.waitForSnapshot();
```

## Opties

```ts
new MiniEngine({ code, token, baseUrl?, reconnectDelay?, requestTimeout?, WebSocket?, realtime? })
```

| Optie | Standaard | Betekenis |
| --- | --- | --- |
| `code` | verplicht | Kamercode; wordt naar hoofdletters omgezet |
| `token` | verplicht | Kamersleutel, alleen verstuurd in het eerste websocketbericht |
| `baseUrl` | de huidige origin | Verplicht buiten de browser |
| `reconnectDelay` | `500` ms | Startwaarde van de oplopende wachttijd bij herverbinden |
| `requestTimeout` | `10000` ms | Hoe lang een opdracht op bevestiging wacht |
| `WebSocket` | `globalThis.WebSocket` | Eigen implementatie, bijvoorbeeld in tests |
| `realtime.setInterval` | `33` ms | Sinds 0.5. Hoe vaak `client.realtime.set` hoogstens verstuurt |

`RoomCredentials` uit `createRoom`, `joinRoom` of `loadSession` passen direct als opties.

## Eigenschappen

| Eigenschap | Type | Betekenis |
| --- | --- | --- |
| `code` | `string` | Genormaliseerde kamercode |
| `token` | `string` | De kamersleutel |
| `room` | `Snapshot \| null` | De laatste snapshot |
| `connected` | `boolean` | `true` zodra de eerste snapshot na authenticatie binnen is |
| `realtime` | `Realtime` | Sinds 0.5. Events en live waarden; zie [realtime](#realtime) |

## Verbinding

### connect()

Opent de verbinding en geeft de client terug, dus `new MiniEngine(…).connect()` kan in één regel. De client stuurt `{ type: 'auth', token }` als eerste bericht en is verbonden zodra de eerste snapshot binnenkomt.

### resume()

Verbindt een gesloten client opnieuw, bijvoorbeeld na `session_replaced` of bij `pageshow`. De laatste `room` blijft staan tot er een verse snapshot is.

### close()

Stopt de verbinding en alle automatische pogingen. Openstaande opdrachten en wachtende `waitForSnapshot`-beloftes worden afgewezen met code `closed`. Alle realtimewaarden in de client worden gewist.

## Snapshots

### waitForSnapshot(predicate?, options?)

```ts
waitForSnapshot(
  predicate?: (room: Snapshot) => boolean,
  options?: { timeout?: number; signal?: AbortSignal },
): Promise<Snapshot>
```

Geeft de huidige snapshot als die al voldoet, of wacht op een volgende. De time-out is standaard `requestTimeout`; daarna volgt een fout met code `snapshot_timeout`.

```ts
await client.waitForSnapshot((room) => room.status === 'running');
```

## Opdrachten

Alle opdrachten geven een `Promise<Ack>`. Bij een mutatie komt de nieuwe snapshot binnen vóór de bevestiging.

### action(name, data?, options?)

```ts
action(name: string, data?: Json, options?: { actionId?: string }): Promise<Ack>
```

Stuurt een spelactie. Zonder `actionId` maakt de SDK een nieuwe unieke id. Zie [acties en action-id's](../concepten/acties.md).

### ready(ready?)

```ts
ready(ready = true): Promise<Ack>
```

Zet je eigen klaarstatus in de lobby.

### lifecycle(status)

```ts
lifecycle(status: 'running' | 'finished' | 'lobby'): Promise<Ack>
```

Alleen de host. Volgt `lobby → running → finished → lobby`.

### setSettings(settings)

```ts
setSettings(settings: S): Promise<Ack>
```

Alleen de host. Vervangt het hele instellingenobject; de SDK stuurt de versie van `client.room` als `expected_version` mee.

### configure(config)

```ts
configure(config: { display_enabled?: boolean; allow_late_join?: boolean }): Promise<Ack>
```

Alleen de host, alleen in de lobby. De spelleidermodus kies je bij het maken van de kamer.

### setState(state)

```ts
setState(state: { expected_version: number; public_state: P; host_state?: Json; player_states?: Record<string, Json> }): Promise<Ack>
```

Alleen de host van een spel met `runtime: "host"`. Vervangt de volledige spelstand. Een serverspel weigert dit.

### award(playerId, achievementId)

```ts
award(playerId: string, achievementId: string): Promise<Ack>
```

Sinds 0.5. Alleen de host van een spel met `runtime: "host"`, tijdens of na het spel. Kent een [achievement](../concepten/achievements.md#eigen-spellen) uit het manifest toe aan een speler met een account. Had de speler hem al, dan volgt toch een bevestiging. Een gast geeft `not_eligible`, een onbekend id `achievement_unknown`.

```ts
if (player.account_id) await client.award(player.id, 'winnaar');
```

### request(type, payload?)

```ts
request(type: string, payload?: Record<string, unknown>): Promise<Ack>
```

Een ruwe websocketopdracht met een eigen `request_id`. De andere methoden zijn hierop gebouwd. Niet verbonden: direct een fout met code `not_connected`.

## Realtime

Sinds 0.5. `client.realtime` stuurt en ontvangt [events en live waarden](../concepten/realtime.md). Niets daarvan wordt opgeslagen, bevestigd, in een wachtrij gezet of opnieuw verstuurd.

```ts
client.realtime.emit('pressed', { clue: 'c2-300' });
const off = client.realtime.on('pressed', (data, from, ts) => showPress(from, ts));

client.realtime.set('cursor', { x: 0.4, y: 0.7 });
client.realtime.onValue('cursor', (value, from) => drawCursor(from, value));
```

### emit(channel, data?, options?)

```ts
emit(channel: string, data?: Json, options?: { to?: RealtimeTarget; echo?: boolean }): boolean
```

Stuurt een event. `to` is `'all'` (standaard), `'host'`, `'players'`, `'display'` of een lijst van hoogstens 16 speler-id's. Met `echo: true` krijg je je eigen event ook. Geeft `false` als de client niet verbonden is; het event is dan weg. `true` betekent alleen dat het verstuurd is, niet dat iemand het ontving.

### on(channel, handler)

```ts
on(channel: string, handler: (data: Json, from: RealtimeFrom, ts: number, channel: string) => void): () => void
```

Luistert naar één kanaal, of naar alle kanalen met `'*'`. `from` is `{ role, player_id }` en `ts` de tijd waarop de server het event ontving, in milliseconden. Het vierde argument is het kanaal, handig bij `'*'`. Geeft een functie terug om je af te melden.

### set(key, value)

```ts
set(key: string, value: Json): void
```

Zet jouw waarde voor een sleutel; `null` wist hem. De laatste waarde wint. De SDK voegt snelle wijzigingen per sleutel samen en verstuurt hoogstens elke `realtime.setInterval` milliseconden (standaard 33) de laatste stand. Je eigen waarde staat direct in `value()`, want de engine stuurt je eigen waarden niet terug. Niet verbonden: de aanroep doet niets.

### value(from, key)

```ts
value(from: string | RealtimeFrom, key: string): Json | undefined
```

De laatste waarde van een afzender: `'host'`, `'display'`, een speler-id, of een `from`-object uit een handler. Een meespelende host is `'host'`.

### onValue(key, handler)

```ts
onValue(key: string, handler: (value: Json, from: RealtimeFrom, ts: number, key: string) => void): () => void
```

Luistert naar één sleutel, of naar alle sleutels met `'*'`. `value` is `null` als de sleutel gewist is: door de afzender, omdat een speler vertrok, of door een reset. Het vierde argument is de sleutel.

### reset()

```ts
reset(): void
```

Alleen de host. Wist alle waarden in de kamer; iedereen krijgt per gewiste sleutel `null` in `onValue`. Waarden die de host na `reset()` zelf zet, blijven staan. Een ander dan de host krijgt het event `error` met code `forbidden`.

### Verbinding en realtime

- Na een herverbinding bouwt de client alle waarden opnieuw op uit de lijst die de engine bij het verbinden stuurt. Handlers van `onValue` horen dan wat er veranderde.
- Waarden die nog niet verstuurd waren toen de verbinding wegviel, stuurt de client niet meer.
- Na `close()` zijn alle waarden in de client weg.
- Valt er iets weg omdat je te veel stuurt, dan krijg je het event [`throttled`](events-en-fouten.md#events).

## Herverbinden

Bij een tijdelijke sluiting (`host_lagged`, `heartbeat_timeout`, `rate_limit`, `server_shutdown`) of een weggevallen verbinding verbindt de client opnieuw, met een oplopende wachttijd tot maximaal vijftien seconden. Na `rate_limit` wacht hij minstens 1,2 seconde. Elke nieuwe verbinding authenticeert opnieuw.

Bij een definitieve sluiting (`session_revoked`, `room_deleted`, `room_expired`, `session_replaced`) stopt de client en krijg je het event `closed`.

Openstaande opdrachten worden bij uitval afgewezen met code `disconnected`, en na de time-out met `request_timeout`. **De SDK speelt opdrachten nooit opnieuw af.** Kijk na een onzeker resultaat eerst naar de nieuwste snapshot.

## Generieke types

```ts
const client = new MiniEngine<PublicState, Settings, PrivateState>(session);
```

Zo krijgen `room.public_state`, `room.settings` en `room.private_state` jouw eigen types. Zie [types](types.md).
