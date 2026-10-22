---
title: Accounts
description: Optionele accounts die gelden voor alle spellen op één engine, met sessies, statistieken en de grenzen van wat een account beschermt.
section: Concepten
order: 7
---

# Accounts

Spelen kan altijd als gast. Een account is optioneel en geldt voor alle spellen die dezelfde engine serveert. Er zijn geen e-mailadressen, geen externe inlogdiensten en geen wachtwoordherstel.

## Wat een account bewaart

Een account heeft een gebruikersnaam, een wachtwoord en een schermnaam. Als je met een account een kamer maakt of meedoet, koppelt de engine het account aan je spelersplek. Na afloop van een ronde van een ingebouwd spel komt het resultaat in je profiel:

- **Common Dice** telt per account het aantal worpen, het aantal geworpen stenen en het opgetelde worptotaal. Het kent geen winnaars toe.
- **Jeopardy** bewaart de teamscore, of je team (gedeeld) de hoogste score had, en je eigen aantal goede en foute antwoorden. Lege teams kunnen niet winnen.

## Regels voor gegevens

| Veld | Regel |
| --- | --- |
| Gebruikersnaam | Wordt getrimd en naar kleine letters omgezet; daarna 3 tot 24 ASCII-letters, cijfers of underscores. Uniek. |
| Schermnaam | Getrimd, 1 tot 24 Unicode-tekens, geen controletekens |
| Wachtwoord | Exact zoals ingevoerd, 10 tot 128 bytes UTF-8 |

Inloggen geeft dezelfde foutmelding voor een onbekende gebruikersnaam en een fout wachtwoord.

## Sessies

Elke login maakt een eigen, willekeurige sessiesleutel. Sessies verlopen na dertig dagen en overleven een herstart van de engine. Uitloggen trekt alleen de gebruikte sessie in, niet de kamersleutels die je al hebt.

Wachtwoorden worden gehasht met Argon2id. Van sessiesleutels bewaart de engine alleen een SHA-256-hash.

## Wie schrijft resultaten?

Alleen de server. Resultaten komen uitsluitend uit afgeronde rondes van serverspellen, één keer per account per ronde, voor gekoppelde spelers die bij het afronden aanwezig zijn. Er is geen route om zelf scores in te sturen, en een body mag geen `account_id` claimen. Eigen browserspellen kunnen dus geen accountscores schrijven. Gasten en spelleiders zonder spelersplek krijgen geen resultaat.

Eén account bezet hooguit één spelersplek per kamer. Probeer je met hetzelfde account opnieuw mee te doen, dan krijg je `409 already_joined`; hervat dan je bestaande sessie.

## Wat een account niet beschermt

De demopagina bewaart de accountsleutel in `localStorage` onder `mini-engine:account`. Geïnstalleerde spellen draaien op dezelfde origin en kunnen die sleutel lezen, net als de kamersleutels in `sessionStorage`. Installeer daarom alleen spellen die je vertrouwt. Accounts isoleren geen JavaScript van spelpackages.

De routes staan bij [HTTP API: accounts](../api/accounts.md).
