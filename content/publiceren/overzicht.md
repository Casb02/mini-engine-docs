---
title: Je game publiceren
description: Upload je eigen spel naar een draaiende Mini Engine met een dev-key en de me-CLI, met versies, aan en uit en terugrollen.
section: Publiceren
order: 1
---

# Je game publiceren

Vanaf Mini Engine 0.3 hoef je geen toegang tot de server te hebben om je spel te laten spelen. Met een **dev-key** upload je het naar een draaiende engine, waarna het op `/home` verschijnt. De eigenaar van de server deelt die keys uit; je krijgt er een als je bent uitgenodigd.

Zo gaat het:

1. Je maakt een gewoon account op `/home/account` van die server en bevestigt je e-mailadres via de link in de mail.
2. De eigenaar maakt een dev-key voor jouw gebruikersnaam en geeft hem aan je.
3. Je installeert de [`me`-CLI](cli.md), plakt de key met `me auth` en uploadt je spel met `me game upload`.

```sh
me auth
me game new mijn-spel
me game upload ./mijn-spel
```

Een dev-key kan alleen voor een account met een bevestigd e-mailadres. Krijg je de bevestigingsmail niet, vraag de eigenaar dan om je adres met de hand te bevestigen. De CLI praat standaard met `https://miniengine.nl`; voor een andere server gebruik je `me auth --server <adres>`.

## Wat er met je upload gebeurt

- **Elke upload is een vaste versie.** De engine controleert het pakket met dezelfde regels als games op schijf en bewaart het onder het `version` uit `manifest.json`. Een versie overschrijven kan niet; voor een wijziging upload je een nieuwe. Zie [versies en kamers](versies.md).
- **De eerste versie is meteen actief.** Latere versies worden actief met `--activate` of `me game activate`.
- **Lopende kamers houden hun versie.** Wie al aan het spelen is, merkt niets van een nieuwe versie.
- **Je game is van jou.** Niemand anders kan er versies aan toevoegen, hem uitzetten of verwijderen. Alleen de eigenaar van de server kan hem blokkeren.

## Aan of uit vanaf de accountpagina

Sinds 0.5.1 zet je je eigen spellen ook aan of uit zonder CLI. Log in op `/home/account`. Heeft je account minstens één geüpload spel, dan staat daar het onderdeel **Mijn spellen**: per spel de titel, de actieve versie, de stand (*Aan*, *Uit* of *Geblokkeerd door de beheerder*) en een knop *Zet uit* of *Zet aan*. Een geblokkeerd spel heeft geen knop.

Het werkt hetzelfde als `me game disable <id>` en `me game enable <id>` uit de [CLI](cli.md#games): een spel dat uit staat, verdwijnt van de startpagina en er kunnen geen nieuwe kamers mee worden gemaakt. Kamers die al spelen, lopen door. Je hebt er geen dev-key voor nodig, alleen je account. De routes staan bij [accounts](../api/accounts.md#mijn-spellen). Uploaden, versies en verwijderen blijven via de CLI gaan.

## Wat mag

| Regel | Grens |
| --- | --- |
| Runtime | Alleen `host`. Serverregels zitten in de engine. |
| Spelleidermodi | `moderator`, `playing` of allebei; `playing` sinds 0.5.1. Geen `hostless`. Zie [host_modes](../game-bouwen/package-en-manifest.md#host-modes) |
| Icoon | Optioneel, sinds 0.5.1: een SVG in `assets/` van hoogstens 64 KiB, zonder scripts. Zie [icon](../game-bouwen/package-en-manifest.md#icon) |
| Bestanden | Hoogstens 4096, elk ≤ 2 MiB, samen ≤ 10 MiB |
| Versienaam | 1–64 tekens `0-9 A-Z a-z . + _ -`, beginnend met een letter of cijfer |
| Games | 10 per account |
| Versies | 10 bewaard per game; ruim oude op met `me game prune` |
| Id | Niet het id van een ingebouwde game of van iemand anders |

## Vertrouwen

Een geüploade game draait op dezelfde origin als de pagina's van de engine, net als Common Dice en Jeopardy. Hij kan in de browser de kamersleutel van dat tabblad en een eventuele accountsessie lezen, en met die sessie ook de eigen sets van de speler. Daarom krijgen alleen uitgenodigde mensen een dev-key. Een aparte origin met een afgeschermde `postMessage`-brug staat in het uploadplan van de engine en is nodig voordat onbekende makers mogen publiceren.
