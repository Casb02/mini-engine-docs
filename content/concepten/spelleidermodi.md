---
title: Spelleidermodi
description: Zonder spelleider, met een meespelende eigenaar of met een aparte spelleider. Wat de drie modi betekenen, welke spellen ze ondersteunen en hoe de maker meespeelt in een eigen spel.
section: Concepten
order: 2
---

# Spelleidermodi

De spelleidermodus (`host_mode`) bepaalt of de maker van de kamer meespeelt en wie het spel bedient. Je kiest de modus bij het maken van de kamer; daarna ligt hij vast.

| Modus | Maker | Spelverloop |
| --- | --- | --- |
| `hostless` | Host met spelersplek | Deelnemers bedienen het spel zelf. Het tabblad van de maker hoeft tijdens het spelen niet verbonden te zijn. |
| `playing` | Host met spelersplek | De maker speelt mee en houdt de beheermogelijkheden. |
| `moderator` | Host zonder spelersplek, `player_id: null` | Een aparte spelleider bedient het spel en speelt niet mee. |

Op de pagina voor een nieuwe kamer kies je wie het spel leidt: *Niemand* (`hostless`), *Ik, en ik speel mee* (`playing`) of *Ik, als spelleider* (`moderator`).

## Welk spel ondersteunt wat?

Een spel geeft in zijn manifest aan welke modi het kent (`host_modes`) en welke standaard is (`default_host_mode`).

| Spel | Modi | Standaard |
| --- | --- | --- |
| Common Dice | `moderator`, `playing`, `hostless` | `hostless` |
| Jeopardy | `moderator` | `moderator` |
| Nieuw eigen spel uit `me game new` (sinds 0.5.1) | `playing`, `moderator` | `playing` |
| Eigen spel zonder `host_modes` in het manifest | `moderator` | `moderator` |

Meespelen is het gewone geval. Bij bordspellen, kaartspellen en de meeste partyspellen speelt de maker mee zoals iedereen. Een spelleider die alleen leidt, zoals een quizmaster, is de uitzondering. Daarom maakt `me game new` sinds 0.5.1 een manifest met `"host_modes": ["playing", "moderator"]` en `"default_host_mode": "playing"`, en speelt de hostpagina van dat voorbeeld zelf mee.

Een eigen browserspel draait zijn spelregels in het tabblad van de maker. Dat tabblad is de scheidsrechter en moet tijdens het spelen verbonden blijven. Daarom kent een eigen spel geen `hostless`; die modus blijft voor de ingebouwde serverspellen. Een manifest met `hostless` bij `runtime: "host"` weigert de engine met *Invalid runtime or unsupported host modes.*

Een manifest zonder `host_modes` betekent nog steeds `["moderator"]`. Spellen van vóór 0.5.1 werken dus precies zoals eerst: de maker leidt en speelt niet mee.

## Zonder spelleider

In `hostless` mag iedere deelnemer met een spelersplek de ronde starten en afsluiten met de serveracties `start` en `finish`. Common Dice gooit dan gewoon door als de maker de pagina verlaat. Instellingen en kameropties blijven wel van de maker.

In deze modus moet iedereen kunnen gooien: de Common Dice-instelling `roll_permission: "owner"` is hier niet toegestaan.

## Met een meespelende eigenaar

In `playing` heeft de maker een spelersplek en een eigen naam. Is er geen naam opgegeven, dan heet de maker `Spelleider`. De maker staat in de spelerslijst en ontvangt naast de hostprojectie zijn eigen `private_state`. Alleen de maker start en sluit de ronde. Elke snapshot noemt de spelersplek van de maker in `host_player_id`, zodat iedere pagina de spelleider in de lijst kan aanwijzen.

### Meespelen in een eigen spel

Sinds 0.5.1 kan de maker ook in een eigen browserspel meespelen, als het manifest `playing` in `host_modes` heeft. Voor een nieuw spel is dat de standaard. Het tabblad van de maker is dan tegelijk scheidsrechter en speler. Een paar dingen gaan daarbij anders dan bij andere spelers:

- **Klaar.** De plek van de maker staat altijd klaar: de engine zet hem klaar bij het maken van de kamer en bij elke terugkeer naar de lobby, en houdt bij het starten geen rekening met die plek. De maker hoeft dus niet op een eigen klaarknop te drukken. `ready()` vanaf de hostsleutel mag nog wel en verandert alleen die vlag.
- **Zetten.** De hostverbinding kan geen `action` sturen (`403 forbidden`). De hostpagina past de zetten van de maker zelf toe, met `setState`, net als de zetten die ze van spelers ontvangt.
- **Plekken.** De plek van de maker telt mee voor `min_players` en `max_players`.
- **Blijven.** De maker kan niet verwijderd worden en kan de kamer niet verlaten.
- **Achievements.** De maker verdient op zijn eigen spelersplek achievements zoals elke speler; zie [achievements](achievements.md#eigen-spellen).

Hoe je de hostpagina daarvoor schrijft, staat bij [de browserhost schrijven](../game-bouwen/browserhost.md#als-de-maker-meespeelt).

## Met een aparte spelleider

In `moderator` heeft de maker geen spelersplek en geen eigen klaarstatus. Bij een serverspel stuurt de spelleider wel de acties die bij de host horen, zoals `select_clue` en `judge` in Jeopardy. Common Dice kan in deze modus zelfs zonder spelers starten; Jeopardy gebruikt deze modus voor de quizmaster. Bij een eigen browserspel sturen alleen spelers acties; de host verwerkt ze en speelt zelf niet mee.

## Accounts en modi

Een spelleider zonder spelersplek krijgt geen spelersresultaat in zijn accountstatistieken. Alleen deelnemers met een spelersplek en een gekoppeld account krijgen een resultaat. Zie [accounts](accounts.md).
