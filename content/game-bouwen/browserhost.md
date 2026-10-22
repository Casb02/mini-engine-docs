---
title: De browserhost schrijven
description: Acties ontvangen, controleren en de nieuwe spelstand publiceren in een eigen spel met runtime host, met een wachtrij en versiecontrole.
section: Een game bouwen
order: 4
---

# De browserhost schrijven

In een eigen spel (`runtime: "host"`) is het tabblad van de spelleider de scheidsrechter. Spelers sturen acties, de host controleert ze en publiceert de volledige nieuwe spelstand.

## Een speler stuurt een actie

```js
await client.action('vote', { yes: true });
```

De speler wacht daarna op een nieuwe snapshot om te zien wat er veranderd is.

## De host ontvangt de actie

```js
client.on('action', (action) => {
  // action = { type: 'action', player_id, name, data, request_id }
});
```

`player_id` komt van de engine en klopt altijd. `data` komt van de speler: controleer de vorm, de spelfase en de spelregels. Clientdata mag nooit zelf een identiteit of een score voorschrijven.

## De host publiceert de nieuwe state

```js
await client.setState({
  expected_version: client.room.version,
  public_state: nextPublicState,
  host_state: nextHostState,
  player_states: nextPlayerStates,
});
```

Dit vervangt de hele spelstand. Laat je `host_state` of `player_states` weg, dan worden ze `null` en `{}`. Alles samen mag maximaal 64 KiB zijn.

Elke sleutel in `player_states` moet een huidige speler zijn. Verlaat iemand de kamer midden in een ronde, dan mislukt een `setState` die die speler nog noemt. Bouw `player_states` daarom bij elke publicatie opnieuw op uit `room.players`.

## Eén wijziging tegelijk

Elke `setState` gebruikt de versie van de laatste snapshot. Twee wijzigingen tegelijk betekent dat de tweede een verouderde versie meestuurt en `409 version_conflict` krijgt. Zet daarom alle mutaties, ook die van je eigen hostknoppen, in één Promise-wachtrij:

```js
let queue = Promise.resolve();
const enqueue = (operation) => {
  queue = queue.then(operation).catch(showError);
  return queue;
};

client.on('action', (action) => enqueue(async () => {
  const room = client.room;
  const yes = action.data && typeof action.data === 'object' ? action.data.yes : undefined;
  if (!room || room.status !== 'running' || action.name !== 'vote' || typeof yes !== 'boolean') return;
  if (!room.players.some((player) => player.id === action.player_id)) return;
  const votes = { ...(room.public_state?.votes ?? {}), [action.player_id]: yes };
  await client.setState({ expected_version: room.version, public_state: { votes } });
}));

startButton.onclick = () => enqueue(() => client.lifecycle('running'));
```

Bij de websocket komt de nieuwe snapshot vóór de bevestiging. Als `await client.setState(…)` klaar is, bevat `client.room` dus al de nieuwe versie voor de volgende stap in de wachtrij.

Krijg je toch een conflict, kijk dan opnieuw naar de actuele state. Speel een onzekere actie niet blind opnieuw af.

## Als de maker meespeelt

Sinds 0.5.1 kan de maker meespelen in een eigen spel, als het manifest `playing` in [`host_modes`](package-en-manifest.md#host-modes) heeft. Een nieuw spel uit `me game new` doet dat standaard. De hostpagina is dan scheidsrechter én de spelerspagina van de maker. Je ziet het aan de snapshot: `client.room.you.player_id` is de spelersplek van de maker, en `client.room.host_player_id` is hetzelfde id voor iedere rol.

De hostverbinding kan geen `action` sturen; dat geeft `403 forbidden`. De hostpagina past de zet van de maker daarom zelf toe, in dezelfde wachtrij als de acties van spelers:

```js
function applyVote(room, playerId, yes) {
  const votes = { ...(room.public_state?.votes ?? {}), [playerId]: yes };
  return client.setState({ expected_version: room.version, public_state: { votes } });
}

client.on('action', (action) => enqueue(async () => {
  const room = client.room;
  const yes = action.data && typeof action.data === 'object' ? action.data.yes : undefined;
  if (!room || room.status !== 'running' || action.name !== 'vote' || typeof yes !== 'boolean') return;
  if (!room.players.some((player) => player.id === action.player_id)) return;
  await applyVote(room, action.player_id, yes);
}));

// De stemknoppen op de hostpagina, alleen als de maker meespeelt
yesButton.onclick = () => enqueue(async () => {
  const room = client.room;
  if (!room || room.status !== 'running' || !room.you.player_id) return;
  await applyVote(room, room.you.player_id, true);
});
```

Verder:

- **Klaar.** De plek van de maker staat altijd klaar en houdt het starten niet tegen. Toon op de hostpagina dus geen klaarknop voor de maker.
- **Geheimen.** Wat alleen de maker als speler mag zien, staat in `player_states[host_player_id]`; de hostpagina krijgt het terug als `private_state`. Bedenk dat de hostpagina ook `host_state` en alle `player_states` ziet. Een spel met geheime kaarten per speler is met een meespelende maker dus niet eerlijk tegenover de anderen; bied voor zo'n spel alleen `moderator` aan.
- **Zelfde scherm.** In een gezelschapsspel is de hostpagina gewoon de spelerspagina: dezelfde opmaak en dezelfde manier van spelen als op een telefoon. Daarbij alleen wat het spel van de maker nodig heeft: *Start het spel* in de lobby in plaats van *Ik ben klaar*, *Nieuw spel* na afloop en een rustige link *Spel stoppen*. Soms heeft een spel een eigen extra stap, zoals in een tekenspel het langslopen van de eindtekeningen. Geen console met overslaanknop, regels of spelerslijst.
- **Spelerslijst.** De maker is een speler zoals de rest; zet er geen *spelleider* bij. Andere pagina's kunnen met `host_player_id` zeggen wie het spel start: *Dani start het spel als iedereen klaar is.*
- **Achievements.** De maker is een speler zoals iedereen en kan op zijn eigen plek (`host_player_id`) een achievement krijgen.

## Als de host een tv is

Sinds 0.5.2 kan een spel `tv` in `host_modes` zetten. Het apparaat dat de kamer maakt, is dan het gedeelde scherm en speelt niet mee: `client.room.you.player_id` en `client.room.host_player_id` zijn `null`. Lees de modus uit `client.room.config.host_mode` en toon op de hostpagina het scherm: QR-code en kamercode in de lobby, het spel groot tijdens het spelen, met *Start het spel* en *Nieuw spel*. De scheidsrechter werkt precies als bij `playing`.

Twee dingen helpen bij een spel met beurten, in beide modi:

- **Wie offline is, wordt overgeslagen.** Een telefoon die op slot gaat, verliest de verbinding. Tel alleen de tijd binnen iemands beurt: start een klok op het laatste van twee momenten, het begin van de beurt of het moment dat die speler offline ging. Sla de beurt na 30 seconden over, en stop de klok als de speler terugkomt.
- **Het scherm blijft aan.** Vraag tijdens het spel `navigator.wakeLock.request('screen')` aan, opnieuw als de pagina weer zichtbaar wordt, en negeer fouten.

## Wat de ack wel en niet betekent

Voor een speler betekent de bevestiging van een actie in een hostspel alleen: *de actie staat in de wachtrij van de host*. Niet: *de host heeft haar verwerkt*. Valt de host weg, dan kan de actie verloren gaan. Is de host offline op het moment dat een speler een actie stuurt, dan krijgt de speler `409 host_offline`.

Een `setState` van de host wordt wel opgeslagen voordat de engine de nieuwe snapshot verspreidt.

## Geheime speldata

Antwoorden en andere geheime gegevens horen in `data.json`. Alleen de host leest die, met zijn eigen sleutel:

```js
import { ApiClient } from '/sdk/mini-engine.js';
const data = await new ApiClient().gameData(client.code, client.token);
```

Zet wat spelers nog niet mogen zien in `host_state`, en wat één speler mag zien in diens `player_states[id]`. Pas na een expliciete onthulling gaat het naar `public_state`.

Kent je spel [eigen sets](../concepten/eigen-sets.md) en koos de maker er een, dan geeft `gameData()` die set in plaats van `data.json`. Kijk naar `client.room.set` om te weten welke van de twee je kreeg.

## Achievements toekennen

Declareer je achievements in het manifest en ken ze toe vanuit de host, bijvoorbeeld als de ronde klaar is:

```js
enqueue(async () => {
  await client.lifecycle('finished');
  for (const player of client.room.players) {
    if (player.account_id && isWinner(player.id)) await client.award(player.id, 'winnaar');
  }
});
```

Alleen spelers met een account kunnen een achievement krijgen, en alleen als jij de kamer met een account maakte. Speel je zelf mee, dan kun je ze op je eigen plek ook verdienen. Alleen een spelleider die met hetzelfde account ook als gewone speler meedoet, kan zichzelf niets geven. Omdat de server niet kan nagaan of de achievement verdiend is, staat hij op het account apart, onder *Toegekend door eigen spellen*. Zie [achievements](../concepten/achievements.md#eigen-spellen).

## Realtime

Voor wat snel moet en niet hoeft te tellen, zoals wie als eerste drukte of waar iemands cursor staat, gebruik je [realtime](../concepten/realtime.md). Iedere rol kan dat sturen, ook spelers; het gaat niet via de host en verandert de spelstand niet. Wat telt voor de uitslag, blijft een actie die de host controleert.

## Grenzen van de hostruntime

- Het hosttabblad moet verbonden blijven tijdens het spelen.
- Er is geen deduplicatie van action-id's in de engine.
- Scores uit hostspellen tellen niet mee in accountstatistieken. Achievements kun je wel toekennen; die staan apart.
- Er is geen hostoverdracht: de hostsleutel leeft in het browsertabblad waarmee de kamer is gemaakt.

Zie ook [runtimes](../concepten/runtimes.md) en [state en versies](../concepten/state-en-versies.md).
