---
title: Je eerste kamer
description: Open de startpagina, maak een kamer, laat telefoons meedoen en zet het gedeelde scherm op de tv.
section: Snel aan de slag
order: 2
---

# Je eerste kamer

De pagina's onder `/home` zijn de speelomgeving van Mini Engine. Elke stap heeft een eigen pagina:

| Pagina | Wat je er doet |
| --- | --- |
| `/home` | Een kamercode invullen, of een spel kiezen om zelf te beginnen. |
| `/home/spellen` | Alle spellen, als het er meer dan vier zijn. |
| `/home/new/<spel>` | Een kamer maken voor dat spel. |
| `/home/join?room=CODE` | Je naam invullen en meedoen. |
| `/home/account` | Inloggen, een account maken, je resultaten en achievements bekijken, en je eigen geüploade spellen aan- of uitzetten. |
| `/home/sets` | Je eigen sets bekijken en maken, zoals een eigen Jeopardy-bord. |

Oude links naar `/demo` werken nog: ze sturen door naar hetzelfde adres onder `/home`.

## Een kamer maken

1. Open `/home` op de computer of telefoon van de spelleider.
2. Kies onder **Start een nieuw spel** een spel, bijvoorbeeld Common Dice. Zijn er meer dan vier spellen, dan zie je er drie, elke keer andere; de knop **Bekijk alle N spellen** opent de hele lijst.
3. Vul je naam in en kies wie het spel leidt: niemand (jullie spelen samen), jij terwijl je meespeelt, of jij als spelleider. Pas eventueel de spelregels aan. Ben je ingelogd en kent het spel eigen sets, zoals Jeopardy, dan kies je hier ook een eigen bord. Onder **Meer opties** staan het maximale aantal spelers, het gedeelde scherm en aansluiten tijdens het spel.
4. Kies **Maak kamer**. Bovenin de kamer zie je de kamercode van zes tekens; klik erop om de uitnodigingslink te kopiëren. Onder **Kamer** staat **Toon QR**: dat opent een grote QR-code die anderen met hun telefoon scannen. Spelers hebben dezelfde knop onder **Spelers**.

De spelleidersleutel blijft in het browsertabblad waarmee je de kamer maakte. Ververs je dat tabblad, dan speel je gewoon verder. Een ander apparaat kan die rol niet overnemen: er is nog geen hostoverdracht tussen apparaten.

## Meedoen met een telefoon

Op elke telefoon:

1. Open het adres van de engine, bijvoorbeeld `miniengine.nl`, en vul de kamercode in. Of open de uitnodigingslink (`/home/join?room=CODE`), of scan de QR-code op het gedeelde scherm of op het apparaat van iemand die al meedoet. Het adres zelf stuurt door naar `/home`.
2. Vul je naam in. Namen zijn 1 tot 24 tekens en uniek binnen de kamer.
3. Zet je klaar in de lobby.

Elke telefoon krijgt een eigen spelerssleutel, bewaard in de sessie van dat browsertabblad. Gasten hebben geen account nodig.

## Het gedeelde scherm

Als de kamer een gedeeld scherm toestaat, opent de spelleider het via **Kamer** → **Open het gedeelde scherm**. In dat paneel staan ook de spelers, de spelregels en de kameropties. Er gaat een nieuw tabblad open op `/room/CODE/display`, bijvoorbeeld op een laptop die aan de tv hangt. Het scherm kijkt alleen mee: het kan niet spelen en krijgt geen privégegevens. In de balk staat de uitnodiging *Doe mee op miniengine.nl met code …* (met het adres van jouw engine), met een kleine QR-code ernaast.

De schermsleutel reist in het fragment van de URL (het deel na `#`). De kamerinterface bewaart dat fragment en haalt het uit de adresbalk voordat het spel laadt. Vraagt de spelleider een nieuwe schermlink op, dan werkt de vorige niet meer.

## Starten en spelen

Als alle spelers klaarstaan, start de ronde. In Common Dice zonder spelleider mag iedere deelnemer starten en gooien; met een spelleider doet de maker dat. In Jeopardy kiest eerst iedere speler een team, daarna start de quizmaster.

Na afloop sluit je de ronde af en ga je terug naar de lobby voor een nieuwe ronde. Iedereen zet zich dan opnieuw klaar.

## Met een account

Accounts zijn optioneel. Op `/home/account` maak je een gebruikersnaam, wachtwoord en naam aan tafel. Je account wordt bij maken of meedoen aan je spelersplek gekoppeld; resultaten en [achievements](../concepten/achievements.md) van afgeronde rondes komen in je profiel. Onder **Mijn sets** maak je [eigen sets](../concepten/eigen-sets.md), zoals een Jeopardy-bord met je eigen vragen. Zie [accounts](../concepten/accounts.md).
