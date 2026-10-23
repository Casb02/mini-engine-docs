---
title: SDK-overzicht
nav_title: Overzicht
description: Wat de Mini Engine SDK bevat, met welke versies hij werkt, hoe je hem installeert en hoe spelpagina's de SDK importeren.
section: SDK
group: Aan de slag
order: 1
---

# SDK-overzicht

De Mini Engine SDK is een getypeerde browser- en Node-client zonder runtime-afhankelijkheden, plus de scaffolder `create-mini-game` en skills voor AI-agents. Met de SDK bouw je een spel; met de [CLI](../publiceren/cli.md) test je het op je eigen computer en zet je het online.

| | |
| --- | --- |
| Pakketnaam | `@casb02/mini-engine-sdk` |
| Versie | `0.6.0` |
| Repository | [Casb02/mini-engine-sdk](https://github.com/Casb02/mini-engine-sdk) (openbaar, MIT) |
| Node.js | 22 of nieuwer |
| npm | GitHub Packages, of rechtstreeks uit de repository |

## Versies

Deze documentatie hoort bij SDK 0.6.0 en CLI 0.6.0. Ze werken met Mini Engine 0.5 en nieuwer. Wat een nieuwere versie van Mini Engine vraagt, staat er steeds bij, zoals *sinds 0.5.1*:

| Onderdeel | Vanaf Mini Engine |
| --- | --- |
| Realtime, achievements, eigen sets | 0.5 |
| De maker speelt mee (`playing`), een eigen icoon | 0.5.1 |
| De maker is een tv (`tv`); nieuwe spellen uit de scaffolder bieden dit aan | 0.5.2 |
| Een formulier voor eigen sets in plaats van een JSON-editor | 0.5.3 |

## Wat erin zit

| Export | Waarvoor |
| --- | --- |
| [`ApiClient`](api-client.md) | Spellen, kamers maken en meedoen, snapshots, geheime speldata, schermsleutels, accounts, achievements, eigen sets |
| [`MiniEngine`](realtime-client.md) | De websocketclient: snapshots, acties, klaarzetten, state, levensloop, achievements toekennen, en realtime met `client.realtime` |
| [`http`, `getGames`, `createRoom`, `joinRoom`](api-client.md#losse-functies) | Losse helpers op de huidige origin |
| [`sessionKey`, `saveSession`, `loadSession`, `removeSession`](sessies.md) | Kamersleutels bewaren in `sessionStorage` |
| [`MiniEngineError`](events-en-fouten.md#miniengineerror) | Fouten met een `code` en optioneel een HTTP-`status` |
| `normalizeCode`, `endpoint` | Kamercode naar hoofdletters; URL samenstellen |
| [Types](types.md) | `Snapshot`, `Manifest`, `RoomCredentials`, `Realtime`, `SavedSet` en meer |

De grenzen die voor een spel gelden, zoals de grootte van de state en het aantal berichten per seconde, staan bij [grenzen](grenzen.md).

## In een spelpagina

Spelpagina's importeren de SDK die Mini Engine zelf serveert:

```js
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';
```

Dat is één gebundelde ES-module. Mini Engine serveert er één vaste versie van, zodat elk spel op die server dezelfde SDK gebruikt. `me dev` serveert de SDK op hetzelfde adres. De typedeclaraties staan ernaast op `/sdk/mini-engine.d.ts`.

## In een eigen project

Het pakket staat in GitHub Packages. Wijs de scope `@casb02` daar één keer naartoe, in de `.npmrc` van je project of in `~/.npmrc`:

```ini
@casb02:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

GitHub Packages vraagt ook voor een openbaar pakket een token. Maak een *personal access token (classic)* met alleen `read:packages` en zet het in `GITHUB_TOKEN`. Daarna:

```sh
npm install @casb02/mini-engine-sdk
```

Zonder token installeer je rechtstreeks uit de repository; npm bouwt het pakket dan zelf:

```sh
npm install github:Casb02/mini-engine-sdk#v0.6.0
```

```ts
import { ApiClient, MiniEngine, saveSession } from '@casb02/mini-engine-sdk';
```

Het pakket bevat `dist/mini-engine.js`, de typedeclaraties in `types/mini-engine.d.ts`, de scaffolder met vijf startsjablonen in `bin/` en de skills voor AI-agents in `skills/`. Sinds 0.6.0 kiest `create-mini-game --template` uit `stemmen`, `quiz`, `buzzer`, `beurten` en `leeg`; zie [je eerste game](../game-bouwen/eerste-game.md#kies-een-sjabloon). De CLI gebruikt dezelfde sjablonen voor `me init` en `me game new`.

## Van buiten een browser

In Node geef je de basis-URL mee, en zo nodig een WebSocket-implementatie. Node 22 heeft een ingebouwde `WebSocket`. Hier tegen `me dev` op je eigen computer:

```ts
const api = new ApiClient({ baseUrl: 'http://127.0.0.1:3170' });
const credentials = await api.createRoom({ game_id: 'mijn-spel', name: 'Hessel' });
const client = new MiniEngine({ ...credentials, baseUrl: api.baseUrl }).connect();
await client.waitForSnapshot();
```

In de browser werkt de SDK op dezelfde origin als de pagina. Een browserverzoek van een andere origin weigert de server met `403 origin_forbidden`.
