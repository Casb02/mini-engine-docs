---
title: State en versies
description: Publieke, host- en spelersstate, het versienummer van een kamer, hoe je versieconflicten afhandelt, en waarom realtime daarbuiten staat.
section: SDK
group: Concepten
order: 4
---

# State en versies

De spelstand van een kamer bestaat uit drie delen. Wie wat ziet, bepaalt Mini Engine per rol.

| Deel | Zichtbaar voor | Voorbeeld |
| --- | --- | --- |
| `public_state` | Iedereen, ook het scherm | Bord, scores, de zichtbare worp |
| `host_state` | Alleen de host | Het actieve antwoord, interne spelregels |
| `player_states[id]` | De host en die ene speler | Handkaarten |

Een speler leest zijn eigen deel als `private_state`, nooit de hele map. Het scherm krijgt geen privédeel.

## De state vervangen

Bij een eigen spel publiceert de host de **volledige** spelstand in één keer:

```js
await client.setState({
  expected_version: client.room.version,
  public_state: { round: 1 },
  host_state: { answer: 'Venus' },
  player_states: { [playerId]: { cards: [1, 2] } },
});
```

Weggelaten `host_state` wordt `null` en weggelaten `player_states` wordt `{}`. Elke sleutel in `player_states` moet een bestaande speler zijn. Alles samen mag maximaal 64 KiB zijn (`state_too_large`). Een ingebouwd spel weigert `setState`.

## Versies

Elke kamer heeft een `version`. Wijzigingen aan spelstand, instellingen, config en de levensloop verhogen die versie. Opdrachten die op een bepaalde stand voortbouwen, sturen een `expected_version` mee:

- `setState`: die geef je zelf mee, uit de snapshot waarop je wijziging gebaseerd is;
- `setSettings` en `configure`: de SDK stuurt de versie van `client.room` mee.

Klopt de versie niet meer, dan faalt de opdracht met `409 version_conflict`. Lees dan de actuele snapshot, beoordeel de handeling opnieuw en probeer het pas daarna nog eens.

## Niet elke snapshot heeft een nieuwe versie

Aanwezigheid, meedoen, vertrekken en klaarzetten leveren ook een nieuwe snapshot op, maar verhogen de versie niet. Filter dus niet alle snapshots met hetzelfde versienummer weg: dan mis je wie er binnenkomt of klaarstaat.

## Opslaan voordat het zichtbaar is

Duurzame wijzigingen worden opgeslagen voordat de nieuwe snapshot verschijnt. Mislukt de opslag, dan blijven zichtbare state, versie en resultaten zoals ze waren. Ook na een herstart van de server is de laatst opgeslagen stand er gewoon weer.

## Eerst de snapshot, dan de bevestiging

Bij een geslaagde opdracht krijgt de client eerst de bijgewerkte snapshot en daarna de bevestiging. Als `await client.setState(…)` klaar is, staat de nieuwe versie dus al in `client.room`. De bevestiging (`ack`) bevat zelf geen state. Ga uit van de snapshot, niet van de ack.

## Realtime staat erbuiten

[Realtime](realtime.md) hoort niet bij de spelstand. Events en waarden:

- worden nooit opgeslagen, alleen in het geheugen bewaard;
- verhogen de versie niet en vragen geen `expected_version`;
- krijgen geen `ack` en staan niet in de snapshot;
- hebben geen vaste volgorde ten opzichte van snapshots.

Na een herstart van de server is de spelstand er weer, maar zijn alle realtimewaarden weg. Wat telt voor de uitslag, zet je daarom in de state, via een actie of `set_state`. Realtime is voor wat je onderweg laat zien.

Ook het event `achievement`, dat de kamer krijgt als iemand een [achievement](achievements.md#vieren-in-het-spel) verdient, valt buiten de state: het heeft geen versie en staat niet in de snapshot. De achievement zelf staat op het account.

Het snapshotveld `set` verandert nooit tijdens de kamer. Een [eigen set](eigen-sets.md) ligt vast bij het maken van de kamer, net als de versie van het spel.
