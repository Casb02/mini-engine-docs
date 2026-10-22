---
title: De ingebouwde spellen
nav_title: Voorbeelden
description: Wat Common Dice en Jeopardy laten zien over instellingen, rollen, serveracties, geheime antwoorden en het gedeelde scherm.
section: Een game bouwen
order: 6
---

# De ingebouwde spellen

Mini Engine heeft twee ingebouwde spellen met een serverruntime. Hun regels staan in Rust (`src/games/` in de engine); hun pagina's in `games/common-dice/` en `games/jeopardy/` renderen alleen snapshots en sturen acties. Ze zijn goede voorbeelden van rolprojecties en weergave, ook als je eigen spel in de browser draait.

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

- **Alle drie de spelleidermodi.** Standaard `hostless`: het spel gaat door als de maker zijn tabblad sluit.
- **Eén uitkomst voor iedereen.** De server gooit; de publieke state bevat de resultaten, wie gooide (`roller`, `roller_id`), een volgnummer (`sequence`), de configuratie, vastgehouden stenen (`held`), `rolled_at` in epochmilliseconden en maximaal twintig worpen geschiedenis.
- **Presentatie volgt de state.** De WebGL-animatie toont de uitkomst die al vaststaat; ze bepaalt haar niet. Met `prefers-reduced-motion` tuimelen de stenen niet, en zonder WebGL 2 toont het spel dezelfde getallen als tekst.
- **Later aansluiten.** Common Dice ondersteunt het.
- **Lokale assets.** Three.js staat als vendorbestand in `assets/vendor/`; er gaat geen verzoek naar een CDN.

Een worp met twee vastgehouden stenen:

```js
await client.action('roll', { held: [0, 2] });
```

Vastgehouden indexen verwijzen naar de bestaande worp. Minstens één steen blijft vrij.

## Jeopardy

Een quizbord met teams. Meerdere telefoons per team, een buzzer die de server eerlijk afhandelt, scores, geheime antwoorden en een expliciete onthulling. De quizmaster kiest en beoordeelt; de server bewaakt spelregels en scores.

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

- **Geheime data in `data.json`.** Het quizbord met vragen en antwoorden staat in `games/jeopardy/data.json` en is niet publiek.
- **Geheimen in `host_state`.** Het actieve antwoord ziet alleen de quizmaster, tot de onthulling.
- **Eenmalige scores.** Een herhaalde `judge` met dezelfde action-id telt niet dubbel.
- **De buzzer volgt aankomst bij de server.** Netwerkvertraging tussen apparaten speelt dus mee.

Een stukje van `data.json`:

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

## Accountresultaten

Beide spellen schrijven bij het afronden van een ronde resultaten voor deelnemers met een account. Common Dice telt worpen, geworpen stenen en het totaal; Jeopardy bewaart teamscore, winst en goede en foute antwoorden. Zie [accounts](../concepten/accounts.md).
