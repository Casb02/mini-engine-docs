---
title: HTTP API-overzicht
nav_title: Overzicht
description: De basis van de Mini Engine-API versie 0.4, met authenticatie, het foutformaat, alle foutcodes, origin-controle en een overzicht van alle routes.
section: HTTP API
order: 1
---

# HTTP API-overzicht

Mini Engine 0.4 heeft een JSON-API onder `/api/v1` en een websocket per kamer. `v1` is de routeversie; de engine zelf heeft versie 0.4.

[Download de API-referentie (pdf)]({{root}}downloads/MiniEngine-API-v0.4.pdf) voor een afdrukbare versie van deze pagina's. Oudere edities blijven beschikbaar: [0.3]({{root}}downloads/MiniEngine-API-v0.3.pdf) en [0.2]({{root}}downloads/MiniEngine-API-v0.2.pdf).

## Basis

- Verzoeken en antwoorden zijn JSON. Stuur `Content-Type: application/json` mee bij een body.
- Onbekende velden in een body worden afgewezen.
- Kamercodes zijn niet hoofdlettergevoelig.
- Een HTTP-body is maximaal 96 KiB.
- `/` verwijst door naar de werkbank op `/demo`.

## Authenticatie

Er zijn vier soorten sleutels, die je nooit door elkaar gebruikt:

| Sleutel | Krijg je van | Gebruik je voor |
| --- | --- | --- |
| Kamersleutel | Kamer maken (host), meedoen (speler), schermsleutel (display) | Alles binnen één kamer |
| Accountsleutel | Registreren of inloggen | `/accounts/me`, `/accounts/stats`, `/accounts/logout`, `/accounts/verify-email`, `/accounts/email`, en optioneel bij kamer maken en meedoen |
| Dev-key (`med_…`) | De eigenaar van de server | Games uploaden en beheren onder [`/dev`](ontwikkelaars.md) |
| Admintoken | Jezelf, als eigenaar (`MINI_ENGINE_ADMIN_TOKEN`) | Dev-keys en games beheren onder [`/admin`](beheer.md) |

Stuur een sleutel als header:

```http
Authorization: Bearer <token>
```

Zet sleutels nooit in een queryparameter of logregel. De engine bewaart alleen hashes van sleutels.

## Foutformaat

Elke fout heeft dezelfde vorm:

```json
{ "error": { "code": "version_conflict", "message": "De state is intussen gewijzigd. Gebruik de nieuwste versie." } }
```

`code` is stabiel en bedoeld voor je code; `message` is een Nederlandse uitleg voor mensen.

## Foutcodes

| Status | Code | Betekenis |
| --- | --- | --- |
| 400 | `invalid_request` | Ongeldige invoer: naam, e-mailadres, instellingen, config, actiedata, spelregel |
| 400 | `invalid_token` | Bevestigingslink onbekend, verlopen, al gebruikt of voor een ander account |
| 400, 413, 415, 422 | `invalid_json` | Geen geldige JSON, verkeerde velden, geen `Content-Type: application/json` of een te grote body |
| 401 | `unauthorized` | Geen, een ongeldige of een verlopen sleutel; ook een mislukte login |
| 401 | `auth_timeout` | Websocket: niet binnen vijf seconden geauthenticeerd |
| 403 | `forbidden` | Niet toegestaan voor jouw rol |
| 403 | `origin_forbidden` | Browserverzoek van een niet-toegestane origin |
| 404 | `not_found` | Onbekende route |
| 404 | `room_not_found` | De kamer bestaat niet of is verlopen |
| 404 | `game_not_found` | Het spel is niet geïnstalleerd |
| 404 | `game_page_not_found` | Het spel heeft geen pagina voor deze rol |
| 404 | `asset_not_found` | Geen publiek asset op dit pad |
| 404 | `player_not_found` | Onbekende speler |
| 405 | `method_not_allowed` | Verkeerde HTTP-methode voor deze route |
| 409 | `version_conflict` | `expected_version` is verouderd; lees de snapshot opnieuw |
| 409 | `room_started` | Alleen mogelijk in de lobby, of later aansluiten is uit |
| 409 | `room_full` | De kamer zit vol |
| 409 | `name_taken` | Die naam is al bezet in deze kamer |
| 409 | `already_joined` | Dit account heeft al een plek in deze kamer |
| 409 | `players_not_ready` | Niet iedereen staat klaar |
| 409 | `invalid_transition` | Overgang buiten `lobby → running → finished → lobby` |
| 409 | `host_offline` | Eigen spel: de host is niet verbonden |
| 409 | `session_replaced` | Websocket: deze verbinding is vervangen |
| 409 | `username_taken` | Gebruikersnaam bestaat al |
| 409 | `email_taken` | Dit e-mailadres is al bevestigd door een ander account |
| 409 | `email_already_verified` | Dit adres is al bevestigd voor jouw account |
| 409 | `email_not_verified` | Beheer: een dev-key kan alleen voor een account met een bevestigd adres |
| 409 | `email_missing` | Beheer: het account heeft geen e-mailadres om te bevestigen |
| 409 | `game_not_running` | Serverspel: start eerst het spel |
| 409 | `buzzer_closed` | Jeopardy: de buzzer staat niet open voor jouw team |
| 409 | `teams_required` | Jeopardy: niet iedere speler heeft een team |
| 409 | `teams_locked` | Jeopardy: teams liggen vast |
| 409 | `invalid_game_action` | Jeopardy: actie past niet in de huidige spelfase |
| 413 | `state_too_large` | Gepubliceerde state groter dan 64 KiB |
| 429 | `rate_limit` | Te veel verzoeken, berichten of mails |
| 500 | `internal_error` | Opslaan mislukt; de oude state blijft staan |
| 503 | `room_limit` | De engine beheert al het maximale aantal kamers |
| 503 | `connection_limit` | Te veel gelijktijdige websocketverbindingen |

## Origin-controle

Heeft een verzoek een `Origin`-header, dan moet die overeenkomen met `http://<Host>` of `https://<Host>`, of in `MINI_ENGINE_ORIGINS` staan. Anders volgt `403 origin_forbidden`. Verzoeken zonder `Origin`, zoals `curl`, gaan gewoon door.

## Beveiligingsheaders

Elk antwoord bevat onder meer `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` en deze Content-Security-Policy:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; object-src 'none'
```

## Alle routes

| Methode en pad | Toegang | Resultaat |
| --- | --- | --- |
| `GET /api/health` | Openbaar | Status en engineversie |
| `GET /api/v1/games` | Openbaar | `{ games: [...] }` |
| `GET /api/v1/games/{id}` | Openbaar | Metadata van één spel |
| `GET /api/v1/games/{id}/{role}` | Openbaar | HTML voor `host`, `player` of `display` |
| `GET /games/{id}/assets/{path}` | Openbaar | Publieke gameassets |
| `GET /sdk/mini-engine.js` | Openbaar | De SDK-bundle |
| `GET /sdk/mini-engine.d.ts` | Openbaar | TypeScript-declaraties van de SDK (`text/plain`) |
| `GET /demo`, `/demo/new/{id}`, `/demo/join`, `/demo/account` | Openbaar | De demopagina's: start, kamer maken, meedoen, account. Een onbekend spel in `/demo/new/{id}` geeft 404. |
| `POST /api/v1/rooms` | Gast of account | 201 met hostsleutel |
| `POST /api/v1/rooms/{code}/join` | Gast of account | 201 met spelerssleutel |
| `GET /api/v1/rooms/{code}/info` | Openbaar | Openbare kamerinfo |
| `GET /api/v1/rooms/{code}` | Kamersleutel | Snapshot voor jouw rol |
| `GET /api/v1/rooms/{code}/game-data` | Host | Geheime `data.json` |
| `PUT /api/v1/rooms/{code}/state` | Host, alleen hostruntime | Volledige state vervangen |
| `PUT /api/v1/rooms/{code}/settings` | Host | Instellingen vervangen |
| `PUT /api/v1/rooms/{code}/config` | Host, lobby | Kameropties wijzigen |
| `POST /api/v1/rooms/{code}/ready` | Deelnemer, lobby | Klaarzetten |
| `POST /api/v1/rooms/{code}/actions` | Speler, of host bij serverspel | Actie sturen |
| `POST /api/v1/rooms/{code}/lifecycle` | Host | Levensloop wijzigen |
| `POST /api/v1/rooms/{code}/display-token` | Host, scherm aan | Nieuwe schermsleutel |
| `POST /api/v1/rooms/{code}/leave` | Speler | 204, sleutel ingetrokken |
| `DELETE /api/v1/rooms/{code}/players/{player_id}` | Host | 204, speler verwijderd |
| `DELETE /api/v1/rooms/{code}` | Host | 204, kamer verwijderd |
| `GET /api/v1/rooms/{code}/ws` | Kamersleutel in eerste bericht | Websocket |
| `POST /api/v1/accounts/register` | Openbaar | 201 met account en sleutel; stuurt een bevestigingsmail |
| `POST /api/v1/accounts/login` | Openbaar | 200 met account en sleutel |
| `GET /api/v1/accounts/me` | Account | Accountobject |
| `POST /api/v1/accounts/logout` | Account | 204 |
| `GET /api/v1/accounts/stats` | Account | Statistieken |
| `POST /api/v1/accounts/verify-email` | Account waarvoor de link is | E-mailadres bevestigen met het token uit de link |
| `PUT /api/v1/accounts/email` | Account | E-mailadres toevoegen of wijzigen, of de link opnieuw sturen |
| `GET /releases/{id}/{version}/{path}` | Openbaar | Assets van de actieve versie, of van een versie die een lopende kamer speelt |
| `GET /api/v1/dev/me` | Dev-key | Account en key |
| `GET /api/v1/dev/games` | Dev-key | Jouw games |
| `GET`, `PUT`, `DELETE /api/v1/dev/games/{id}` | Dev-key | Eén game bekijken, aan/uit zetten, verwijderen |
| `POST /api/v1/dev/games/{id}/versions` | Dev-key | Nieuwe versie uploaden |
| `POST /api/v1/dev/games/{id}/versions/{version}/activate` | Dev-key | Versie actief maken |
| `DELETE /api/v1/dev/games/{id}/versions/{version}` | Dev-key | Versie verwijderen |
| `POST`, `GET /api/v1/admin/dev-tokens` | Admintoken | Dev-key maken, keys bekijken |
| `DELETE /api/v1/admin/dev-tokens/{id}` | Admintoken | Key intrekken |
| `POST /api/v1/admin/accounts/{username}/verify-email` | Admintoken | E-mailadres van een account met de hand bevestigen |
| `GET /api/v1/admin/games` | Admintoken | Alle geüploade games |
| `PUT /api/v1/admin/games/{id}` | Admintoken | Game blokkeren of deblokkeren |

Details per groep: [spellen](games.md), [kamers](kamers.md), [accounts](accounts.md), [ontwikkelaars](ontwikkelaars.md), [beheer](beheer.md), [websocket](websocket.md) en [limieten](limieten.md).
