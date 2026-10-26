---
title: Accounts
description: Optionele accounts die voor alle spellen op Mini Engine gelden. Wat een account bewaart, wie wat schrijft, e-mailbevestiging, sessies en de grenzen van wat een account beschermt.
section: SDK
group: Concepten
order: 8
---

# Accounts

Spelen kan altijd als gast. Een account is optioneel en geldt voor alle spellen op dezelfde server. Elk nieuw account heeft een e-mailadres, dat je bevestigt via een link in je mail. Er zijn geen externe inlogdiensten en (nog) geen wachtwoordherstel.

## Wat een account bewaart

Een account heeft een gebruikersnaam, een wachtwoord, een schermnaam en een e-mailadres. Als je met een account een kamer maakt of meedoet, koppelt Mini Engine het account aan je spelersplek. Maak je de kamer zelf, dan onthoudt de kamer ook dat jij de host bent.

Daarnaast bewaart een account drie soorten gegevens:

| Wat | Waar het vandaan komt | Waar je het ziet |
| --- | --- | --- |
| **Resultaten** | Afgeronde rondes van het ingebouwde spel, Common Dice | De accountpagina, en `api.stats()` |
| **[Achievements](achievements.md)** (sinds 0.5) | Mijlpalen die je in een spel verdient | De accountpagina, en `api.achievements()` |
| **[Eigen sets](eigen-sets.md)** (sinds 0.5) | Inhoud die je zelf maakt, zoals een eigen vragenlijst voor een quiz | **Mijn sets** op `/home/sets`, en `api.listSets()` |

Heb je met een dev-key zelf spellen geüpload, dan staat op de accountpagina ook **Mijn spellen** (sinds 0.5.1). Daar zet je ze aan of uit; zie [je game publiceren](../publiceren/overzicht.md#aan-of-uit-vanaf-de-accountpagina).

## Regels voor gegevens

| Veld | Regel |
| --- | --- |
| Gebruikersnaam | Wordt getrimd en naar kleine letters omgezet; daarna 3 tot 24 ASCII-letters, cijfers of underscores. Uniek. |
| Schermnaam | Getrimd, 1 tot 24 Unicode-tekens, geen controletekens |
| Wachtwoord | Exact zoals ingevoerd, 10 tot 128 bytes UTF-8 |
| E-mailadres | Getrimd en naar kleine letters omgezet; hoogstens 254 tekens. Een bevestigd adres hoort bij één account. |

Inloggen geeft dezelfde foutmelding voor een onbekende gebruikersnaam en een fout wachtwoord.

## E-mailbevestiging

Bij registreren krijg je een mail met een bevestigingslink naar `/home/account?verify=…`. De accountpagina vraagt je in te loggen als je dat nog niet bent, en bevestigt het adres daarna. Met de SDK doe je hetzelfde met [`api.verifyEmail()`](../sdk/api-client.md#verifyemail-token).

- **De link werkt alleen voor het account waarvoor hij is verstuurd.** Je moet daarvoor ingelogd zijn. De mail noemt dat account (`@gebruikersnaam`).
- **Een link verloopt na 48 uur** en werkt één keer. Wijzig je je adres, dan werken eerdere links niet meer.
- **Een onbevestigd adres reserveert niets.** Meerdere accounts kunnen hetzelfde adres opgeven; het account dat als eerste bevestigt, houdt het.
- **Een nieuwe link of een ander adres** vraag je aan op de accountpagina. Dat kan één keer per minuut per account.

Zonder bevestigd adres kun je gewoon inloggen en spelen. Alleen een [dev-key](../publiceren/overzicht.md) om spellen te publiceren vraagt een bevestigd adres.

## Sessies

Elke login maakt een eigen sessie met een eigen sleutel. Sessies verlopen na dertig dagen. Uitloggen trekt alleen de gebruikte sessie in, niet de kamersleutels die je al hebt.

## Wie schrijft wat?

| Gegeven | Wie schrijft het | Gecontroleerd door de server |
| --- | --- | --- |
| Gebruikersnaam, schermnaam, wachtwoord, e-mailadres | Jij, bij registreren; het e-mailadres kun je later op de accountpagina wijzigen | Ja |
| Resultaten | Alleen de server, bij het afronden van een ronde van een ingebouwd spel | Ja |
| Achievements van ingebouwde spellen (`source: "server"`) | Alleen de server, bij het afronden van een ronde | Ja |
| Achievements van eigen spellen (`source: "game"`) | De host van een eigen spel, voor spelers in zijn kamer | Nee; apart getoond |
| Eigen sets | Jij, op **Mijn sets** of met de SDK | Ja, tegen het schema van het spel |

Er is geen manier om zelf scores in te sturen, en een verzoek mag geen `account_id` claimen. Eigen spellen kunnen dus geen accountscores schrijven. Gasten en spelleiders zonder spelersplek krijgen geen resultaat en geen achievements.

Een eigen spel kan wel achievements toekennen. Dat doet de host, alleen aan spelers met een account, en alleen in een kamer die hij zelf met een account maakte. Omdat de spelcode in zijn browser draait, kan de server niet nagaan of de achievement echt verdiend is. Daarom toont de accountpagina die achievements apart, onder **Toegekend door eigen spellen**. Zie [achievements](achievements.md#eigen-spellen).

Eén account bezet hooguit één spelersplek per kamer. Probeer je met hetzelfde account opnieuw mee te doen, dan krijg je `409 already_joined`; hervat dan je bestaande sessie.

## Wat een account niet beschermt

De pagina's onder `/home` bewaren de accountsleutel in `localStorage` onder `mini-engine:account`. Spellen draaien op dezelfde origin en kunnen die sleutel lezen, net als de kamersleutels in `sessionStorage`. Met die sleutel kan een spel alles wat jij met je account kunt, zoals je achievements lezen, je eigen sets lezen, wijzigen of verwijderen, en afbeeldingen uploaden of verwijderen. Daarom kan alleen publiceren wie een dev-key heeft. Een spel hoort de accountsleutel niet aan te raken: wat het nodig heeft, staat in de snapshot.

De methoden staan bij [ApiClient: accounts](../sdk/api-client.md#accounts).
