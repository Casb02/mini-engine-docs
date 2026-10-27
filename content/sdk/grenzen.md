---
title: Grenzen
description: Alle grenzen die voor een spel gelden op één plek, van kamers en namen tot de grootte van de state, berichten per seconde, realtime, achievements, eigen sets, afbeeldingen en packages.
section: SDK
group: Referentie
order: 6
---

# Grenzen

Dit zijn de grenzen van Mini Engine 0.9 die je bij het bouwen van een spel tegenkomt. `me dev` houdt dezelfde grenzen aan, zodat je ze op je eigen computer al raakt.

## Kamers

| Grens | Waarde |
| --- | --- |
| Kamercode | 6 letters uit `ABCDEFGHJKLMNPQRSTUVWXYZ`, niet hoofdlettergevoelig |
| Spelers per kamer | 1 tot 100, binnen `min_players` en `max_players` van het spel; standaard het maximum van het spel, met 24 als bovengrens |
| Naam van een deelnemer | 1 tot 24 tekens, geen controletekens, uniek in de kamer (ongeacht hoofdletters) |
| Verlopen | Na 12 uur zonder activiteit |
| Accountplekken | Eén spelersplek per account per kamer |

## State, acties en instellingen

| Grens | Waarde |
| --- | --- |
| Gepubliceerde state (`public_state`, `host_state` en `player_states` samen) | 64 KiB (`state_too_large`) |
| Actiedata | 8 KiB |
| Instellingen | 8 KiB |
| Actienaam | 1 tot 64 tekens: letters, cijfers, `_`, `.`, `-` |
| `actionId` | 1 tot 64 tekens zonder controletekens |

## Verbinding

| Grens | Waarde |
| --- | --- |
| Eén bericht of HTTP-verzoek | 96 KiB |
| Aanmelden op de websocket | Binnen 5 seconden |
| Opdrachten per seconde | 240 voor de host, 60 voor spelers en het scherm; realtime telt niet mee |
| Stilte | De server pingt elke 15 seconden en sluit na 45 seconden zonder teken van leven |
| Kamers maken en meedoen | 60 per minuut per IP-adres |

Daarboven volgt `rate_limit`. Bij te veel opdrachten op de websocket sluit de server de verbinding met `rate_limit`; de SDK verbindt na minstens 1,2 seconde opnieuw.

## Realtime

| Grens | Waarde |
| --- | --- |
| Berichten | 60 per seconde per verbinding, pieken tot 120 |
| `data` van een event, `value` van een waarde | 2 KiB als JSON |
| Kanaalnaam en sleutel | 1 tot 64 tekens: letters, cijfers, `_`, `.`, `:`, `-` |
| Ontvangers van een event | `all`, `host`, `players`, `display` of hoogstens 16 speler-id's |
| Sleutels per afzender | 64 |
| Waarden per kamer | 256 KiB samen |
| Event `throttled` | Hoogstens eens per 5 seconden per verbinding |

Wat boven het budget of de grenzen voor waarden komt, valt weg. De verbinding blijft open. Zie [realtime](../concepten/realtime.md#grenzen).

## Achievements

| Grens | Waarde |
| --- | --- |
| Achievements per spel | 50 |
| `id` | 1 tot 48 tekens: kleine letters, cijfers, `_` of `-`, beginnend met een letter of cijfer |
| `title` | 1 tot 60 tekens |
| `description` | 1 tot 160 tekens |
| Toekennen door de host | 30 per kamer per minuut |
| Per account | Elke achievement één keer per spel |

## Eigen sets

| Grens | Waarde |
| --- | --- |
| Soorten sets per spel (`set_kinds`) | 4 |
| `id`, `title`, `description` van een soort | Als bij achievements: 48, 60 en 160 tekens |
| Schema | Hoogstens 8 niveaus diep en 256 onderdelen; `enum` hoogstens 256 teksten |
| Titel van een set | 1 tot 80 tekens |
| Inhoud van een set | 64 KiB als JSON (`set_too_large`) |
| Sets per account | 50 (`quota_sets`) |
| Wijzigingen | 30 per minuut per IP-adres |

## Afbeeldingen in sets

Sinds Mini Engine 0.8. Zie [afbeeldingen](../concepten/eigen-sets.md#afbeeldingen).

| Grens | Waarde |
| --- | --- |
| Formaten | PNG, JPEG, WebP en GIF (het eerste beeld); geen SVG of HEIC (`media_unsupported`) |
| Eén upload | 10 MiB (`media_too_large`) en 40 miljoen pixels (`media_invalid`) |
| Opgeslagen afbeelding | Hoogstens 1920 pixels aan de lange kant, nooit vergroot; hoogstens 1 MiB; zonder metadata |
| Per account | De ruimte van het account (`limit_bytes`, `quota_media`). Sinds 0.8.1: 1 GiB voor een beheerder, 250 MiB met een dev-key die nog werkt, anders niets, tenzij wie de server beheert iets anders koos. In 0.8.0 250 MiB voor iedereen |
| Per set | 100 verschillende afbeeldingen, samen 50 MiB (`quota_set_media`) |
| Uploads | 60 per minuut per IP-adres |
| Ongebruikt | Na 24 uur opgeruimd als geen set van het account de afbeelding gebruikt |

`me dev` controleert de 10 MiB en de formaten van de bestanden in `media/`, maar verkleint niets: hij serveert je bestand zoals het is.

## Packages

| Grens | Waarde |
| --- | --- |
| Spel-id | 1 tot 48 kleine letters, cijfers of `-` |
| Eén bestand | 2 MiB |
| Hele package | 10 MiB |
| Bestanden per package | 4096 |
| Mapdiepte en bestandspad | 32 niveaus; een pad hoogstens 255 bytes |
| `title` | 1 tot 200 bytes |
| `description` | Hoogstens 4000 bytes |
| `max_players` | Hoogstens 100 |
| Icoon | Een SVG in `assets/` van hoogstens 64 KiB |

Voor publiceren gelden nog een paar grenzen, zoals het aantal spellen per account en het aantal bewaarde versies. Die staan bij [je game publiceren](../publiceren/overzicht.md#wat-mag).

## Accounts

| Grens | Waarde |
| --- | --- |
| Gebruikersnaam | 3 tot 24 ASCII-letters, cijfers of `_`, na trimmen en kleine letters |
| Schermnaam | 1 tot 24 Unicode-tekens |
| Wachtwoord | 10 tot 128 bytes UTF-8 |
| E-mailadres | Hoogstens 254 tekens |
| Sessie | 30 dagen |
| Bevestigingslink | 48 uur geldig, één keer te gebruiken |
