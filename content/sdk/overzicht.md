---
title: SDK-overzicht
nav_title: Overzicht
description: Wat de Mini Engine SDK bevat, hoe je hem bouwt of installeert, en hoe spelpagina's de door de engine geserveerde module importeren.
section: SDK-referentie
order: 1
---

# SDK-overzicht

De Mini Engine SDK is een getypeerde browser- en Node-client zonder runtime-afhankelijkheden, plus de scaffolder `create-mini-game`.

| | |
| --- | --- |
| Pakketnaam | `@casb02/mini-engine-sdk` |
| Versie | `0.3.1`, voor engine 0.4 |
| Repository | [Casb02/mini-engine-sdk](https://github.com/Casb02/mini-engine-sdk) (openbaar, MIT) |
| Node.js | 22 of nieuwer |
| npm | Niet gepubliceerd; gebruik de lokale build of een tarball |

## Wat erin zit

| Export | Waarvoor |
| --- | --- |
| [`ApiClient`](api-client.md) | HTTP: spellen, kamers maken en meedoen, snapshots, geheime speldata, schermsleutels, accounts |
| [`MiniEngine`](realtime-client.md) | De realtime websocketclient: snapshots, acties, klaarzetten, state, levensloop |
| [`http`, `getGames`, `createRoom`, `joinRoom`](api-client.md#losse-functies) | Losse HTTP-helpers op de huidige origin |
| [`sessionKey`, `saveSession`, `loadSession`, `removeSession`](sessies.md) | Kamersleutels bewaren in `sessionStorage` |
| [`MiniEngineError`](events-en-fouten.md#miniengineerror) | Fouten met een `code` en optioneel een HTTP-`status` |
| `normalizeCode`, `endpoint` | Kamercode naar hoofdletters; URL samenstellen |
| [Types](types.md) | `Snapshot`, `Manifest`, `RoomCredentials` en meer |

## In een spelpagina

Spelpagina's importeren de SDK die de engine zelf serveert:

```js
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';
```

Dat is één gebundelde ES-module, `dist/mini-engine.js`. De engine bewaart een gecontroleerde kopie met een SHA-256-hash in `sdk-version.json`, zodat elk spel op die engine dezelfde SDK gebruikt.

## In een eigen project

Bouw de SDK uit de checkout, of installeer een lokale tarball:

```sh
# in de SDK-checkout
npm ci
npm run build
npm pack

# in je eigen project
npm install /absoluut/pad/naar/casb02-mini-engine-sdk-0.3.1.tgz
```

```ts
import { ApiClient, MiniEngine, saveSession } from '@casb02/mini-engine-sdk';
```

Het pakket bevat `dist/mini-engine.js`, de typedeclaraties in `types/mini-engine.d.ts` en de CLI in `bin/`.

## Van buiten een browser

In Node geef je de basis-URL van de engine en zo nodig een WebSocket-implementatie mee. Node 22 heeft een ingebouwde `WebSocket`.

```ts
const api = new ApiClient({ baseUrl: 'http://localhost:3000' });
const credentials = await api.createRoom({ game_id: 'common-dice', name: 'Hessel' });
const client = new MiniEngine({ ...credentials, baseUrl: api.baseUrl }).connect();
await client.waitForSnapshot();
```

Browserverzoeken naar een andere origin vragen CORS-ondersteuning van de server; de engine staat standaard alleen dezelfde origin toe.

## De engine bijwerken na een SDK-build

Voor beheerders van de engine:

```sh
npm run sdk:sync -- ../mini-engine-sdk
npm run sdk:check
```

`sdk:sync` kopieert de gebouwde bundle naar de engine en werkt de hash bij; `sdk:check` controleert dat de geserveerde bytes overeenkomen met `sdk-version.json`.
