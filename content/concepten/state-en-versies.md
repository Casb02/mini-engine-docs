---
title: State en versies
description: Publieke, host- en spelersstate, het versienummer van een kamer en hoe je versieconflicten afhandelt.
section: Concepten
order: 4
---

# State en versies

De spelstand van een kamer bestaat uit drie delen. Wie wat ziet, bepaalt de engine per rol.

| Deel | Zichtbaar voor | Voorbeeld |
| --- | --- | --- |
| `public_state` | Iedereen, ook het scherm | Bord, scores, de zichtbare worp |
| `host_state` | Alleen de host | Het actieve antwoord, interne spelregels |
| `player_states[id]` | De host en die ene speler | Handkaarten |

Een speler leest zijn eigen deel als `private_state`, nooit de hele map. Het scherm krijgt geen privédeel.

## De state vervangen

Bij een eigen spel (hostruntime) publiceert de host de **volledige** spelstand in één keer:

```json
{
  "expected_version": 4,
  "public_state": { "round": 1 },
  "host_state": { "answer": "Venus" },
  "player_states": { "player-uuid": { "cards": [1, 2] } }
}
```

Weggelaten `host_state` wordt `null` en weggelaten `player_states` wordt `{}`. Elke sleutel in `player_states` moet een bestaande speler zijn. Alles samen mag maximaal 64 KiB zijn. Een serverruntime weigert `set_state`.

## Versies

Elke kamer heeft een `version`. Wijzigingen aan spelstand, instellingen, config en de levensloop verhogen die versie. Mutaties die op een bepaalde stand voortbouwen, sturen `expected_version` mee:

- `set_state`
- `settings`
- `configure`

Klopt de versie niet meer, dan antwoordt de engine met `409 version_conflict`. Lees dan de actuele snapshot, beoordeel de handeling opnieuw en probeer het pas daarna nog eens.

## Niet elke snapshot heeft een nieuwe versie

Aanwezigheid, meedoen, vertrekken en klaarzetten leveren ook een nieuwe snapshot op, maar verhogen de versie niet. Filter dus niet alle snapshots met hetzelfde versienummer weg: dan mis je wie er binnenkomt of klaarstaat.

## Opslaan voordat het zichtbaar is

Duurzame wijzigingen worden opgeslagen voordat de nieuwe snapshot verschijnt. Mislukt de opslag, dan blijven zichtbare state, versie en resultaten zoals ze waren. Na een herstart van de engine is de laatst opgeslagen stand er gewoon weer.

## Volgorde bij de websocket

Bij een geslaagde mutatie via de websocket stuurt de engine eerst de bijgewerkte snapshot en daarna de bevestiging. De bevestiging (`ack`) bevat zelf geen state. Ga dus uit van de snapshot, niet van de ack.
