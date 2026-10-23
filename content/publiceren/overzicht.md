---
title: Je game publiceren
description: Zet je eigen spel online op Mini Engine met een dev-key en de me-CLI, met versies, aan en uit en terugrollen.
section: CLI
order: 1
---

# Je game publiceren

Met de [me-CLI](cli.md) zet je je spel online op een Mini Engine-server, zoals miniengine.nl. Daarna staat het op de startpagina en kan iedereen er een kamer mee maken. Je hebt er een **dev-key** voor nodig. Die krijg je van wie de Mini Engine-server beheert waar je naar publiceert.

Zo gaat het:

1. Je maakt een gewoon account op `/home/account` van die server en bevestigt je e-mailadres via de link in de mail.
2. Je vraagt een dev-key voor je gebruikersnaam aan wie de server beheert.
3. Je installeert de [CLI](cli.md), plakt de key met `me auth` en uploadt je spel met `me game upload`.

```sh
me auth
me game new mijn-spel
cd mijn-spel
me game upload
```

Een dev-key kan alleen voor een account met een bevestigd e-mailadres. Komt de bevestigingsmail niet aan, vraag dan om hulp bij wie de server beheert. De CLI praat standaard met `https://miniengine.nl`; voor een andere server gebruik je `me auth --server <adres>`.

## Wat er met je upload gebeurt

- **Elke upload is een vaste versie.** De server controleert het pakket en bewaart het onder het `version` uit `manifest.json`. Een versie overschrijven kan niet; voor een wijziging upload je een nieuwe. Zie [versies en kamers](versies.md).
- **De eerste versie van een nieuw spel is meteen actief.** Het staat dan voor iedereen op de startpagina. Latere versies worden actief met `--activate` of `me game activate`.
- **Lopende kamers houden hun versie.** Wie al aan het spelen is, merkt niets van een nieuwe versie.
- **Je game is van jou.** Niemand anders kan er versies aan toevoegen, hem uitzetten of verwijderen. Wie de server beheert, kan hem wel blokkeren.

Na een upload van een actieve versie toont de CLI het adres om een kamer te maken: `<server>/home/new/<id>`.

## Aan of uit vanaf de accountpagina

Sinds 0.5.1 zet je je eigen spellen ook aan of uit zonder CLI. Log in op `/home/account`. Heeft je account minstens één geüpload spel, dan staat daar het onderdeel **Mijn spellen**: per spel de titel, de actieve versie, de stand (*Aan*, *Uit* of *Geblokkeerd door de beheerder*) en een knop *Zet uit* of *Zet aan*. Een geblokkeerd spel heeft geen knop.

Het werkt hetzelfde als `me game disable <id>` en `me game enable <id>` uit de [CLI](cli.md#games): een spel dat uit staat, verdwijnt van de startpagina en er kunnen geen nieuwe kamers mee worden gemaakt. Kamers die al spelen, lopen door. Je hebt er geen dev-key voor nodig, alleen je account. Uploaden, versies en verwijderen blijven via de CLI gaan.

## Wat mag

| Regel | Grens |
| --- | --- |
| Runtime | Alleen `host`. Zie [runtimes](../concepten/runtimes.md) |
| Spelleidermodi | `playing`, `tv` en `moderator`, in elke combinatie; `playing` sinds 0.5.1, `tv` sinds 0.5.2. Geen `hostless`. Zie [host_modes](../game-bouwen/package-en-manifest.md#host-modes) |
| Icoon | Optioneel, sinds 0.5.1: een SVG in `assets/` van hoogstens 64 KiB, zonder scripts. Zie [icon](../game-bouwen/package-en-manifest.md#icon) |
| Bestanden | Hoogstens 4096, elk ≤ 2 MiB, samen ≤ 10 MiB; paden tot 255 bytes en 32 niveaus |
| Upload | Hoogstens 16 MiB per keer, en 20 uploads per 10 minuten |
| Versienaam | 1–64 tekens `0-9 A-Z a-z . + _ -`, beginnend met een letter of cijfer |
| Games | 10 per account |
| Versies | 10 bewaard per game; ruim oude op met `me game prune` |
| Id | Niet het id van een ingebouwde game of van iemand anders |

## Vertrouwen

Een geüploade game draait op dezelfde origin als de pagina's van Mini Engine, net als Common Dice en Jeopardy. Hij kan in de browser de kamersleutel van dat tabblad en een eventuele accountsessie lezen, en met die sessie ook de eigen sets van de speler. Daarom krijgen alleen uitgenodigde mensen een dev-key. Gebruik je accountsessie of die van spelers nooit in je spel.
