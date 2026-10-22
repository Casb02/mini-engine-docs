---
title: Accounts
description: Optionele accounts die gelden voor alle spellen op één engine, met e-mailbevestiging, sessies, statistieken en de grenzen van wat een account beschermt.
section: Concepten
order: 7
---

# Accounts

Spelen kan altijd als gast. Een account is optioneel en geldt voor alle spellen die dezelfde engine serveert. Sinds 0.4 heeft elk nieuw account een e-mailadres, dat je bevestigt via een link in je mail. Er zijn geen externe inlogdiensten en (nog) geen wachtwoordherstel.

## Wat een account bewaart

Een account heeft een gebruikersnaam, een wachtwoord, een schermnaam en een e-mailadres. Als je met een account een kamer maakt of meedoet, koppelt de engine het account aan je spelersplek. Na afloop van een ronde van een ingebouwd spel komt het resultaat in je profiel:

- **Common Dice** telt per account het aantal worpen, het aantal geworpen stenen en het opgetelde worptotaal. Het kent geen winnaars toe.
- **Jeopardy** bewaart de teamscore, of je team (gedeeld) de hoogste score had, en je eigen aantal goede en foute antwoorden. Lege teams kunnen niet winnen.

## Regels voor gegevens

| Veld | Regel |
| --- | --- |
| Gebruikersnaam | Wordt getrimd en naar kleine letters omgezet; daarna 3 tot 24 ASCII-letters, cijfers of underscores. Uniek. |
| Schermnaam | Getrimd, 1 tot 24 Unicode-tekens, geen controletekens |
| Wachtwoord | Exact zoals ingevoerd, 10 tot 128 bytes UTF-8 |
| E-mailadres | Getrimd en naar kleine letters omgezet; hoogstens 254 tekens. Een bevestigd adres hoort bij één account. |

Inloggen geeft dezelfde foutmelding voor een onbekende gebruikersnaam en een fout wachtwoord.

## E-mailbevestiging

Bij registreren stuurt de engine een mail met een bevestigingslink naar het opgegeven adres. De link wijst naar `/demo/account?verify=…` op het publieke adres van de engine. De accountpagina vraagt je in te loggen als je dat nog niet bent, en bevestigt het adres daarna.

- **De link werkt alleen voor het account waarvoor hij is verstuurd.** Je moet daarvoor ingelogd zijn. De mail noemt dat account (`@gebruikersnaam`). Registreert iemand anders met jouw adres, dan kan hij dat adres dus niet laten bevestigen doordat jij op de link klikt.
- **Een link verloopt na 48 uur** en werkt één keer. Wijzig je je adres, dan werken eerdere links niet meer.
- **Een onbevestigd adres reserveert niets.** Meerdere accounts kunnen hetzelfde adres opgeven; het account dat als eerste bevestigt, houdt het, en bij de andere vervalt het adres. Een adres dat al bij een ander account is bevestigd, kun je niet meer opgeven.
- **Een nieuwe link of een ander adres** vraag je aan op de accountpagina. Dat kan één keer per minuut per account.

Zonder bevestigd adres kun je gewoon inloggen en spelen. Alleen een [dev-key](../publiceren/overzicht.md) om games te publiceren vraagt een bevestigd adres. Komt de mail niet aan, dan kan de eigenaar van de server het adres met de hand bevestigen; zie [beheer](../publiceren/beheer.md#e-mailadres-met-de-hand-bevestigen).

Mail gaat via de SMTP-server uit `MINI_ENGINE_SMTP_URL`. Zonder die variabele schrijft de engine de mail, inclusief link, naar zijn log. Dat is handig op je eigen computer, maar niet bedoeld voor een server waar anderen spelen.

## Sessies

Elke login maakt een eigen, willekeurige sessiesleutel. Sessies verlopen na dertig dagen en overleven een herstart van de engine. Uitloggen trekt alleen de gebruikte sessie in, niet de kamersleutels die je al hebt.

Wachtwoorden worden gehasht met Argon2id. Van sessiesleutels en bevestigingslinks bewaart de engine alleen een SHA-256-hash.

## Wie schrijft resultaten?

Alleen de server. Resultaten komen uitsluitend uit afgeronde rondes van serverspellen, één keer per account per ronde, voor gekoppelde spelers die bij het afronden aanwezig zijn. Er is geen route om zelf scores in te sturen, en een body mag geen `account_id` claimen. Eigen browserspellen kunnen dus geen accountscores schrijven. Gasten en spelleiders zonder spelersplek krijgen geen resultaat.

Eén account bezet hooguit één spelersplek per kamer. Probeer je met hetzelfde account opnieuw mee te doen, dan krijg je `409 already_joined`; hervat dan je bestaande sessie.

## Wat een account niet beschermt

De demopagina bewaart de accountsleutel in `localStorage` onder `mini-engine:account`. Geïnstalleerde spellen draaien op dezelfde origin en kunnen die sleutel lezen, net als de kamersleutels in `sessionStorage`. Installeer daarom alleen spellen die je vertrouwt. Accounts isoleren geen JavaScript van spelpackages.

De routes staan bij [HTTP API: accounts](../api/accounts.md).
