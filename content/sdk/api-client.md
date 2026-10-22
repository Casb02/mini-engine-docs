---
title: ApiClient
description: De HTTP-client van de SDK met alle methoden voor spellen, kamers, schermsleutels en accounts, plus de losse http-helpers.
section: SDK-referentie
order: 2
toc_depth: 3
---

# ApiClient

`ApiClient` praat met de HTTP-API van de engine. Hij bewaart zelf geen kamersleutels en logt geen tokens.

```ts
import { ApiClient } from '/sdk/mini-engine.js';

const api = new ApiClient({
  baseUrl: '',          // standaard: dezelfde origin
  accountToken: undefined, // optioneel: accountsleutel voor maken en meedoen
  fetch: undefined,     // optioneel: eigen fetch-implementatie
});
```

| Optie | Type | Standaard |
| --- | --- | --- |
| `baseUrl` | `string` | `''`, dus de huidige origin |
| `accountToken` | `string` | geen; de client werkt dan als gast |
| `fetch` | `typeof fetch` | `globalThis.fetch` |

`api.accountToken` mag je later zetten, bijvoorbeeld na een login. `api.baseUrl` is alleen-lezen.

## Spellen

### getGames()

```ts
getGames(): Promise<{ games: Manifest[] }>
```

Alle geïnstalleerde spellen met hun metadata en instellingenschema.

### getGame(id)

```ts
getGame(id: string): Promise<Manifest>
```

De metadata van één spel. Onbekend: `404 game_not_found`.

## Kamers

### createRoom(options)

```ts
createRoom(options: CreateRoomOptions): Promise<RoomCredentials>
```

Maakt een kamer en geeft de hostsleutel terug. Met een `accountToken` koppelt de engine het account aan de spelersplek van de maker.

```ts
const credentials = await api.createRoom({
  game_id: 'common-dice',
  name: 'Hessel',
  max_players: 12,
  settings: { dice_count: 5, sides: 6 },
  config: { host_mode: 'hostless', display_enabled: true, allow_late_join: false },
});
// { code: 'HWKRTZ', token: '…', role: 'host', player_id: '…', display_token: '…' }
```

### joinRoom(code, name)

```ts
joinRoom(code: string, name: string): Promise<RoomCredentials>
```

Doet mee als speler. Geeft `{ code, token, role: 'player', player_id }`.

### getRoom(code, token)

```ts
getRoom<P = Json>(code: string, token: string): Promise<Snapshot<P>>
```

De snapshot voor de rol van de meegegeven kamersleutel.

### roomInfo(code)

```ts
roomInfo(code: string): Promise<{
  code: string; game_id: string; status: Lifecycle;
  player_count: number; max_players: number;
  runtime?: string; config?: RoomConfig;
}>
```

Openbare kamerinfo, zonder namen of spelstand.

### gameData(code, token)

```ts
gameData<T = unknown>(code: string, token: string): Promise<T>
```

De geheime `data.json` van het spel. Alleen met een hostsleutel.

### displayToken(code, token)

```ts
displayToken(code: string, token: string): Promise<{ token: string }>
```

Maakt een nieuwe schermsleutel; de vorige werkt daarna niet meer. Alleen voor de host, en alleen als het gedeelde scherm aanstaat. Deel de sleutel alleen via het fragment van de schermlink: `/room/CODE/display#TOKEN`.

## Accounts

### register(input)

```ts
register(input: { username: string; password: string; display_name: string }): Promise<AccountSession>
```

### login(input)

```ts
login(input: { username: string; password: string }): Promise<AccountSession>
```

Beide geven `{ account, token }` en bewaren niets. Zet de sleutel zelf:

```ts
const { token } = await api.login({ username: 'hessel', password: 'jouw-wachtwoord' });
api.accountToken = token;
```

### me()

```ts
me(): Promise<Account>
```

### stats()

```ts
stats(): Promise<AccountStats>
```

Totalen, cijfers per spel en de laatste twintig resultaten.

### logout()

```ts
logout(): Promise<null>
```

Trekt de huidige sessie in en wist `api.accountToken` als de server dat bevestigt.

## Welke sleutel gaat waarheen?

| Methode | Sleutel |
| --- | --- |
| `createRoom`, `joinRoom` | `accountToken`, als die er is |
| `getRoom`, `gameData`, `displayToken` | De meegegeven kamersleutel |
| `me`, `stats`, `logout` | `accountToken` |
| `getGames`, `getGame`, `roomInfo`, `register`, `login` | Geen |

## Losse functies

De oudere exports blijven beschikbaar en werken op de huidige origin:

```ts
http<T>(path: string, options?: HttpOptions, fetcher?: typeof fetch): Promise<T>
getGames(): Promise<{ games: Manifest[] }>
createRoom(options: CreateRoomOptions): Promise<RoomCredentials>
joinRoom(code: string, name: string): Promise<RoomCredentials>
```

`http` zet `Content-Type: application/json` als er een body is en `Authorization: Bearer …` als je `token` meegeeft. Een `204` geeft `null`. Een fout wordt een `MiniEngineError` met de `code` en `message` van de server en de HTTP-`status`.

```ts
const info = await http('/api/v1/rooms/HWKRTZ/info');
const room = await http('/api/v1/rooms/HWKRTZ', { token: credentials.token });
```

De bijbehorende HTTP-routes staan in de [HTTP API](../api/kamers.md).
