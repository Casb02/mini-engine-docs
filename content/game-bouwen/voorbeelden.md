---
title: Het ingebouwde spel
nav_title: Voorbeelden
description: Wat Common Dice, het ingebouwde spel van Mini Engine, laat zien over instellingen, spelleidermodi, één uitkomst voor iedereen en achievements, en welke startsjablonen een eigen spel voordoen.
section: SDK
group: Een game bouwen
order: 4
---

# Het ingebouwde spel

Op Mini Engine staat één ingebouwd spel: Common Dice. Tot 0.7 was Jeopardy er ook; dat is niet meer ingebouwd. De regels van Common Dice draaien op de server (`runtime: "server"`); de pagina's tonen snapshots en sturen acties, en bepalen zelf niets. Een eigen spel werkt anders, met de regels in het tabblad van de host. Toch laat Common Dice goed zien hoe je instellingen, spelleidermodi en het gedeelde scherm aanpakt. Speel het een keer op miniengine.nl.

Voor de manier waarop een eigen spel werkt, zijn de [startsjablonen](#voorbeelden-voor-een-eigen-spel) een beter voorbeeld.

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
- **Achievements.** *Dubbel zes* voor minstens twee zessen in één worp, en *Hoogste worp* voor de hoogste losse worp van de ronde. De server kent ze toe bij het afronden; zie [achievements](../concepten/achievements.md#het-ingebouwde-spel).

Een worp met twee vastgehouden stenen:

```js
await client.action('roll', { held: [0, 2] });
```

Vastgehouden indexen verwijzen naar de bestaande worp. Minstens één steen blijft vrij.

## De acties

| Actie | Wie | Wat |
| --- | --- | --- |
| `roll {held?}` | Deelnemers, of alleen de host bij `roll_permission: "owner"` | Gooit de vrije stenen; minstens één steen blijft vrij |
| `clear_history {}` | Host | Wist de zichtbare worpgeschiedenis |
| `start {}` / `finish {}` | Iedere deelnemer in `hostless`, anders de host | Start of sluit de ronde |

De types van deze acties staan in [`ActionPayloads`](../sdk/types.md#actionpayloads). Daar staan in SDK 0.6.0 en 0.7.0 ook nog de acties van Jeopardy; die bestaan sinds Mini Engine 0.7 niet meer. Een verkeerde actie geeft `400 invalid_request`, een actie die alleen de host mag `403 forbidden`, en een worp buiten een ronde `409 game_not_running`.

## Accountresultaten en achievements

Common Dice schrijft bij het afronden van een ronde resultaten en achievements voor deelnemers met een account. Het telt worpen, geworpen stenen en het totaal van je worpen. Een eigen spel schrijft geen resultaten, maar kan wel achievements toekennen. Zie [accounts](../concepten/accounts.md) en [achievements](../concepten/achievements.md).

## Voorbeelden voor een eigen spel

Een eigen spel draait zijn regels in het tabblad van de host. De startsjablonen van [`me init`](../publiceren/cli.md#startsjablonen) zijn werkende spellen die laten zien hoe dat gaat:

| Sjabloon | Wat het voordoet |
| --- | --- |
| `quiz` | Geheime antwoorden in `data.json` en `host_state`, het eigen antwoord in `player_states`, een onthulling, [eigen sets](../concepten/eigen-sets.md) met een optionele [afbeelding](../concepten/eigen-sets.md#afbeeldingen) bij elke vraag, en een achievement |
| `buzzer` | [Realtime](../concepten/realtime.md): wie drukte als eerste, beslist door de host op de klok van de server |
| `stemmen` | Een gedeeld scherm naast de spelers, en een maker die meespeelt |
| `beurten` | Beurten, een dobbelsteen die de host gooit, en overslaan wie te lang offline is |

Maak er een met `me init --template quiz` en speel het meteen met `me dev`.
