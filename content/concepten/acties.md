---
title: Acties en action-id's
description: Hoe spelers en spelleiders acties sturen, wat een action_id doet en waarom de SDK nooit automatisch opnieuw probeert.
section: Concepten
order: 5
---

# Acties en action-id's

Een actie is iets wat een deelnemer in het spel doet: gooien, buzzen, stemmen. Je stuurt een naam en een JSON-object met data.

```json
{ "name": "roll", "data": { "held": [0, 2] }, "action_id": "3d6c1b0e-…" }
```

Via de SDK:

```js
await client.action('roll', { held: [0, 2] });
```

## Regels voor een actie

| Veld | Regel |
| --- | --- |
| `name` | 1 tot 64 tekens: letters, cijfers, `_`, `.` of `-` |
| `data` | JSON, maximaal 8 KiB. Serverspellen vragen een object. |
| `action_id` | Optioneel, 1 tot 64 tekens zonder controletekens |

Wie een actie mag sturen, hangt van de runtime af. Bij een serverspel beslissen de spelregels in Rust; het gedeelde scherm mag nooit acties sturen. Bij een eigen browserspel sturen alleen spelers acties en verwerkt de host ze.

## Wat een action-id doet

Bij serverspellen onthoudt de engine de laatste 256 verwerkte action-id's, gekoppeld aan de afzender en de huidige ronde. Komt dezelfde id binnen dat venster nog eens binnen, dan slaagt de actie zonder tweede effect en zonder nieuwe versie. Een herhaalde worp levert dus geen tweede worp op, en een herhaald goed antwoord geen dubbele score.

De SDK geeft elke actie standaard een nieuwe, unieke id (`crypto.randomUUID()`). Wil je een actie bewust opnieuw proberen, hergebruik dan dezelfde id:

```js
const actionId = crypto.randomUUID();
try {
  await client.action('buzz', {}, { actionId });
} catch (error) {
  // Kijk eerst naar de actuele snapshot. Is de buzz er niet, probeer dan met dezelfde id.
  await client.action('buzz', {}, { actionId });
}
```

Een nieuwe lobbyronde begint een nieuw deduplicatievenster.

## Nooit automatisch opnieuw

De SDK herhaalt opdrachten nooit vanzelf, ook niet na een time-out of een herverbinding. Open opdrachten worden bij uitval afgewezen. Na een onzeker resultaat kijk je eerst naar de nieuwste snapshot en beslis je dan.

## Bij eigen browserspellen

Een eigen spel met `runtime: "host"` kent geen deduplicatie in de engine. De engine stuurt de actie door naar de host als:

```json
{ "type": "action", "player_id": "…", "name": "vote", "data": { "yes": true }, "request_id": "7" }
```

De `player_id` komt van de engine en is betrouwbaar. De `data` komt van de speler en is dat niet: controleer altijd de vorm, de spelfase en de spelregels voordat je de state wijzigt. De bevestiging aan de speler betekent alleen dat de actie in de wachtrij van de host staat.

## De acties van de ingebouwde spellen

| Spel | Actie | Wie | Wat |
| --- | --- | --- | --- |
| Common Dice | `roll {held?}` | Deelnemers, of alleen de host bij `roll_permission: "owner"` | Gooit de vrije stenen; minstens één steen blijft vrij |
| Common Dice | `clear_history {}` | Host | Wist de zichtbare worpgeschiedenis |
| Beide | `start {}` / `finish {}` | Iedere deelnemer in `hostless`, anders de host | Start of sluit de ronde |
| Jeopardy | `choose_team {team_id}` | Speler, in de lobby | Kiest een team |
| Jeopardy | `buzz {}` | Speler, bij een open vraag | De eerste geldige buzz wint |
| Jeopardy | `select_clue {clue_id}` | Host | Opent een vraag |
| Jeopardy | `judge {correct}` | Host | Beoordeelt de buzz: plus of min de waarde van de vraag. Na een fout antwoord is dat team geblokkeerd en mogen de andere teams drukken. |
| Jeopardy | `reveal {}` | Host | Zet het antwoord in de publieke state |
| Jeopardy | `reopen {}` | Host | Verbergt het antwoord weer en opent de vraag voor alle teams |
| Jeopardy | `close_clue {}` | Host | Sluit de vraag, nadat het antwoord onthuld is |

Meer over beide spellen staat bij [voorbeelden](../game-bouwen/voorbeelden.md).
