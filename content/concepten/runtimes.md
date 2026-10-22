---
title: Runtimes
description: Het verschil tussen spellen waarvan de regels in Rust op de server draaien en spellen waarvan de regels in de browser van de spelleider draaien.
section: Concepten
order: 3
---

# Runtimes

Waar de spelregels draaien, bepaalt het manifestveld `runtime`. Er zijn twee soorten.

| | `server` | `host` |
| --- | --- | --- |
| Spelregels | In Rust, in de engine | In het browsertabblad van de spelleider |
| Spellen | Common Dice en Jeopardy | Elk eigen spel, zoals de scaffolder ze maakt |
| Tabblad van de maker | Mag dicht (Common Dice zonder spelleider) | Moet open blijven |
| `set_state` | Geweigerd, ook voor de host | Zo publiceert de host de nieuwe spelstand |
| Acties | Verwerkt en opgeslagen door de server | Doorgestuurd naar de host |
| Deduplicatie met `action_id` | Ja, begrensd | Nee |
| Accountresultaten | Ja, bij afronden van de ronde | Nee |
| Spelleidermodi | Zoals het spel aangeeft | Alleen `moderator` |

## Serverruntime

De twee ingebouwde spellen draaien hun regels in Rust. Hun browserpagina's renderen snapshots en sturen acties; ze bepalen niets. Common Dice kiest de worp op de server, Jeopardy verwerkt buzzers, antwoorden en scores op de server. Elk apparaat ziet daardoor dezelfde uitkomst.

Een geslaagde serveractie is opgeslagen voordat de nieuwe snapshot zichtbaar wordt. Lukt opslaan niet, dan blijft de oude spelstand staan.

> Alleen een veld `"runtime": "server"` in een manifest installeert geen nieuwe serverregels. De engine kent alleen de runtimes van Common Dice en Jeopardy. Een nieuw serverspel vraagt een wijziging in de engine, met tests.

## Hostruntime

Bij een eigen spel is het tabblad van de spelleider de scheidsrechter. De flow:

1. Een speler stuurt een actie, bijvoorbeeld `vote` met `{ "yes": true }`.
2. De engine stuurt die actie door naar de verbonden host, met de echte `player_id` van de afzender.
3. De host controleert de actie en publiceert de volledige nieuwe spelstand met `set_state`.
4. De engine slaat de state op en stuurt elke rol zijn projectie.

Dit vraagt een verbonden host. Is de host offline, dan geeft een speleractie `409 host_offline`. Een bevestiging (ack) van zo'n actie betekent alleen dat de actie in de wachtrij van de host staat, niet dat de host haar verwerkt heeft. Acties kunnen bij uitval verloren gaan.

De hostruntime is gemaakt voor vertrouwde spellen binnen je vriendengroep. Hoe je zo'n host schrijft, staat bij [de browserhost schrijven](../game-bouwen/browserhost.md).

## Welke kies ik?

Voor een eigen spel is de keuze gemaakt: `host`, ook voor uploads. De scaffolder genereert een werkend voorbeeld. Wil je dat de engine zelf de regels bewaakt, of dat resultaten in accountstatistieken komen, dan moet de regelverwerking als Rust-runtime in de engine komen.
