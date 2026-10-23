---
title: ApiClient
description: De HTTP-client van de SDK met alle methoden voor spellen, kamers, schermsleutels, accounts, achievements en eigen sets, plus de losse http-helpers.
section: SDK
group: Referentie
order: 1
toc_depth: 3
---

# ApiClient

`ApiClient` praat over HTTP met Mini Engine. Hij bewaart zelf geen kamersleutels en logt geen tokens.

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

Alle spellen die aanstaan, met hun metadata, instellingenschema, icoon, achievements en soorten sets, uit de actieve versie van elk spel. Ontbrekende manifestvelden krijgen hier hun standaardwaarde: `runtime: "host"`, `host_modes: ["moderator"]`, `default_host_mode: "moderator"`, `supports_late_join: true`, en lege lijsten voor `achievements` en `set_kinds`. `icon` ontbreekt als het spel er geen heeft.

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

Maakt een kamer en geeft de hostsleutel terug. Met een `accountToken` koppelt Mini Engine het account aan de spelersplek van de maker en onthoudt het als account van de host. Dat laatste is nodig om in een eigen spel [achievements](../concepten/achievements.md#eigen-spellen) toe te kennen.

```ts
const credentials = await api.createRoom({
  game_id: 'mijn-spel',
  name: 'Hessel',
  max_players: 12,
  settings: { prompt: 'Nog een ronde?', allow_change: true },
  config: { host_mode: 'playing', display_enabled: true, allow_late_join: false },
});
// { code: 'HWKRTZ', token: '…', role: 'host', player_id: '…', display_token: '…' }
```

| Veld | Verplicht | Regel |
| --- | --- | --- |
| `game_id` | ja | Een spel dat aanstaat |
| `name` | nee | Naam van een meespelende maker, 1 tot 24 tekens; standaard `Spelleider`. Niet gebruikt bij `tv` en `moderator` |
| `max_players` | nee | Binnen `min_players` en `max_players` van het spel; standaard het maximum van het spel, met 24 als bovengrens. Een meespelende maker telt mee |
| `settings` | nee | Wordt over `default_settings` gelegd en daarna tegen het `settings_schema` gecontroleerd |
| `config` | nee | Weggelaten velden: de standaardmodus van het spel, `display_enabled` gelijk aan `has_display`, `allow_late_join: false` |
| `set_id` | nee | Sinds 0.5. Een [eigen set](../concepten/eigen-sets.md) van het ingelogde account voor dit spel; vraagt een `accountToken` |

Bij `host_mode: "moderator"` en `"tv"` is `player_id` `null`. Staat het scherm uit, dan ontbreekt `display_token`. Bij `playing` is de sleutel van de maker tegelijk host en speler, en staat diens plek meteen klaar.

**Fouten:** `invalid_request` (onbekende modus, een modus die het spel niet aanbiedt, capaciteit, instellingen, config, of een set die niet past), `unauthorized` (ongeldige accountsleutel, of `set_id` zonder accountsleutel), `game_not_found`, `set_not_found`, `release_changed` (het spel kreeg net een nieuwe versie; probeer het opnieuw), `rate_limit`, `room_limit` (de server heeft het maximale aantal kamers).

Met `set_id` speelt de kamer met een [eigen set](../concepten/eigen-sets.md) van het ingelogde account. Dat vraagt een `accountToken`:

```ts
api.accountToken = token;
const { sets } = await api.listSets({ game_id: 'jeopardy', kind: 'board' });
const room = await api.createRoom({ game_id: 'jeopardy', set_id: sets[0].id });
```

### joinRoom(code, name)

```ts
joinRoom(code: string, name: string): Promise<RoomCredentials>
```

Doet mee als speler, met een `accountToken` als die er is. Geeft `{ code, token, role: 'player', player_id }`. Namen zijn 1 tot 24 tekens zonder controletekens en uniek binnen de kamer, ongeacht hoofdletters.

**Fouten:** `invalid_request` (naam), `unauthorized`, `room_not_found`, `room_started` (het spel loopt en later aansluiten staat uit), `room_full`, `name_taken`, `already_joined` (dit account heeft al een plek), `rate_limit`.

### getRoom(code, token)

```ts
getRoom<P = Json>(code: string, token: string): Promise<Snapshot<P>>
```

De snapshot voor de rol van de meegegeven kamersleutel. Onbekende kamer: `room_not_found`.

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

De geheime `data.json` van het spel, of de eigen set als de kamer daarmee speelt (`room.set` is dan gevuld). Alleen met een hostsleutel.

### displayToken(code, token)

```ts
displayToken(code: string, token: string): Promise<{ token: string }>
```

Maakt een nieuwe schermsleutel; de vorige werkt daarna niet meer. Alleen voor de host, en alleen als het gedeelde scherm aanstaat. Deel de sleutel alleen via het fragment van de schermlink: `/room/CODE/display#TOKEN`.

## Accounts

### register(input)

```ts
register(input: { username: string; password: string; display_name: string; email: string }): Promise<AccountSession>
```

`email` is verplicht. Mini Engine stuurt een bevestigingsmail met een link naar `/home/account?verify=<token>`. Fouten: `invalid_request`, `username_taken`, `email_taken` (het adres is al bevestigd door een ander account), `rate_limit`.

### login(input)

```ts
login(input: { username: string; password: string }): Promise<AccountSession>
```

Beide geven `{ account, token }` en bewaren niets. Zet de sleutel zelf:

```ts
const { token } = await api.login({ username: 'hessel', password: 'jouw-wachtwoord' });
api.accountToken = token;
```

### verifyEmail(token)

```ts
verifyEmail(token: string): Promise<{ account: Account }>
```

Bevestigt het e-mailadres met het token uit de `?verify=`-link. Dat werkt alleen voor het account waarvoor de link is, dus zet eerst `api.accountToken` van dat account:

```ts
const token = new URL(location.href).searchParams.get('verify');
api.accountToken = accountToken; // de sleutel van het ingelogde account
const { account } = await api.verifyEmail(token);
// account.email_verified === true
```

Een onbekende, verlopen, al gebruikte of andermans link geeft een `MiniEngineError` met code `invalid_token`.

### setEmail(email)

```ts
setEmail(email: string): Promise<{ account: Account; verification_sent: boolean }>
```

Voegt een adres toe, wijzigt het (het is daarna weer onbevestigd) of stuurt de link opnieuw als het adres gelijk blijft. Gebruikt `api.accountToken`. Eén mail per account per minuut; daarboven volgt `rate_limit`. Is het adres al bevestigd, dan volgt `email_already_verified`; is het bevestigd door een ander account, dan `email_taken`.

### me()

```ts
me(): Promise<Account>
```

### stats()

```ts
stats(): Promise<AccountStats>
```

Totalen, cijfers per spel en de laatste twintig resultaten.

### achievements(accountToken?)

```ts
achievements(accountToken?: string): Promise<{ achievements: AccountAchievement[] }>
```

Sinds SDK 0.5.0. De verdiende [achievements](../concepten/achievements.md) van het account, nieuwste eerst. Standaard met `api.accountToken`. Let op `source`: `'game'` betekent toegekend door een eigen spel en niet gecontroleerd door de server.

### logout()

```ts
logout(): Promise<null>
```

Trekt de huidige sessie in en wist `api.accountToken` als de server dat bevestigt.

## Eigen sets

Sinds SDK 0.5.0. Alle methoden gebruiken `api.accountToken`; een bevestigd e-mailadres is niet nodig. Zie [eigen sets](../concepten/eigen-sets.md). Een set van een ander account bestaat voor jou niet: `set_not_found`. Aanmaken, wijzigen en verwijderen samen mag 30 keer per minuut.

### listSets(filter?)

```ts
listSets(filter?: { game_id?: string; kind?: string }): Promise<{ sets: SetSummary[] }>
```

Jouw sets zonder inhoud, laatst gewijzigd eerst.

### getSet(id)

```ts
getSet<Data = Json>(id: string): Promise<SavedSet<Data>>
```

Eén set met inhoud. Een set van een ander account geeft `set_not_found`.

### createSet(input)

```ts
createSet<Data extends Json = Json>(input: { game_id: string; kind: string; title: string; data: Data }): Promise<SavedSet<Data>>
```

```ts
const board = await api.createSet({
  game_id: 'jeopardy',
  kind: 'board',
  title: "Dani's filmavond",
  data: { categories: [{ title: 'Films', clues: [/* vijf vragen */] }] },
});
```

De soort moet in de actieve versie van het spel staan en de inhoud moet aan het schema voldoen. Een fout noemt het pad, zoals `categories[0].clues[2].question: gebruik 1–240 tekens.` Bij 50 sets volgt `quota_sets`.

### updateSet(id, input)

```ts
updateSet<Data extends Json = Json>(id: string, input: { title: string; data: Data }): Promise<SavedSet<Data>>
```

Vervangt titel en inhoud. Kamers die de set al gebruiken, houden hun kopie.

### deleteSet(id)

```ts
deleteSet(id: string): Promise<null>
```

## Spelers en kamers beheren

Voor verlaten, verwijderen en sluiten heeft `ApiClient` geen eigen methode. Gebruik daarvoor [`http`](#losse-functies), met de kamersleutel als `token`:

| Verzoek | Sleutel | Wat er gebeurt |
| --- | --- | --- |
| `POST /api/v1/rooms/CODE/leave` | Speler | De speler verlaat de kamer en verliest zijn sleutel |
| `DELETE /api/v1/rooms/CODE/players/PLAYER_ID` | Host | Verwijdert een speler en trekt diens sleutel in |
| `DELETE /api/v1/rooms/CODE` | Host | Sluit de kamer; alle verbindingen sluiten met `room_deleted` |

```js
import { http, removeSession } from '/sdk/mini-engine.js';

await http(`/api/v1/rooms/${code}/leave`, { method: 'POST', token: session.token }); // null bij 204
removeSession(code, 'player');
```

De maker kan zijn eigen plek niet verwijderen en de kamer niet verlaten. Een speler verwijderen geeft `player_not_found` als die er niet (meer) is.

## Welke sleutel gaat waarheen?

| Methode | Sleutel |
| --- | --- |
| `createRoom`, `joinRoom` | `accountToken`, als die er is |
| `getRoom`, `gameData`, `displayToken` | De meegegeven kamersleutel |
| `me`, `stats`, `achievements`, `logout`, `verifyEmail`, `setEmail` | `accountToken` |
| `listSets`, `getSet`, `createSet`, `updateSet`, `deleteSet` | `accountToken` |
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
