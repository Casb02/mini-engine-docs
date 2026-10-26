---
title: Pagina's per rol
description: Hoe de kamerinterface host.html, player.html en display.html laadt, hoe een pagina verbindt en hoe je snapshots rendert.
section: SDK
group: Een game bouwen
order: 2
---

# Pagina's per rol

Elk spel heeft een pagina per rol: `host.html`, `player.html` en, als het spel een gedeeld scherm heeft, `display.html`. Je mag ze delen, zoals het stemspel doet met één `app.js` voor alle drie.

## Hoe een pagina laadt

1. De pagina's onder `/home` van Mini Engine bewaren de kamersleutel in `sessionStorage` en openen `/room/CODE/ROL`. `me dev` doet hetzelfde voor elke stoel.
2. De kamerinterface op die URL controleert de plek: voor de host en een speler vraagt ze de snapshot op met de sleutel uit de sessie, voor het gedeelde scherm de openbare kamerinfo. Daarna laadt ze de spelpagina in een iframe: `/api/v1/games/{id}/{rol}?room=CODE`.
3. Je spelpagina leest de code uit `?room=` en haalt de sleutel uit de sessie.

De sleutel komt nooit in de query van de URL. Het gedeelde scherm krijgt zijn sleutel in het fragment (`/room/CODE/display#TOKEN`); de kamerinterface bewaart het en haalt het uit de adresbalk voordat het spel laadt.

Heeft het tabblad geen geldige sleutel voor `host` of `player`, bijvoorbeeld omdat een spelleider de link uit de adresbalk deelde, dan gaat de kamerinterface sinds 0.6.4 naar de andere rol die dat tabblad wel heeft in die kamer, en anders naar `/home/join?room=CODE`. Wil je in je spel een uitnodiging tonen, gebruik dan dat adres, zoals `joinUrl` in MiniEngineUI doet.

Rond je spel doet de kamerinterface nog meer, zodat je spel dat niet zelf hoeft:

- **Het scherm blijft aan** (sinds 0.6.1). Ze houdt het scherm van de telefoon of tv aan met een Screen Wake Lock, en vraagt het opnieuw aan na een tik of een toets, ook in je spel, en als het tabblad terugkomt. Eigen `navigator.wakeLock`-code is niet nodig. Onder `me dev` gebeurt dit niet.
- **Het iframe mag volledig scherm, het klembord, autoplay en het scherm-aan-slot gebruiken.** Het heeft `allow="fullscreen; screen-wake-lock; clipboard-write; autoplay"`.
- **Het iframe past in het zichtbare deel** en neemt de `theme-color` van je pagina over (sinds 0.6.5); zie [op een telefoon](#op-een-telefoon).

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
- `you.role` blijft `host` voor de maker, ook als die meespeelt. Kijk naar `you.player_id` om te zien of iemand een spelersplek heeft. `host_player_id` (sinds 0.5.1) is voor iedere rol de plek van een meespelende maker, of `null` bij TV of een spelleider; gebruik het om te zeggen wie het spel start. Bij een gezelschapsspel is de maker een speler zoals de rest: zet er geen *spelleider* bij. `config.host_mode` zegt welke modus de kamer heeft, zodat de hostpagina weet of ze de spelerspagina of het scherm moet tonen.
- Toon de instellingen (`room.settings`) als gewone tekst, bijvoorbeeld *Regels: 5 rondes*. De maker koos ze bij het maken van de kamer; zet er geen knoppen bij om ze te wijzigen.
- Een speler leest zijn eigen geheime deel als `private_state`. Het gedeelde scherm krijgt nooit privégegevens.
- `client.room` bevat altijd de laatste snapshot; `client.connected` wordt pas `true` na de eerste snapshot.

```js
function render(room) {
  document.querySelector('#code').textContent = room.code;
  document.querySelector('#status').textContent =
    room.status === 'lobby' ? 'Zet je klaar.' : room.status === 'running' ? 'Speel!' : 'Ronde voorbij.';
  const list = room.players.map((player) => {
    const item = document.createElement('li');
    const host = player.id === room.host_player_id ? ' (spelleider)' : '';
    item.textContent = player.name + host + (player.ready ? ' (klaar)' : '');
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
| `host.html` | Rondes starten en afsluiten, apparaatopties wijzigen; bij een eigen spel ook acties verwerken en state publiceren, en als de maker meespeelt diens eigen zetten |
| `display.html` | Alleen `public_state` tonen, groot en leesbaar vanaf de bank |

## Op een telefoon

Sinds 0.6.5 maakt de kamerinterface het iframe precies zo groot als het zichtbare deel van het browservenster. Op een telefoon staat je spel dus tussen de adresbalk en de werkbalk van de browser. Dat is een stuk lager dan het scherm: ongeveer 393×660 op een iPhone 15 of 16 in Safari, en ongeveer 375×548 op een iPhone SE.

- Vul het iframe met `html, body { height: 100% }` of `height: 100dvh`. Zet er geen `min-height: 100vh` naast: `100vh` is de hoogte zonder de balken van de browser, dus dan schuift de onderkant onder de werkbalk.
- Houd de belangrijkste knop en het eigen spelmateriaal van de speler (hand, dobbelstenen, invoer) in beeld zonder dat de pagina hoeft te scrollen. Lange lijsten scrollen in een eigen paneel.
- Geef randen padding met `max(12px, env(safe-area-inset-bottom))`. In het iframe is die inset meestal 0, maar op volledig scherm telt hij wel.
- Zet per kleurschema een `theme-color` in elke pagina. De kamerinterface kleurt de strook rond de werkbalk van de browser dan in de kleur van je spel. Ze neemt de eerste tag waarvan `media` past, of die geen `media` heeft. Dat leest ze als je pagina geladen is en als het kleurschema wisselt; een kleur die je tijdens het spel verandert, neemt ze niet over.
- Maak je testscreenshots op 393×660 en 375×548, niet alleen op de volle schermmaat.
- Zet op een echte telefoon `?wake` achter de kamerlink, zoals `/room/HWKRTZ/player?wake`. De kamerinterface toont dan de maat van het iframe en van het zichtbare deel. `me dev` bootst het zichtbare deel en `theme-color` niet na; zie [op een echte telefoon](testen.md#op-een-echte-telefoon).

Een `theme-color` voor licht en voor donker, in de `<head>` van elke rolpagina:

```html
<meta name="theme-color" content="#f3efe6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16201b" media="(prefers-color-scheme: dark)">
```

## Pagina's sluiten en terugkomen

Het stemspel sluit de verbinding bij `pagehide` en hervat bij `pageshow`. Zo vervangt een teruggekeerd tabblad netjes zijn eigen verbinding:

```js
window.addEventListener('pagehide', () => client.close());
window.addEventListener('pageshow', () => client.resume());
```

Opent dezelfde sleutel ergens anders een verbinding, dan sluit de oude met `closed: session_replaced`. De sleutel blijft bewaard, zodat je bewust kunt hervatten.

## Volgende stap

Bij een eigen spel moet de hostpagina ook de spelregels uitvoeren. Lees [de browserhost schrijven](browserhost.md).
