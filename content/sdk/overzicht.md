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
| Versie | `0.7.2` |
| Repository | [Casb02/mini-engine-sdk](https://github.com/Casb02/mini-engine-sdk) (openbaar, MIT) |
| Node.js | 22 of nieuwer |
| npm | GitHub Packages, of rechtstreeks uit de repository |

## Versies

Deze documentatie hoort bij SDK 0.7.2, CLI 0.9.0 en Mini Engine 0.9. De SDK en de CLI werken met Mini Engine 0.5 en nieuwer. Wat een nieuwere versie van Mini Engine vraagt, staat er steeds bij, zoals *sinds 0.5.1*:

| Onderdeel | Vanaf Mini Engine |
| --- | --- |
| Realtime, achievements, eigen sets | 0.5 |
| De maker speelt mee (`playing`), een eigen icoon | 0.5.1 |
| De maker is een tv (`tv`); nieuwe spellen uit de scaffolder bieden dit aan | 0.5.2 |
| Een formulier voor eigen sets in plaats van een JSON-editor | 0.5.3 |
| De naam van de maker op de spelkaart (`author`); de kamerpagina houdt het scherm aan | 0.6.1 |
| Het iframe past in het zichtbare deel van een telefoon; de kamer neemt de `theme-color` van je spel over | 0.6.5 |
| Zoeken en uitgelichte spellen op `/home/games`; Jeopardy is niet meer ingebouwd | 0.7 |
| [Afbeeldingen in eigen sets](../concepten/eigen-sets.md#afbeeldingen) (`format: "image"`) en `uploadMedia`, `listMedia` en `deleteMedia` | 0.8 |
| Ruimte voor afbeeldingen per account, en `requestMediaSpace` (SDK 0.7.1) | 0.8.1 |
| [Privéspellen](../publiceren/overzicht.md#privespellen): `private` en `icon_data` in `GameInfo`, `getGames()` en `getGame(id)` met de accountsessie, en `getGame(id, { room })` (SDK 0.7.2) | 0.9 |

Heb je al een spel voor een oudere versie, kijk dan bij [upgraden](../upgraden.md) wat je moet doen.

## Wat erin zit

| Export | Waarvoor |
| --- | --- |
| [`ApiClient`](api-client.md) | Spellen, kamers maken en meedoen, snapshots, geheime speldata, schermsleutels, accounts, achievements, eigen sets, afbeeldingen |
| [`MiniEngine`](realtime-client.md) | De websocketclient: snapshots, acties, klaarzetten, state, levensloop, achievements toekennen, en realtime met `client.realtime` |
| [`http`, `getGames`, `createRoom`, `joinRoom`](api-client.md#losse-functies) | Losse helpers op de huidige origin |
| [`sessionKey`, `saveSession`, `loadSession`, `removeSession`](sessies.md) | Kamersleutels bewaren in `sessionStorage` |
| [`MiniEngineError`](events-en-fouten.md#miniengineerror) | Fouten met een `code` en optioneel een HTTP-`status` |
| `normalizeCode`, `endpoint` | Kamercode naar hoofdletters; URL samenstellen |
| [Types](types.md) | `Snapshot`, `Manifest`, `GameInfo`, `RoomCredentials`, `Realtime`, `SavedSet`, `MediaItem` en meer |

De grenzen die voor een spel gelden, zoals de grootte van de state en het aantal berichten per seconde, staan bij [grenzen](grenzen.md).

## In een spelpagina

Spelpagina's importeren de SDK die Mini Engine zelf serveert:

```js
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';
```

Dat is één gebundelde ES-module. Mini Engine serveert er één vaste versie van, zodat elk spel op die server dezelfde SDK gebruikt. `me dev` serveert de SDK op hetzelfde adres. De typedeclaraties staan ernaast op `/sdk/mini-engine.d.ts`.

De client bleef van SDK 0.5.0 tot en met 0.6.0 gelijk; die versies brachten types, startsjablonen en skills. SDK 0.7.0 geeft `ApiClient` de methoden voor [afbeeldingen](api-client.md#afbeeldingen) erbij, en SDK 0.7.1 `requestMediaSpace`. In SDK 0.7.2 sturen `getGames()` en `getGame(id)` de accountsessie mee, zodat ook privéspellen meekomen. Mini Engine 0.6 en 0.7 serveren de client en typedeclaraties van SDK 0.5.2; Mini Engine 0.8 serveert die van SDK 0.7.0, en Mini Engine 0.9 die van SDK 0.7.2. Voor een spelpagina is elk daarvan genoeg: afbeeldingen uploadt een speler in de set-editor, en privéspellen toont de site zelf. Je eigen kopie van de types haal je uit SDK 0.7.2; zie [upgraden](../upgraden.md#je-gereedschap-bijwerken).

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
npm install github:Casb02/mini-engine-sdk#v0.7.2
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
