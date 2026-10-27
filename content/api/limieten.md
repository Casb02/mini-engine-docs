---
title: Limieten
description: Alle grenzen van Mini Engine 0.9 op één plek, van kamercodes en namen tot berichtgroottes, realtime, achievements, eigen sets, afbeeldingen, uitnodigingen, aanvraaglimieten en gamepackages.
section: API
order: 7
---

# Limieten

## Kamers

| Grens | Waarde |
| --- | --- |
| Kamercode | 6 letters uit `ABCDEFGHJKLMNPQRSTUVWXYZ`, niet hoofdlettergevoelig |
| Kamers per server | 500 |
| Spelers per kamer | 1 tot 100, binnen de grenzen van het spel; standaard het maximum van het spel, begrensd op 24 |
| Naam van een deelnemer | 1 tot 24 tekens, geen controletekens, uniek in de kamer (ongeacht hoofdletters) |
| Verlopen | Na 12 uur zonder activiteit |
| Accountplekken | Eén actieve spelersplek per account per kamer |

## State, acties en instellingen

| Grens | Waarde |
| --- | --- |
| Gepubliceerde state (`public_state`, `host_state` en `player_states` samen) | 64 KiB |
| Actiedata | 8 KiB |
| Instellingen | 8 KiB |
| Actienaam | 1 tot 64 tekens: letters, cijfers, `_`, `.`, `-` |
| `action_id` | 1 tot 64 tekens zonder controletekens |
| Deduplicatievenster | De laatste 256 action-id's, per afzender en ronde |

## Transport

| Grens | Waarde |
| --- | --- |
| HTTP-body | 96 KiB |
| Websocketbericht | 96 KiB |
| Websocket-authenticatie | Binnen 5 seconden |
| Websocketopdrachten | 240 per seconde voor de host, 60 voor andere rollen; realtime telt niet mee |
| `request_id` | 64 bytes |
| Heartbeat | Ping elke 15 seconden; sluiten na 45 seconden stilte |
| Gelijktijdige websocketverbindingen | 1024 per server |

## Realtime (vanaf 0.5)

| Grens | Waarde |
| --- | --- |
| Realtimeberichten | 60 per seconde per verbinding, pieken tot 120 |
| `data` van een event, `value` van een waarde | 2 KiB als JSON |
| Kanaalnaam en sleutel | 1 tot 64 tekens: letters, cijfers, `_`, `.`, `:`, `-` |
| Ontvangers van een event | `all`, `host`, `players`, `display` of hoogstens 16 speler-id's |
| Sleutels per afzender | 64 |
| Waarden per kamer | 256 KiB samen |
| Wachtrij per kamer | 1024 berichten; wie achterloopt, mist de oudste |
| Melding `rt.throttled` | Hoogstens eens per 5 seconden per verbinding |

Wat boven het budget of de grenzen voor waarden komt, valt weg. De verbinding blijft open. Zie [realtime](../concepten/realtime.md#grenzen).

## Achievements (vanaf 0.5)

| Grens | Waarde |
| --- | --- |
| Achievements per spel | 50 |
| `id` | 1 tot 48 tekens: kleine letters, cijfers, `_` of `-`, beginnend met een letter of cijfer |
| `title` | 1 tot 60 tekens |
| `description` | 1 tot 160 tekens |
| Toekennen door de host | 30 per kamer per minuut |
| Per account | Elke achievement één keer per spel |

## Eigen sets (vanaf 0.5)

| Grens | Waarde |
| --- | --- |
| Soorten sets per spel (`set_kinds`) | 4 |
| `id`, `title`, `description` van een soort | Als bij achievements: 48, 60 en 160 tekens |
| Schema | Hoogstens 8 niveaus diep en 256 onderdelen; `enum` hoogstens 256 teksten |
| Titel van een set | 1 tot 80 tekens |
| Inhoud van een set | 64 KiB als JSON |
| Sets per account | 50 |

## Afbeeldingen in sets (vanaf 0.8)

| Grens | Waarde |
| --- | --- |
| Formaten | PNG, JPEG, WebP en GIF (het eerste beeld), herkend aan de inhoud; andere geven `415 media_unsupported` |
| Eén upload | 10 MiB (`413 media_too_large`) en 40 miljoen pixels (`400 media_invalid`) |
| Opgeslagen afbeelding | Hoogstens 1920 pixels aan de lange kant, nooit vergroot; hoogstens 1 MiB; JPEG, of PNG bij transparantie; zonder metadata |
| Per account | De ruimte van het account, `limit_bytes` (`409 quota_media`). Sinds 0.8.1: 1 GiB voor een beheerder, 250 MiB met een dev-key die nog werkt, anders 0, tenzij wie de server beheert een eigen hoeveelheid koos (0 tot 1048576 MiB). In 0.8.0 250 MiB voor iedereen. Zie [ruimte voor afbeeldingen](accounts.md#ruimte-voor-afbeeldingen) |
| Per set | 100 verschillende afbeeldingen, samen 50 MiB (`409 quota_set_media`) |
| Ongebruikt | Een afbeelding die geen set van het account gebruikt en geen kamer in zijn kopie van een set heeft, verdwijnt na 24 uur |
| Ruimte aanvragen | Eén keer per 7 dagen per account (`429 media_request_wait`), met een bericht van hoogstens 500 tekens (sinds 0.8.1) |

Zie [afbeeldingen](accounts.md#afbeeldingen).

## Uitnodigingen voor privéspellen (vanaf 0.9)

| Grens | Waarde |
| --- | --- |
| Uitnodigingen per spel | 50 (`409 quota_invites`) |
| Namen per verzoek | 1 tot 50, na trimmen, kleine letters en ontdubbelen (`400 invalid_request`) |
| Wie | Elk account, op gebruikersnaam; niet de eigenaar zelf (`400 invalid_request`) |

Zie [uitnodigingen](ontwikkelaars.md#uitnodigingen).

## Aanvragen per IP-adres

| Route | Limiet |
| --- | --- |
| `POST /api/v1/rooms` en `POST /api/v1/rooms/{code}/join` | 60 per minuut |
| `POST /api/v1/accounts/register`, `POST /api/v1/accounts/login` en `POST /api/v1/accounts/verify-email` | 10 per minuut |
| Mails: `POST /api/v1/accounts/register` en `PUT /api/v1/accounts/email` (vanaf 0.4) | 5 per 10 minuten |
| `POST`, `PUT` en `DELETE` onder `/api/v1/dev/`, ook uitnodigingen (sinds 0.9) | 60 per minuut |
| Uploads (`POST /api/v1/dev/games/{id}/versions`) | 20 per 10 minuten |
| Sets: `POST`, `PUT` en `DELETE` onder `/api/v1/accounts/sets` (vanaf 0.5) | 30 per minuut |
| Afbeeldingen uploaden: `POST /api/v1/accounts/media` (vanaf 0.8) | 60 per minuut |
| Nieuw getekende linkafbeeldingen onder `/og/` (vanaf 0.6.1) | 30 per minuut |
| Verkeerde dev-key (401 op `/dev`) | na 10 in 10 minuten wordt dat adres 10 minuten geweigerd, ook met de goede sleutel |

Daarboven volgt `429 rate_limit`. De tellers zijn per IP-adres, en per /64-blok voor IPv6. Registreren telt zowel mee voor de accountgrens als voor de mailgrens. Daarnaast wacht een gebruikersnaam een kwartier na tien mislukte inlogpogingen, van welk adres ook; een geslaagde login zet de teller terug.

## Accounts

| Grens | Waarde |
| --- | --- |
| Gebruikersnaam | 3 tot 24 ASCII-letters, cijfers of `_`, na trimmen en kleine letters |
| Schermnaam | 1 tot 24 Unicode-tekens |
| Wachtwoord | 10 tot 128 bytes UTF-8 |
| E-mailadres | Hoogstens 254 tekens, na trimmen en kleine letters |
| Sessie | 30 dagen |
| Bevestigingslink | 48 uur geldig, één keer te gebruiken |
| Bevestigingsmails | Eén per account per minuut |
| Recente resultaten in stats | 20 |

## Gamepackages

| Grens | Waarde |
| --- | --- |
| Spel-id | 1 tot 48 kleine ASCII-letters, cijfers of `-`, gelijk aan de mapnaam |
| Eén bestand | 2 MiB |
| Hele package | 10 MiB |
| Bestanden per package | 4096 |
| Mapdiepte | 32 |
| `title` | 1 tot 200 bytes |
| `description` | maximaal 4000 bytes |
| `version` | 1 tot 100 bytes |
| `max_players` | maximaal 100 |

## Uploads (vanaf 0.3)

| Grens | Waarde |
| --- | --- |
| Uploadbody | 16 MiB (bestanden als base64) |
| `version` van een upload | 1 tot 64 tekens `0-9 A-Z a-z . + _ -`, beginnend met een letter of cijfer |
| Bestandspad | relatief, hoogstens 255 bytes en 32 niveaus |
| Games per account | Standaard 10 (`409 quota_games`); wie de server beheert, kan je er meer geven. Nieuwe versies van een bestaande game tellen niet mee |
| Bewaarde versies per game | 10 |
