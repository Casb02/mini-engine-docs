---
title: Runtimes
description: Waarom de regels van een eigen spel in het tabblad van de spelleider draaien, hoe een actie daar aankomt, en wat er anders is bij de ingebouwde spellen.
section: SDK
group: Concepten
order: 3
---

# Runtimes

Waar de spelregels draaien, bepaalt het manifestveld `runtime`. Een eigen spel gebruikt altijd `"host"`: de regels draaien in het browsertabblad van wie de kamer maakte. Ook uploads moeten `"host"` zijn.

`"server"` is er alleen voor het ingebouwde spel, Common Dice. Zijn regels draaien op de server. Een manifest kan die runtime niet toevoegen. Tot 0.7 was Jeopardy ook een ingebouwd spel.

## Hoe een eigen spel werkt

Bij een eigen spel is het tabblad van de spelleider de scheidsrechter:

1. Een speler stuurt een actie, bijvoorbeeld `vote` met `{ "yes": true }`.
2. Mini Engine stuurt die actie door naar de verbonden host, met de echte `player_id` van de afzender.
3. De host controleert de actie en publiceert de volledige nieuwe spelstand met `setState`.
4. Mini Engine slaat de state op en stuurt elke rol zijn projectie.

Speelt de maker mee (`host_mode: "playing"`), dan stuurt de hostpagina geen actie voor de eigen zetten: de hostverbinding mag geen `action` sturen. De hostpagina past die zetten zelf toe en publiceert de nieuwe spelstand met `setState`, net als bij stap 3. Zie [spelleidermodi](spelleidermodi.md#meespelen-in-een-eigen-spel).

Dit vraagt een verbonden host. Is de host offline, dan geeft een speleractie `409 host_offline`. Een bevestiging (ack) van zo'n actie betekent alleen dat de actie in de wachtrij van de host staat, niet dat de host haar verwerkt heeft. Acties kunnen bij uitval verloren gaan.

Hoe je zo'n host schrijft, staat bij [de browserhost schrijven](../game-bouwen/browserhost.md).

## Wat dat betekent

| | Eigen spel (`host`) | Ingebouwd spel (`server`) |
| --- | --- | --- |
| Spelregels | In het tabblad van de spelleider | Op de server |
| Tabblad van de maker | Moet open blijven | Mag dicht bij `hostless` |
| `setState` | Zo publiceert de host de nieuwe spelstand | Geweigerd, ook voor de host |
| Acties | Doorgestuurd naar de host | Verwerkt door de server |
| Ontdubbelen met `action_id` | Nee; de host krijgt elke actie | Ja, begrensd |
| Accountresultaten | Nee | Ja, bij afronden van de ronde |
| [Achievements](achievements.md) | De host kent ze toe; ze staan apart, als niet gecontroleerd | De server kent ze toe |
| [Eigen sets](eigen-sets.md) | De host leest de set met `gameData()` | De server gebruikt de set |
| [Realtime](realtime.md) | Ja | Ja |
| [Spelleidermodi](spelleidermodi.md) | `playing`, `tv` en `moderator`; nooit `hostless` | Zoals het spel aangeeft |

De hostruntime is gemaakt voor spellen binnen je vriendengroep. De server controleert wie een actie stuurde, maar niet of de host de regels eerlijk toepast. Daarom tellen scores uit eigen spellen niet mee in de accountstatistieken, en staan hun achievements apart op het account.
