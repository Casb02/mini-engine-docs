---
title: Sessiehelpers
description: Kamersleutels bewaren en teruglezen in sessionStorage met sessionKey, saveSession, loadSession en removeSession.
section: SDK-referentie
order: 5
---

# Sessiehelpers

Een kamersleutel moet een paginawissel overleven, maar hoort niet in een URL. De SDK bewaart sleutels daarom in `sessionStorage`, per browsertabblad.

```ts
sessionKey(code: string, role: Role): string
saveSession(credentials: RoomCredentials, storage?: SessionStorage): void
loadSession(code: string, role: Role, storage?: SessionStorage): RoomCredentials | null
removeSession(code: string, role: Role, storage?: SessionStorage): void
```

## De sleutelindeling

```text
mini-engine:HWKRTZ:player
```

`sessionKey` zet de code om naar hoofdletters. De demopagina, de kamerinterface en alle spelpagina's gebruiken dezelfde indeling, zodat een spel de sessie terugvindt die de demo heeft bewaard.

## Gebruik

```ts
import { ApiClient, MiniEngine, saveSession, loadSession } from '/sdk/mini-engine.js';

const credentials = await new ApiClient().joinRoom('hwkrtz', 'Sander');
saveSession(credentials);

// Later, op de spelpagina:
const session = loadSession('HWKRTZ', 'player');
if (!session) throw new Error('Open deze pagina via de kamerinterface.');
const client = new MiniEngine(session).connect();
```

`loadSession` geeft `null` als er niets is opgeslagen, als de JSON onleesbaar is, of als code, rol of sleutel niet kloppen.

## Eigen opslag

Alle helpers accepteren een eigen opslag met `getItem`, `setItem` en `removeItem`. Handig in Node of in tests:

```ts
const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
saveSession(credentials, storage);
```

## Wat hier niet in hoort

- **Accountsleutels.** Die bewaart de SDK niet. De demo zet ze in `localStorage` onder `mini-engine:account`; in een eigen app kies je zelf.
- **Sleutels in de URL.** Gebruik nooit een queryparameter. De enige uitzondering is de schermlink, die de sleutel in het fragment draagt; de kamerinterface haalt hem daar meteen weg.

Gamecode op dezelfde origin kan deze opslag lezen. Installeer alleen spellen die je vertrouwt.
