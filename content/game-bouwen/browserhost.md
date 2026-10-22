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

Alleen spelers met een account kunnen een achievement krijgen, en alleen als jij de kamer met een account maakte. Omdat de server niet kan nagaan of de achievement verdiend is, staat hij op het account apart, onder *Toegekend door eigen spellen*. Zie [achievements](../concepten/achievements.md#eigen-spellen).

## Realtime

Voor wat snel moet en niet hoeft te tellen, zoals wie als eerste drukte of waar iemands cursor staat, gebruik je [realtime](../concepten/realtime.md). Iedere rol kan dat sturen, ook spelers; het gaat niet via de host en verandert de spelstand niet. Wat telt voor de uitslag, blijft een actie die de host controleert.

## Grenzen van de hostruntime

- Het hosttabblad moet verbonden blijven tijdens het spelen.
- Er is geen deduplicatie van action-id's in de engine.
- Scores uit hostspellen tellen niet mee in accountstatistieken. Achievements kun je wel toekennen; die staan apart.
- Er is geen hostoverdracht: de hostsleutel leeft in het browsertabblad waarmee de kamer is gemaakt.

Zie ook [runtimes](../concepten/runtimes.md) en [state en versies](../concepten/state-en-versies.md).
