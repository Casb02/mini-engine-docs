---
title: De ingebouwde spellen
nav_title: Voorbeelden
description: Wat Common Dice en Jeopardy laten zien over instellingen, rollen, geheime antwoorden, het gedeelde scherm, realtime, achievements en eigen borden.
section: SDK
group: Een game bouwen
order: 4
---

# De ingebouwde spellen

Op Mini Engine staan twee ingebouwde spellen: Common Dice en Jeopardy. Hun regels draaien op de server (`runtime: "server"`); hun pagina's tonen snapshots en sturen acties, en bepalen zelf niets. Een eigen spel werkt anders, met de regels in het tabblad van de host. Toch laten deze twee goed zien hoe je rollen, geheimen en het gedeelde scherm aanpakt. Speel ze een keer op miniengine.nl.

## Common Dice

Eén worp voor de hele tafel. Echte 3D-dobbelstenen (d4, d6, d8, d10, d12 en d20), vasthouden, worpgeschiedenis, drie materiaalthema's en optioneel geluid en trilling.

### Instellingen

| Instelling | Waarden | Standaard |
| --- | --- | --- |
| `dice_count` | 1 tot 20 | 5 |
| `sides` | 4, 6, 8, 10, 12 of 20 | 6 |
| `roll_permission` | `everyone` of `owner` | `everyone` |
| `theme` | `ivory`, `obsidian` of `candy` | `ivory` |

`roll_permission: "owner"` laat alleen de host gooien en kan niet samen met de modus `hostless`.

### Wat het laat zien

- **Spelleidermodi.** Common Dice kent `hostless`, `playing` en `moderator`. Standaard `hostless`: het spel gaat door als de maker zijn tabblad sluit. Dat kan alleen omdat de regels op de server draaien; zie [spelleidermodi](../concepten/spelleidermodi.md).
- **Eén uitkomst voor iedereen.** De server gooit; de publieke state bevat de resultaten, wie gooide (`roller`, `roller_id`), een volgnummer (`sequence`), de configuratie, vastgehouden stenen (`held`), `rolled_at` in epochmilliseconden en maximaal twintig worpen geschiedenis.
- **Presentatie volgt de state.** De WebGL-animatie toont de uitkomst die al vaststaat; ze bepaalt haar niet. Met `prefers-reduced-motion` tuimelen de stenen niet, en zonder WebGL 2 toont het spel dezelfde getallen als tekst.
- **Later aansluiten.** Common Dice ondersteunt het.
- **Lokale assets.** Three.js zit in de assets van het spel; er gaat geen verzoek naar een CDN.
- **Achievements.** *Dubbel zes* voor minstens twee zessen in één worp, en *Hoogste worp* voor de hoogste losse worp van de ronde. De server kent ze toe bij het afronden.

Een worp met twee vastgehouden stenen:

```js
await client.action('roll', { held: [0, 2] });
```

Vastgehouden indexen verwijzen naar de bestaande worp. Minstens één steen blijft vrij.

## Jeopardy

Een quizbord met teams. Meerdere telefoons per team, een buzzer die de server afhandelt, scores, geheime antwoorden en een expliciete onthulling. De quizmaster kiest en beoordeelt; de server bewaakt spelregels en scores.

### Instellingen en rollen

| Instelling | Waarden | Standaard |
| --- | --- | --- |
| `team_count` | 2 tot 6 | 3 |

Jeopardy gebruikt alleen de modus `moderator` en ondersteunt geen later aansluiten.

### Het verloop

1. In de lobby kiest iedere speler een team met `choose_team`. Het aantal teams ligt vast zodra iemand gekozen heeft.
2. De quizmaster start als iedereen klaarstaat en een team heeft.
3. De quizmaster opent een vraag met `select_clue`. Het antwoord komt in `host_state.active_answer`, niet in de publieke state.
4. Spelers drukken met `buzz`. De eerste geldige buzz die bij de server aankomt, wint.
5. De quizmaster beoordeelt met `judge`. Goed: het team krijgt de waarde van de vraag. Fout: de waarde gaat eraf, dat team is geblokkeerd en de andere teams mogen drukken.
6. `reveal` zet het antwoord in de publieke state; `close_clue` sluit de vraag daarna.
7. Als alle vragen gespeeld zijn, gaat de kamer zelf naar `finished`.

### Wat het laat zien

- **Geheime data in `data.json`.** Het quizbord met vragen en antwoorden staat in de `data.json` van het spel en is niet publiek.
- **Geheimen in `host_state`.** Het actieve antwoord ziet alleen de quizmaster, tot de onthulling.
- **Eenmalige scores.** Een herhaalde `judge` met dezelfde action-id telt niet dubbel.
- **De buzzer volgt aankomst bij de server.** Netwerkvertraging tussen apparaten speelt dus mee.
- **Realtime naast de actie.** Bij het drukken stuurt de speler ook een [realtime-event](../concepten/realtime.md#voorbeeld-een-buzzer) `pressed`. Host en scherm tonen meteen wie er drukte, in volgorde en met het verschil in milliseconden, zoals *Sander +14 ms*. De `buzz`-actie blijft beslissen wie de vraag krijgt.
- **Eigen borden.** Jeopardy kent de soort set `board`. Wie is ingelogd, maakt op **Mijn sets** een eigen bord en kiest het bij een nieuwe kamer. De lobby toont dan *Bord: …* met de naam van het bord. Zie [eigen sets](../concepten/eigen-sets.md).
- **Achievements.** *Eerste goede antwoord*, *Winnaar*, *Foutloos* en *Eigen bord*; zie [achievements](../concepten/achievements.md#ingebouwde-spellen).

Een stukje van `data.json`, het standaardbord:

```json
{
  "categories": [
    {
      "id": "wereld",
      "title": "Rond de wereld",
      "clues": [
        { "id": "wereld-100", "value": 100, "question": "Welke stad wordt ook wel de Lichtstad genoemd?", "answer": "Parijs." }
      ]
    }
  ]
}
```

Een eigen bord heeft geen id's en waarden; die komen erbij als de kamer start. Zie [de Jeopardy-editor](../concepten/eigen-sets.md#de-jeopardy-editor).

## De acties

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

De types van deze acties staan in [`ActionPayloads`](../sdk/types.md#actionpayloads). Jeopardy-fouten die je kunt tegenkomen: `buzzer_closed`, `teams_required`, `teams_locked` en `invalid_game_action`; zie [foutcodes](../sdk/events-en-fouten.md#foutcodes-van-de-server).

## Accountresultaten en achievements

Beide spellen schrijven bij het afronden van een ronde resultaten en achievements voor deelnemers met een account. Common Dice telt worpen, geworpen stenen en het totaal; Jeopardy bewaart teamscore, winst en goede en foute antwoorden. Een eigen spel schrijft geen resultaten, maar kan wel achievements toekennen. Zie [accounts](../concepten/accounts.md) en [achievements](../concepten/achievements.md).
