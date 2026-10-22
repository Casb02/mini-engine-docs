---
title: Hoe een spelavond werkt
nav_title: Hoe een avond werkt
description: Kamers, telefoons en het gedeelde tv-scherm. Wie speelt op welk apparaat, en wat de engine voor je regelt.
section: Start
order: 2
---

# Hoe een spelavond werkt

Een avond met Mini Engine draait om één kamer. De engine is het middelpunt: alle apparaten verbinden ermee, en de engine bewaart wie er aan tafel zit en hoe het spel ervoor staat.

## De kamer

Wie een spel begint, maakt een kamer. De kamer krijgt een code van zes letters, bijvoorbeeld `HWKRTZ`. Codes zijn niet hoofdlettergevoelig en bevatten geen I of O, zodat je ze makkelijk voorleest. De maker kiest bij het aanmaken het spel, het maximale aantal spelers, de spelinstellingen en een paar kameropties:

- **Spelleidermodus**: speelt de maker mee, of leidt die het spel alleen? Zie [spelleidermodi](../concepten/spelleidermodi.md).
- **Gedeeld scherm**: mag er een tv-scherm meekijken?
- **Later aansluiten**: mogen spelers nog instromen nadat het spel is gestart? Alleen als het spel dat ondersteunt.

Een kamer verloopt na twaalf uur zonder activiteit.

## Drie soorten apparaten

| Rol | Apparaat | Wat het doet |
| --- | --- | --- |
| Spelleider (`host`) | Het apparaat waarop de kamer is gemaakt | Beheert de kamer: start en sluit rondes, wijzigt instellingen, verwijdert spelers. Speelt vaak zelf mee |
| Speler (`player`) | De eigen telefoon van elke deelnemer | Zet zich klaar en speelt: gooit, buzzt, stemt |
| Gedeeld scherm (`display`) | Een laptop of tv in de kamer | Kijkt alleen mee en toont wat iedereen mag zien |

Elke rol krijgt een eigen sleutel. De engine bepaalt per rol wat een apparaat te zien krijgt: een speler ziet nooit de geheime kaarten van een ander, en het gedeelde scherm ziet geen privégegevens. Meer daarover in [kamers en rollen](../concepten/kamers-en-rollen.md).

## Wie speelt op welk apparaat?

| Modus | Maker | Andere telefoons | Optioneel tv-scherm |
| --- | --- | --- | --- |
| Zonder spelleider | Speelt mee en beheert de kamer | Kunnen klaarzetten, starten en gooien | Kijkt alleen mee |
| Meespelende eigenaar | Speelt mee en start en beheert de ronde | Spelen mee | Kijkt alleen mee |
| Aparte spelleider | Heeft geen spelersplek | Spelen mee | Kijkt alleen mee |

Common Dice ondersteunt alle drie de modi. Jeopardy gebruikt altijd een aparte spelleider: de quizmaster kiest vragen en beoordeelt antwoorden. Bij eigen spellen speelt de maker meestal mee; sommige laten ook kiezen voor een aparte spelleider.

## Het verloop van een ronde

Elke kamer volgt dezelfde vaste volgorde: `lobby → running → finished → lobby`.

1. In de **lobby** komen spelers binnen en zetten ze zich klaar.
2. Als iedereen klaarstaat, start de ronde: de kamer gaat naar **running**.
3. Aan het eind gaat de kamer naar **finished**.
4. Terug naar de **lobby** begint een nieuwe ronde: klaarzetten en spelstand beginnen opnieuw.

Lees verder bij [klaarzetten en rondes](../concepten/rondes.md).

## Wat er gebeurt als iemand wegvalt

Telefoons gaan op slot en wifi hapert. De SDK verbindt automatisch opnieuw en de engine stuurt dan de actuele spelstand. Bij de ingebouwde spellen bepaalt de server de uitkomst: Common Dice gaat gewoon door als de maker zijn tabblad sluit. Jeopardy wacht op de quizmaster voor diens beoordelingen, maar de verbinding van die browser bepaalt geen buzzerwinnaars of scores.

Eigen spellen die met de SDK-scaffolder zijn gemaakt, draaien hun spelregels in het tabblad van de spelleider. Dat tabblad moet dan open blijven. Het verschil staat uitgelegd bij [runtimes](../concepten/runtimes.md).
