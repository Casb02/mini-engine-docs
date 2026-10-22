---
title: Limieten
description: Alle grenzen van Mini Engine 0.3 op één plek, van kamercodes en namen tot berichtgroottes, aanvraaglimieten en gamepackages.
section: HTTP API
order: 8
---

# Limieten

## Kamers

| Grens | Waarde |
| --- | --- |
| Kamercode | 6 letters uit `ABCDEFGHJKLMNPQRSTUVWXYZ`, niet hoofdlettergevoelig |
| Kamers per engine | 500 |
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
| Websocketberichten | 240 per seconde voor de host, 60 voor andere rollen |
| `request_id` | 64 bytes |
| Heartbeat | Ping elke 15 seconden; sluiten na 45 seconden stilte |
| Gelijktijdige websocketverbindingen | 1024 per engine |

## Aanvragen per IP-adres

| Route | Limiet |
| --- | --- |
| `POST /api/v1/rooms` en `POST /api/v1/rooms/{code}/join` | 60 per minuut |
| `POST /api/v1/accounts/register` en `POST /api/v1/accounts/login` | 10 per minuut |
| Alle routes onder `/api/v1/admin/` | 30 per minuut |
| `POST`, `PUT` en `DELETE` onder `/api/v1/dev/` | 60 per minuut |
| Uploads (`POST /api/v1/dev/games/{id}/versions`) | 20 per 10 minuten |
| Verkeerde admin- of dev-sleutel (401 op `/admin` of `/dev`) | na 10 in 10 minuten wordt dat adres 10 minuten geweigerd, ook met de goede sleutel |

Daarboven volgt `429 rate_limit`. De tellers zijn per IP-adres; achter een reverse proxy delen alle bezoekers het adres van de proxy.

## Accounts

| Grens | Waarde |
| --- | --- |
| Gebruikersnaam | 3 tot 24 ASCII-letters, cijfers of `_`, na trimmen en kleine letters |
| Schermnaam | 1 tot 24 Unicode-tekens |
| Wachtwoord | 10 tot 128 bytes UTF-8 |
| Sessie | 30 dagen |
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
| Webmap van de engine | 2 MiB per bestand, 20 MiB totaal |

## Uploads (vanaf 0.3)

| Grens | Waarde |
| --- | --- |
| Uploadbody | 16 MiB (bestanden als base64) |
| `version` van een upload | 1 tot 64 tekens `0-9 A-Z a-z . + _ -`, beginnend met een letter of cijfer |
| Bestandspad | relatief, hoogstens 255 bytes en 32 niveaus |
| Games per account | 10 |
| Bewaarde versies per game | 10 |
| Label van een dev-key | 1 tot 80 tekens |
| Verlooptijd van een dev-key | 1 tot 3650 dagen, of geen |
| Admintoken | minstens 32 tekens |
