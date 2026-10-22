---
title: Spelleidermodi
description: Zonder spelleider, met een meespelende eigenaar of met een aparte spelleider. Wat de drie modi betekenen en welke spellen ze ondersteunen.
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
| Eigen spellen (`runtime: "host"`) | alleen `moderator` | `moderator` |

Een eigen browserspel draait zijn spelregels in het tabblad van de spelleider. Daarom vereist het een aparte spelleider; de engine weigert een andere modus met *Browser-hostgames vereisen een aparte spelleider*.

## Zonder spelleider

In `hostless` mag iedere deelnemer met een spelersplek de ronde starten en afsluiten met de serveracties `start` en `finish`. Common Dice gooit dan gewoon door als de maker de pagina verlaat. Instellingen en kameropties blijven wel van de maker.

In deze modus moet iedereen kunnen gooien: de Common Dice-instelling `roll_permission: "owner"` is hier niet toegestaan.

## Met een meespelende eigenaar

In `playing` heeft de maker een spelersplek en een eigen naam. Is er geen naam opgegeven, dan heet de maker `Spelleider`. De maker staat in de spelerslijst, zet zich ook klaar en ontvangt naast de hostprojectie zijn eigen `private_state`. Alleen de maker start en sluit de ronde.

## Met een aparte spelleider

In `moderator` heeft de maker geen spelersplek en geen eigen klaarstatus. Bij een serverspel stuurt de spelleider wel de acties die bij de host horen, zoals `select_clue` en `judge` in Jeopardy. Common Dice kan in deze modus zelfs zonder spelers starten; Jeopardy gebruikt deze modus voor de quizmaster. Bij een eigen browserspel sturen alleen spelers acties; de host verwerkt ze.

## Accounts en modi

Een spelleider zonder spelersplek krijgt geen spelersresultaat in zijn accountstatistieken. Alleen deelnemers met een spelersplek en een gekoppeld account krijgen een resultaat. Zie [accounts](accounts.md).
