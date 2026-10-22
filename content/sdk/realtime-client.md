---
title: MiniEngine-client
description: De realtime websocketclient van de SDK, met verbinden, snapshots, acties, klaarzetten, instellingen, state publiceren en herverbinden.
section: SDK-referentie
order: 3
toc_depth: 3
---

# MiniEngine-client

`MiniEngine` houdt één websocketverbinding met een kamer open, ontvangt snapshots en stuurt opdrachten. Hij werkt in de browser en in Node.

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
new MiniEngine({ code, token, baseUrl?, reconnectDelay?, requestTimeout?, WebSocket? })
```

| Optie | Standaard | Betekenis |
| --- | --- | --- |
| `code` | verplicht | Kamercode; wordt naar hoofdletters omgezet |
| `token` | verplicht | Kamersleutel, alleen verstuurd in het eerste websocketbericht |
| `baseUrl` | de huidige origin | Verplicht buiten de browser |
| `reconnectDelay` | `500` ms | Startwaarde van de oplopende wachttijd bij herverbinden |
| `requestTimeout` | `10000` ms | Hoe lang een opdracht op bevestiging wacht |
| `WebSocket` | `globalThis.WebSocket` | Eigen implementatie, bijvoorbeeld in tests |

`RoomCredentials` uit `createRoom`, `joinRoom` of `loadSession` passen direct als opties.

## Eigenschappen

| Eigenschap | Type | Betekenis |
| --- | --- | --- |
| `code` | `string` | Genormaliseerde kamercode |
| `token` | `string` | De kamersleutel |
| `room` | `Snapshot \| null` | De laatste snapshot |
| `connected` | `boolean` | `true` zodra de eerste snapshot na authenticatie binnen is |

## Verbinding

### connect()

Opent de verbinding en geeft de client terug, dus `new MiniEngine(…).connect()` kan in één regel. De client stuurt `{ type: 'auth', token }` als eerste bericht en is verbonden zodra de eerste snapshot binnenkomt.

### resume()

Verbindt een gesloten client opnieuw, bijvoorbeeld na `session_replaced` of bij `pageshow`. De laatste `room` blijft staan tot er een verse snapshot is.

### close()

Stopt de verbinding en alle automatische pogingen. Openstaande opdrachten en wachtende `waitForSnapshot`-beloftes worden afgewezen met code `closed`.

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

### request(type, payload?)

```ts
request(type: string, payload?: Record<string, unknown>): Promise<Ack>
```

Een ruwe websocketopdracht met een eigen `request_id`. De andere methoden zijn hierop gebouwd. Niet verbonden: direct een fout met code `not_connected`.

## Herverbinden

Bij een tijdelijke sluiting (`host_lagged`, `heartbeat_timeout`, `rate_limit`, `server_shutdown`) of een weggevallen verbinding verbindt de client opnieuw, met een oplopende wachttijd tot maximaal vijftien seconden. Na `rate_limit` wacht hij minstens 1,2 seconde. Elke nieuwe verbinding authenticeert opnieuw.

Bij een definitieve sluiting (`session_revoked`, `room_deleted`, `room_expired`, `session_replaced`) stopt de client en krijg je het event `closed`.

Openstaande opdrachten worden bij uitval afgewezen met code `disconnected`, en na de time-out met `request_timeout`. **De SDK speelt opdrachten nooit opnieuw af.** Kijk na een onzeker resultaat eerst naar de nieuwste snapshot.

## Generieke types

```ts
const client = new MiniEngine<PublicState, Settings, PrivateState>(session);
```

Zo krijgen `room.public_state`, `room.settings` en `room.private_state` jouw eigen types. Zie [types](types.md).
