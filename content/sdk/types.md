---
title: Types
description: De belangrijkste TypeScript-types van de SDK, zoals Snapshot, Manifest, RoomCredentials en ActionPayloads, en waar het volledige declaratiebestand staat.
section: SDK-referentie
order: 6
toc_depth: 3
---

# Types

De SDK is in TypeScript geschreven. Alle declaraties staan in één bestand: [`types/mini-engine.d.ts`](https://github.com/Casb02/mini-engine-sdk/blob/main/types/mini-engine.d.ts) in de SDK-repository (privé). Het wordt bij `npm run build` uit `src/` gegenereerd. De engine heeft een kopie in `web/mini-engine.d.ts`, en de scaffolder zet er een in `types/` van elk nieuw spel.

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
type HostMode = 'moderator' | 'playing' | 'hostless';
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
  players: Player[];
  public_state: PublicState;
  settings: Settings;
  runtime?: 'host' | 'server';
  config?: RoomConfig;
  round_id?: string;
  you: { role: Role; player_id?: string | null };
  host_state?: Json;                    // alleen host
  player_states?: Record<string, Json>; // alleen host
  private_state?: PrivateState;         // speler, of meespelende host
}
```

### Player

```ts
interface Player { id: string; name: string; connected: boolean; ready?: boolean; account_id?: string | null }
```

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
}

interface SettingsProperty {
  type: 'integer' | 'number' | 'string' | 'boolean';
  enum?: Json[];
  minimum?: number; maximum?: number; maxLength?: number;
  title?: string; description?: string; default?: Json;
}
```

## Websocketberichten

```ts
interface Ack { type: 'ack'; request_id?: string }

interface ActionEnvelope {
  type: 'action'; player_id: string; name: string; data: Json;
  request_id?: string; action_id?: string;
}
```

### ActionPayloads

De data van de acties van de ingebouwde spellen:

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
interface Account { id: string; username: string; display_name: string; created_at: string | number }
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
