---
title: Je eerste kamer
description: Open de demo, maak een kamer, laat telefoons meedoen en zet het gedeelde scherm op de tv.
section: Snel aan de slag
order: 2
---

# Je eerste kamer

De demo op `/demo` is de speelomgeving van Mini Engine. Elke stap heeft een eigen pagina:

| Pagina | Wat je er doet |
| --- | --- |
| `/demo` | Een kamercode invullen, of een spel kiezen om zelf te beginnen. |
| `/demo/new/<spel>` | Een kamer maken voor dat spel. |
| `/demo/join?room=CODE` | Je naam invullen en meedoen. |
| `/demo/account` | Inloggen, een account maken en je resultaten bekijken. |

## Een kamer maken

1. Open `/demo` op de computer of telefoon van de spelleider.
2. Kies onder **Start een nieuw spel** een spel, bijvoorbeeld Common Dice.
3. Vul je naam in en kies wie het spel leidt: niemand (jullie spelen samen), jij terwijl je meespeelt, of jij als spelleider. Pas eventueel de spelregels aan. Onder **Meer opties** staan het maximale aantal spelers, het gedeelde scherm en aansluiten tijdens het spel.
4. Kies **Maak kamer**. Bovenin de kamer zie je de kamercode van zes tekens; klik erop om de uitnodigingslink te kopiëren.

De spelleidersleutel blijft in het browsertabblad waarmee je de kamer maakte. Ververs je dat tabblad, dan speel je gewoon verder. Een ander apparaat kan die rol niet overnemen: er is nog geen hostoverdracht tussen apparaten.

## Meedoen met een telefoon

Op elke telefoon:

1. Open `http://<adres-van-de-engine>/demo` en vul de kamercode in, of open de uitnodigingslink (`/demo/join?room=CODE`).
2. Vul je naam in. Namen zijn 1 tot 24 tekens en uniek binnen de kamer.
3. Zet je klaar in de lobby.

Elke telefoon krijgt een eigen spelerssleutel, bewaard in de sessie van dat browsertabblad. Gasten hebben geen account nodig.

## Het gedeelde scherm

Als de kamer een gedeeld scherm toestaat, opent de spelleider het via **Kamer** → **Open het gedeelde scherm**. In dat paneel staan ook de spelers, de spelregels en de kameropties. Er gaat een nieuw tabblad open op `/room/CODE/display`, bijvoorbeeld op een laptop die aan de tv hangt. Het scherm kijkt alleen mee: het kan niet spelen en krijgt geen privégegevens.

De schermsleutel reist in het fragment van de URL (het deel na `#`). De kamerinterface bewaart dat fragment en haalt het uit de adresbalk voordat het spel laadt. Vraagt de spelleider een nieuwe schermlink op, dan werkt de vorige niet meer.

## Starten en spelen

Als alle spelers klaarstaan, start de ronde. In Common Dice zonder spelleider mag iedere deelnemer starten en gooien; met een spelleider doet de maker dat. In Jeopardy kiest eerst iedere speler een team, daarna start de quizmaster.

Na afloop sluit je de ronde af en ga je terug naar de lobby voor een nieuwe ronde. Iedereen zet zich dan opnieuw klaar.

## Met een account

Accounts zijn optioneel. Op `/demo/account` maak je een gebruikersnaam, wachtwoord en naam aan tafel. Je account wordt bij maken of meedoen aan je spelersplek gekoppeld; resultaten van afgeronde rondes van de ingebouwde spellen komen in je profiel. Zie [accounts](../concepten/accounts.md).
