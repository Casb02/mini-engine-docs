---
title: Types
description: De belangrijkste TypeScript-types van de SDK, zoals Snapshot met host_player_id, Manifest met icon, RoomCredentials, ActionPayloads, de realtimetypes, achievements, sets en afbeeldingen, en waar het volledige declaratiebestand staat.
section: SDK
group: Referentie
order: 5
toc_depth: 3
---

# Types

De SDK is in TypeScript geschreven. Alle declaraties staan in één bestand: [`types/mini-engine.d.ts`](https://github.com/Casb02/mini-engine-sdk/blob/main/types/mini-engine.d.ts) in de SDK-repository. Het wordt bij `npm run build` uit `src/` gegenereerd. De scaffolder zet een kopie in `types/` van elk nieuw spel, en Mini Engine en `me dev` serveren het op `/sdk/mini-engine.d.ts`.

## Gebruik in gewone JavaScript

Spelpagina's zijn JavaScript zonder build. Met JSDoc krijg je toch typecontrole:

```js
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';
/** @import { Role, Snapshot } from '/sdk/mini-engine.js' */

/** @typedef {{ prompt: string, allow_change: boolean }} Settings */
/** @typedef {{ votes?: Record<string, boolean> } | null} PublicState */
/** @typedef {Snapshot<PublicState, Settings>} Room */

/** @type {MiniEngine<PublicState, Settings>} */
const client = new MiniEngine(session);
```

De `jsconfig.json` van de scaffolder koppelt `/sdk/mini-engine.js` aan het declaratiebestand.

## Basistypes

```ts
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Role = 'host' | 'player' | 'display';
type HostMode = 'moderator' | 'playing' | 'tv' | 'hostless';
type Lifecycle = 'lobby' | 'running' | 'finished';
type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
```

## Kamers

### Snapshot

```ts
interface Snapshot<PublicState = Json, Settings = Record<string, Json>, PrivateState = Json> {
  code: string;
  game_id: string;
  status: Lifecycle;
  version: number;
  max_players: number;
  host_connected: boolean;
  host_player_id?: string | null;       // sinds 0.5.1; plek van een meespelende maker, anders null
  players: Player[];
  public_state: PublicState;
  settings: Settings;
  runtime?: 'host' | 'server';
  config?: RoomConfig;
  round_id?: string;
  set?: RoomSet | null;                 // sinds 0.5; null zonder eigen set
  you: { role: Role; player_id?: string | null };
  host_state?: Json;                    // alleen host
  player_states?: Record<string, Json>; // alleen host
  private_state?: PrivateState;         // speler, of meespelende host
}
```

`host_player_id` is optioneel in het type, omdat Mini Engine het vóór 0.5.1 niet stuurde. Sinds 0.5.1 komt het altijd mee, aan iedere rol: de `player_id` van de maker als die meespeelt, anders `null`. Zie [spelleidermodi](../concepten/spelleidermodi.md#meespelen-in-een-eigen-spel).

### Player

```ts
interface Player { id: string; name: string; connected: boolean; ready?: boolean; account_id?: string | null }
```

### RoomSet

```ts
interface RoomSet { id: string; kind: string; title: string }
```

De [eigen set](../concepten/eigen-sets.md) waarmee de kamer speelt. Iedere rol ziet dit; de inhoud leest alleen de host, met `gameData()`.

### RoomConfig

```ts
interface RoomConfig { host_mode: HostMode; display_enabled: boolean; allow_late_join: boolean }
type MutableRoomConfig = Partial<Pick<RoomConfig, 'display_enabled' | 'allow_late_join'>>;
```

### RoomCredentials en CreateRoomOptions

```ts
interface RoomCredentials { code: string; token: string; role: Role; player_id?: string | null; display_token?: string }

interface CreateRoomOptions {
  game_id: string;
  max_players?: number;
  settings?: Record<string, Json>;
  name?: string;
  config?: Partial<RoomConfig>;
  set_id?: string; // sinds 0.5: een set van het ingelogde account; vraagt accountToken
}
```

### StateUpdate

```ts
interface StateUpdate<PublicState = Json> {
  expected_version: number;
  public_state: PublicState;
  host_state?: Json;
  player_states?: Record<string, Json>;
}
```

## Spellen

### Manifest

```ts
interface Manifest<Settings = Record<string, Json>> {
  id: string; title: string; description: string; version: string;
  min_players: number; max_players: number; has_display: boolean;
  default_settings: Settings;
  settings_schema: {
    type: 'object';
    properties: Record<string, SettingsProperty>;
    required?: string[];
    additionalProperties: false;
    title?: string; description?: string; default?: Settings;
  };
  runtime?: 'host' | 'server';
  host_modes?: HostMode[];
  default_host_mode?: HostMode;
  supports_late_join?: boolean;
  icon?: string;                          // sinds 0.5.1: 'assets/<naam>.svg'
  author?: string;                        // sinds 0.6.1, alleen bij geüploade spellen
  achievements?: AchievementDefinition[]; // sinds 0.5
  set_kinds?: SetKind[];                  // sinds 0.5
}

interface SettingsProperty {
  type: 'integer' | 'number' | 'string' | 'boolean';
  enum?: Json[];
  minimum?: number; maximum?: number; maxLength?: number;
  title?: string; description?: string; default?: Json;
}
```

`author` staat erin sinds SDK 0.6.0 (Mini Engine 0.6.1): de weergavenaam van het account dat het spel uploadde. De server zet het; een `author` in je manifest wordt genegeerd. `icon` is het pad van een SVG-icoon in het package, sinds SDK 0.5.1 (Mini Engine 0.5.1). De regels staan bij [package en manifest](../game-bouwen/package-en-manifest.md#icon). Een manifest zonder `host_modes` geldt als `['moderator']`; een nieuw spel uit de scaffolder heeft sinds 0.5.2 `['playing', 'tv']` met `default_host_mode: 'playing'`.

### Achievements en soorten sets

Sinds SDK 0.5.0 (Mini Engine 0.5).

```ts
interface AchievementDefinition {
  id: string;          // ^[a-z0-9][a-z0-9_-]{0,47}$, uniek binnen het spel
  title: string;       // 1–60 tekens
  description: string; // 1–160 tekens
}

interface SetKind {
  id: string;          // zelfde regel als een achievement-id
  title: string;       // 1–60 tekens
  description: string; // 1–160 tekens
  schema: SetSchema;
}

type SetSchema =
  | { type: 'object'; properties: Record<string, SetSchema>; required?: string[]; additionalProperties: false; title?: string; description?: string }
  | { type: 'array'; items: SetSchema; minItems?: number; maxItems?: number; title?: string; description?: string }
  | { type: 'string'; minLength?: number; maxLength?: number; enum?: string[]; title?: string; description?: string }
  | { type: 'string'; format: 'image'; title?: string; description?: string } // sinds SDK 0.7.0 (Mini Engine 0.8)
  | { type: 'integer' | 'number'; minimum?: number; maximum?: number; title?: string; description?: string }
  | { type: 'boolean'; title?: string; description?: string };
```

De grenzen van het schemadialect staan bij [eigen sets](../concepten/eigen-sets.md#het-schemadialect). Een tekstveld met `format: 'image'` is een [afbeelding](../concepten/eigen-sets.md#afbeeldingen); de types laten daar geen `minLength`, `maxLength` of `enum` bij toe.

## Websocketberichten

```ts
interface Ack { type: 'ack'; request_id?: string }

interface ActionEnvelope {
  type: 'action'; player_id: string; name: string; data: Json;
  request_id?: string; action_id?: string;
}
```

### Achievement verdiend

```ts
interface AchievementEarned { player_id: string; achievement: AchievementDefinition }
```

De waarde van het event `achievement`.

### Realtime

Sinds SDK 0.5.0 (Mini Engine 0.5).

```ts
interface RealtimeFrom { role: Role; player_id: string | null }
type RealtimeTarget = 'all' | 'host' | 'players' | 'display' | string[];
interface RealtimeEmitOptions { to?: RealtimeTarget; echo?: boolean }
interface RealtimeThrottled { dropped: number }

type RealtimeEventHandler = (data: Json, from: RealtimeFrom, ts: number, channel: string) => void;
type RealtimeValueHandler = (value: Json, from: RealtimeFrom, ts: number, key: string) => void;

interface Realtime {
  emit(channel: string, data?: Json, options?: RealtimeEmitOptions): boolean;
  on(channel: string, fn: RealtimeEventHandler): () => void;
  set(key: string, value: Json): void;
  value(from: string | RealtimeFrom, key: string): Json | undefined;
  onValue(key: string, fn: RealtimeValueHandler): () => void;
  reset(): void;
}
```

`ts` is de ontvangsttijd op de server in milliseconden sinds de Unix-epoch. De opties van `MiniEngine` hebben `realtime?: { setInterval?: number }`. Zie [de websocketclient](realtime-client.md#realtime).

### ActionPayloads

De data van de acties van de ingebouwde spellen. SDK 0.6.0 en 0.7.0 declareren ook nog de acties van Jeopardy (`choose_team` tot en met `close_clue`); die bestaan sinds Mini Engine 0.7 niet meer, nu alleen Common Dice is ingebouwd.

```ts
interface ActionPayloads {
  roll: { held?: number[] };
  clear_history: Record<string, never>;
  start: Record<string, never>;
  finish: Record<string, never>;
  choose_team: { team_id: string };
  buzz: Record<string, never>;
  select_clue: { clue_id: string };
  judge: { correct: boolean };
  reveal: Record<string, never>;
  reopen: Record<string, never>;
  close_clue: Record<string, never>;
}
```

## Accounts

```ts
interface Account {
  id: string; username: string; display_name: string; created_at: string | number;
  email: string | null; email_verified: boolean;
}
interface AccountSession { account: Account; token: string }
interface AccountStats {
  totals: { games_played: number; wins: number };
  games: {
    game_id: string; games_played: number; wins: number;
    total_score: number; best_score: number | null;
    counters: Record<string, number>;
  }[];
  recent: Json[];
}
```

`email` en `email_verified` zijn er sinds SDK 0.3.1 (Mini Engine 0.4). `email` is `null` bij een account zonder adres.

### Achievements van een account

Sinds SDK 0.5.0 (Mini Engine 0.5).

```ts
type AchievementSource = 'server' | 'game';

interface AccountAchievement {
  game_id: string;
  game_title: string | null; // huidige titel, of null als de server het spel niet meer kent
  id: string;
  title: string;
  description: string;
  source: AchievementSource; // 'game': toegekend door een eigen spel, niet gecontroleerd
  awarded_at: number;        // Unix-seconden
}
```

### Sets

Sinds SDK 0.5.0 (Mini Engine 0.5).

```ts
interface SetSummary {
  id: string; game_id: string; kind: string; title: string;
  size: number;                         // bytes van de inhoud als JSON, hoogstens 64 KiB
  created_at: number; updated_at: number; // Unix-seconden
}
interface SavedSet<Data = Json> extends SetSummary { data: Data }
interface NewSet<Data = Json> { game_id: string; kind: string; title: string; data: Data }
interface SetFilter { game_id?: string; kind?: string }
```

### Afbeeldingen

Sinds SDK 0.7.0 (Mini Engine 0.8).

```ts
interface MediaItem {
  id: string;                            // 32 kleine hexadecimale tekens
  url: string;                           // '/media/<id>': de waarde voor een afbeeldingsveld en voor <img src>
  content_type: 'image/jpeg' | 'image/png';
  width: number; height: number;         // pixels, na het verkleinen
  size: number;                          // opgeslagen bytes, hoogstens 1 MiB
  created_at: number;                    // Unix-seconden
}
interface MediaUpload { media: MediaItem; used_bytes: number; limit_bytes: number }
interface MediaList { media: MediaItem[]; used_bytes: number; limit_bytes: number }
```

`used_bytes` telt alle afbeeldingen van het account; `limit_bytes` is de ruimte van het account in bytes. In Mini Engine 0.8.0 was dat 250 MiB voor iedereen; sinds 0.8.1 hangt het af van het account en kan het 0 zijn (zie [ruimte voor afbeeldingen](../api/accounts.md#ruimte-voor-afbeeldingen)). Sinds 0.8.1 geeft `listMedia` ook `request`, de nieuwste aanvraag voor ruimte of `null`; dat veld staat nog niet in de types van SDK 0.7.0. Zie [uploadMedia](api-client.md#uploadmedia-file-options).
