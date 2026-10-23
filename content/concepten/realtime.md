---
title: Realtime
description: Snelle events en live waarden in een kamer, naast de opgeslagen spelstand. Wat het is, events tegenover waarden, de grenzen, verlies en volgorde, met een buzzer en kartposities als voorbeeld.
section: SDK
group: Concepten
order: 6
toc_depth: 3
---

# Realtime

Sinds 0.5 heeft een kamer naast de opgeslagen spelstand een tweede kanaal: realtime. Daarover gaan kleine berichten die snel moeten zijn en niet bewaard hoeven te worden. Wie als eerste drukte, een emoji, de positie van een kart dertig keer per seconde.

Realtime loopt over dezelfde websocket als de snapshots, maar staat los van de spelstand. Mini Engine slaat realtime niet op, verhoogt er de versie niet mee en bevestigt niets.

## Spelstand of realtime?

| | Spelstand (state) | Realtime |
| --- | --- | --- |
| Opgeslagen | Ja; overleeft een herstart van de server | Nee; alleen zolang de server draait |
| Versie | Elke wijziging verhoogt `version` | Raakt `version` niet |
| Bevestiging | Een `ack` nadat het is opgeslagen | Geen `ack` |
| Verlies | Na een `ack` gaat niets verloren | Berichten kunnen wegvallen |
| Wie schrijft | De host, volgens de spelregels | Iedere rol: host, spelers en scherm |
| Waarvoor | Spelregels, beurten, scores, de uitslag | Buzzers, reacties, cursors, posities, geluidjes |

Vuistregel: alles wat telt voor de uitslag, hoort in de spelstand. Realtime is voor wat je ziet en hoort terwijl het gebeurt.

## Events en waarden

Er zijn twee soorten realtimeberichten.

### Events

Een event is een losse melding: verstuurd en weg. Het heeft een kanaalnaam, optionele data, een afzender (`from`) en een tijdstip (`ts`). Gebruik events voor een buzzer, een reactie of een seintje als "animatie klaar".

Een event gaat standaard naar iedereen in de kamer. Je kunt het ook richten:

| Ontvangers (`to`) | Wie krijgt het |
| --- | --- |
| `all` (standaard) | Iedereen die verbonden is |
| `host` | Alleen de host |
| `players` | Iedereen met een spelersplek, ook een meespelende host |
| `display` | Alleen het gedeelde scherm |
| Lijst met speler-id's | Die spelers, hoogstens 16 id's |

De afzender krijgt zijn eigen event niet terug, tenzij hij `echo` aanzet.

### Waarden

Een waarde is een live stand per afzender en sleutel, bijvoorbeeld `kart` of `cursor`. De laatste waarde wint. Wie later binnenkomt, krijgt meteen alle huidige waarden. Gebruik waarden voor posities, cursors en "is aan het typen".

- Waarden staan per afzender: `host`, `display` of een speler-id. Een meespelende host schrijft als `host`. Niemand kan de waarden van een ander overschrijven.
- `null` als waarde wist de sleutel.
- Een speler die even wegvalt, houdt zijn waarden. Ze verdwijnen als hij de kamer verlaat of wordt verwijderd; iedereen krijgt dan per sleutel de waarde `null`.
- De host kan alle waarden in de kamer in één keer wissen.
- Alle waarden verdwijnen als de kamer sluit of verloopt, en bij een herstart van de server.

## Afzender en tijd

De server zet `from` en `ts` zelf op elk bericht. `from` zegt wie het stuurde, met rol en speler-id. `ts` is het moment waarop de server het bericht ontving, in milliseconden sinds de Unix-epoch. Niemand kan hem vervalsen, en je vergelijkt alle telefoons op één klok, niet op hun eigen klokken.

Een client kan `from` en `ts` niet meesturen; een bericht dat het probeert, wordt geweigerd. De `data` en `value` zelf komen wel van de client en zijn net zo onbetrouwbaar als actiedata.

## Verlies en volgorde

Realtime ruilt zekerheid in voor snelheid. Dat is het contract:

- **Geen bevestiging, geen herhaling.** Een event dat niet aankomt, komt niet meer. De SDK zet realtime nooit in een wachtrij en stuurt na een herverbinding niets opnieuw.
- **Berichten kunnen wegvallen.** Stuurt een verbinding meer dan zijn budget, dan laat de server de rest stilletjes vallen en meldt dat met het event `throttled`. De verbinding blijft open.
- **Een trage ontvanger mist berichten.** Loopt een apparaat te ver achter, dan slaat het realtimeberichten over. Zijn snapshots komen gewoon binnen en zijn verbinding blijft staan.
- **Geen volgorde ten opzichte van snapshots.** Een event kan vóór of na de snapshot van een bijbehorende actie aankomen. Reken daar niet op.
- **Waarden herstellen zich.** Omdat de laatste waarde wint, maakt een gemiste tussenstand niet uit. Na een herverbinding bouwt de SDK alle waarden opnieuw op uit de lijst die de server bij het verbinden stuurt.

Realtime werkt in elke fase van de kamer: lobby, `running` en `finished`.

## Grenzen

| Grens | Waarde |
| --- | --- |
| Kanaalnaam en sleutel | 1 tot 64 tekens: letters, cijfers, `_`, `.`, `:` of `-` |
| `data` van een event, `value` van een waarde | Hoogstens 2 KiB als JSON |
| Ontvangers | `all`, `host`, `players`, `display` of hoogstens 16 speler-id's |
| Berichten per verbinding | 60 per seconde, met pieken tot 120. Dit budget staat los van dat voor opdrachten. |
| Sleutels per afzender | 64 |
| Waarden per kamer | 256 KiB samen |
| Event `throttled` | Hoogstens eens per 5 seconden per verbinding |

Komt een waarde boven de grens van 64 sleutels of 256 KiB, dan valt ze weg en telt ze mee in `throttled`. Een ongeldig bericht, zoals een verkeerde kanaalnaam, te veel data of een onbekende ontvanger, geeft het event `error` met `invalid_request`. Alleen de host mag alle waarden wissen; anderen krijgen `forbidden`.

## Voorbeeld: een buzzer

Jeopardy laat zien hoe realtime en acties samenwerken. De `buzz` blijft de actie die telt: daarmee wordt beslist wie de vraag mag beantwoorden, en dat komt in de spelstand. Tegelijk stuurt de speler een event `pressed`. Host en scherm tonen daarmee meteen wie er drukte, in volgorde en met het verschil in milliseconden, zoals *Sander +14 ms*. Dat is het verschil in aankomst bij de server, niet in het moment van drukken: netwerkvertraging telt mee.

Op de spelerspagina:

```js
buzzButton.onclick = () => {
  buzzButton.disabled = true;
  client.realtime.emit('pressed', { clue: client.room.public_state.active.id });
  client.action('buzz').catch(showError);
};
```

Op de pagina's van de host en het scherm:

```js
let clue = null;
let presses = [];

client.on('snapshot', (room) => {
  const active = room.public_state.active?.id ?? null;
  if (active !== clue) {
    clue = active;
    presses = [];
  }
});

client.realtime.on('pressed', (data, from, ts) => {
  if (!from.player_id || data?.clue !== clue) return;
  if (presses.some((press) => press.player_id === from.player_id)) return;
  presses.push({ player_id: from.player_id, ts });
  presses.sort((a, b) => a.ts - b.ts);
  renderPresses(presses.map((press) => ({ ...press, gap: press.ts - presses[0].ts })));
});
```

Het event beslist niets. Een speler kan een nep-`pressed` sturen, maar niet uit naam van een ander en niet op een eerder tijdstip. Wie de punten mag pakken, bepaalt nog steeds de `buzz`-actie. De lijst is er voor het oog.

## Voorbeeld: kartposities

Bij een racespel stuurt elke speler zijn eigen positie als waarde:

```js
function tick() {
  kart.update();
  client.realtime.set('kart', { x: kart.x, y: kart.y, angle: kart.angle });
  requestAnimationFrame(tick);
}
```

De SDK voegt snelle wijzigingen per sleutel samen en verstuurt hoogstens elke 33 milliseconden de laatste stand. Ook bij zestig beelden per seconde gaan er dus hoogstens dertig berichten per seconde per sleutel over de lijn. Twee sleutels die zo vaak veranderen, zitten samen op de grens van 60 per seconde.

Het scherm tekent alle karts:

```js
const karts = new Map();

client.realtime.onValue('kart', (value, from) => {
  if (value === null) karts.delete(from.player_id);
  else karts.set(from.player_id, value);
});
```

Opent het scherm later, dan krijgt het alle huidige posities in één keer. Verlaat Kevin de race, dan krijgt iedereen voor zijn sleutel `kart` de waarde `null`.

Wie als eerste over de streep komt, telt voor de uitslag. Leg dat vast met een actie en de spelstand, niet met realtime.

## Verder lezen

- De methoden staan bij [de websocketclient](../sdk/realtime-client.md#realtime): `client.realtime.emit`, `on`, `set`, `value`, `onValue` en `reset`.
- Waarom realtime los staat van versies en bevestigingen: [state en versies](state-en-versies.md#realtime-staat-erbuiten).
