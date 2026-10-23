---
title: Spelleidermodi
description: Iedereen doet mee, TV, een aparte spelleider of niemand. Wat de vier modi betekenen, welke spellen ze ondersteunen en welke een gezelschapsspel aanbiedt.
section: SDK
group: Concepten
order: 2
---

# Spelleidermodi

De spelleidermodus (`host_mode`) bepaalt wie de maker van de kamer is: een speler, de tv of een spelleider. Je kiest de modus bij het maken van de kamer; daarna ligt hij vast.

| Modus | Maker | Spelverloop |
| --- | --- | --- |
| `hostless` | Host met spelersplek | Alleen voor de ingebouwde spellen. Deelnemers bedienen het spel zelf; het tabblad van de maker hoeft niet verbonden te zijn. |
| `playing` | Host met spelersplek | Iedereen doet mee, de maker ook. De maker start het spel. |
| `tv` | Host zonder spelersplek, `player_id: null` | Het apparaat dat de kamer maakt, is de tv. Het toont het spel en speelt niet mee; iedereen speelt op de telefoon. Sinds 0.5.2, alleen voor eigen spellen. |
| `moderator` | Host zonder spelersplek, `player_id: null` | Een aparte spelleider bedient het spel en speelt niet mee, zoals een quizmaster. |

Op de pagina voor een nieuwe kamer kies je uit de modi die het spel aanbiedt: *Niemand* (`hostless`), *Iedereen doet mee* (`playing`), *TV* (`tv`) of *Ik, als spelleider* (`moderator`). Bij *TV* vraagt het formulier geen naam en staat het aparte gedeelde scherm uit: de tv is zelf het scherm.

## Welk spel ondersteunt wat?

Een spel geeft in zijn manifest aan welke modi het kent (`host_modes`) en welke standaard is (`default_host_mode`).

| Spel | Modi | Standaard |
| --- | --- | --- |
| Common Dice | `moderator`, `playing`, `hostless` | `hostless` |
| Jeopardy | `moderator` | `moderator` |
| Vier pionnen, Wormenwerpen | `playing`, `tv` | `playing` |
| Nieuw eigen spel uit `me init` of `me game new` (sinds 0.5.2) | `playing`, `tv` | `playing` |
| Eigen spel zonder `host_modes` in het manifest | `moderator` | `moderator` |

**Een gezelschapsspel** (bord, kaart, dobbel, tekenen) biedt `["playing", "tv"]` met `playing` als standaard. *Iedereen doet mee*: de maker is een gewone speler, met hetzelfde scherm als iedereen. *TV*: een tv toont het spel en iedereen speelt op de telefoon. Een spelleider die alleen leidt, zoals een quizmaster, is de uitzondering (`moderator`). Daarom maken `me init` en `me game new` een manifest met `"host_modes": ["playing", "tv"]` en `"default_host_mode": "playing"`.

Een eigen browserspel draait zijn spelregels in het tabblad van de maker. Dat tabblad is de scheidsrechter en moet tijdens het spelen verbonden blijven. Daarom kent een eigen spel geen `hostless`; die modus blijft voor de ingebouwde spellen. Een manifest met `hostless` bij `runtime: "host"` weigeren `me dev`, `me game upload` en de server.

Een manifest zonder `host_modes` betekent nog steeds `["moderator"]`. Spellen van vóór 0.5.1 werken dus precies zoals eerst: de maker leidt en speelt niet mee.

## Zonder spelleider

`hostless` bestaat alleen voor de ingebouwde spellen, waarvan de regels op de server draaien. Iedere deelnemer mag daar de ronde starten en afsluiten, en Common Dice gooit gewoon door als de maker de pagina verlaat. Een eigen spel heeft altijd een verbonden host nodig.

## Iedereen doet mee

In `playing` heeft de maker een spelersplek en een eigen naam. Is er geen naam opgegeven, dan heet de maker `Spelleider`. De maker staat in de spelerslijst en ontvangt naast de hostprojectie zijn eigen `private_state`. Alleen de maker start en sluit de ronde. Elke snapshot noemt de spelersplek van de maker in `host_player_id`; andere pagina's kunnen zo zeggen wie het spel start.

### Meespelen in een eigen spel

Sinds 0.5.1 kan de maker ook in een eigen browserspel meespelen, als het manifest `playing` in `host_modes` heeft. Voor een nieuw spel is dat de standaard. Het tabblad van de maker is dan tegelijk scheidsrechter en speler, en ziet eruit als de telefoon van een speler: geen console, alleen Start, Nieuw spel en wat het spel echt van de maker nodig heeft. Een paar dingen gaan anders dan bij andere spelers:

- **Klaar.** De plek van de maker staat altijd klaar: Mini Engine zet hem klaar bij het maken van de kamer en bij elke terugkeer naar de lobby, en houdt bij het starten geen rekening met die plek. De maker hoeft dus niet op een eigen klaarknop te drukken. `ready()` vanaf de hostsleutel mag nog wel en verandert alleen die vlag.
- **Zetten.** De hostverbinding kan geen `action` sturen (`403 forbidden`). De hostpagina past de zetten van de maker zelf toe, met `setState`, net als de zetten die ze van spelers ontvangt.
- **Plekken.** De plek van de maker telt mee voor `min_players` en `max_players`.
- **Blijven.** De maker kan niet verwijderd worden en kan de kamer niet verlaten.
- **Achievements.** De maker verdient op zijn eigen spelersplek achievements zoals elke speler; zie [achievements](achievements.md#eigen-spellen).

Hoe je de hostpagina daarvoor schrijft, staat bij [de browserhost schrijven](../game-bouwen/browserhost.md#als-de-maker-meespeelt).

## TV

In `tv` (sinds 0.5.2) is het apparaat dat de kamer maakt de tv: een laptop aan de tv of de browser van de tv zelf. De maker heeft geen spelersplek (`player_id` en `host_player_id` zijn `null`) en geen klaarstatus. De hostpagina is het gedeelde scherm: in de lobby de QR-code en de kamercode, tijdens het spel het bord of de tafel groot, met een knop om te starten. Iedereen speelt op de telefoon, ook wie de tv aanzette. Het tabblad van de tv blijft scheidsrechter en moet open blijven.

`tv` kan alleen bij een eigen spel (`runtime: "host"`); de ingebouwde spellen hebben geen tv-pagina. In een `tv`-kamer kan de eigenaar van de tv op de eigen telefoon achievements verdienen: de tv is een apparaat, geen speler. Zie [achievements](achievements.md#eigen-spellen).

## Met een aparte spelleider

In `moderator` heeft de maker geen spelersplek en geen eigen klaarstatus. Jeopardy gebruikt deze modus voor de quizmaster. Bij een eigen browserspel sturen alleen spelers acties; de host verwerkt ze en speelt zelf niet mee. Wat de spelleider doet, zoals een vraag kiezen of een antwoord goedkeuren, past de hostpagina zelf toe met `setState`.

## Accounts en modi

Een spelleider zonder spelersplek krijgt geen resultaten en geen achievements. Alleen deelnemers met een spelersplek en een gekoppeld account kunnen die krijgen. Zie [accounts](accounts.md) en [achievements](achievements.md).
