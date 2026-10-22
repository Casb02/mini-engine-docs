---
title: Pagina's per rol
description: Hoe de kamerinterface host.html, player.html en display.html laadt, hoe een pagina verbindt en hoe je snapshots rendert.
section: Een game bouwen
order: 3
---

# Pagina's per rol

Elk spel heeft een pagina per rol: `host.html`, `player.html` en, als het spel een gedeeld scherm heeft, `display.html`. Je mag ze delen, zoals het stemspel doet met één `app.js` voor alle drie.

## Hoe een pagina laadt

1. De pagina's onder `/home` bewaren de kamersleutel in `sessionStorage` en openen `/room/CODE/ROL`.
2. De kamerinterface op die URL vraagt de openbare kamerinfo op en laadt de spelpagina in een iframe: `/api/v1/games/{id}/{rol}?room=CODE`.
3. Je spelpagina leest de code uit `?room=` en haalt de sleutel uit de sessie.

De sleutel komt nooit in de query van de URL. Het gedeelde scherm krijgt zijn sleutel in het fragment (`/room/CODE/display#TOKEN`); de kamerinterface bewaart het en haalt het uit de adresbalk voordat het spel laadt.

## Verbinden

```js
import { MiniEngine, loadSession } from '/sdk/mini-engine.js';

const role = document.body.dataset.role; // 'host', 'player' of 'display'
const code = new URLSearchParams(location.search).get('room') || '';
const session = loadSession(code, role);
if (!session) throw new Error('Open deze pagina via de kamerinterface.');

const client = new MiniEngine(session);
client.on('snapshot', render);
client.on('error', (error) => showError(error.message));
client.connect();
await client.waitForSnapshot();
```

`render` en `showError` zijn van je eigen spel. Zet knoppen pas aan na de eerste snapshot.

## Renderen vanuit de snapshot

Elke snapshot is de volledige, actuele weergave voor jouw rol. Render altijd vanuit de nieuwste snapshot, ook na een herverbinding. Een paar dingen om op te letten:

- Klaarstatus en aanwezigheid veranderen zonder nieuwe versie. Verwerk dus elke snapshot.
- `you.role` blijft `host` voor de maker, ook als die meespeelt. Kijk naar `you.player_id` om te zien of iemand een spelersplek heeft.
- Een speler leest zijn eigen geheime deel als `private_state`. Het gedeelde scherm krijgt nooit privégegevens.
- `client.room` bevat altijd de laatste snapshot; `client.connected` wordt pas `true` na de eerste snapshot.

```js
function render(room) {
  document.querySelector('#code').textContent = room.code;
  document.querySelector('#status').textContent =
    room.status === 'lobby' ? 'Zet je klaar.' : room.status === 'running' ? 'Speel!' : 'Ronde voorbij.';
  const list = room.players.map((player) => {
    const item = document.createElement('li');
    item.textContent = player.name + (player.ready ? ' (klaar)' : '');
    return item;
  });
  document.querySelector('#players').replaceChildren(...list);
}
```

Gebruik `textContent` voor namen en andere tekst van spelers, nooit `innerHTML`.

## De rollen in een notendop

| Pagina | Doet |
| --- | --- |
| `player.html` | Klaarzetten, acties sturen, eigen `private_state` tonen |
| `host.html` | Rondes starten en afsluiten, instellingen en apparaatopties wijzigen; bij een eigen spel ook acties verwerken en state publiceren |
| `display.html` | Alleen `public_state` tonen, groot en leesbaar vanaf de bank |

## Pagina's sluiten en terugkomen

Het stemspel sluit de verbinding bij `pagehide` en hervat bij `pageshow`. Zo vervangt een teruggekeerd tabblad netjes zijn eigen verbinding:

```js
window.addEventListener('pagehide', () => client.close());
window.addEventListener('pageshow', () => client.resume());
```

Opent dezelfde sleutel ergens anders een verbinding, dan sluit de oude met `closed: session_replaced`. De sleutel blijft bewaard, zodat je bewust kunt hervatten.

## Volgende stap

Bij een eigen spel moet de hostpagina ook de spelregels uitvoeren. Lees [de browserhost schrijven](browserhost.md).
