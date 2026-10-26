---
title: HTTP API-overzicht
nav_title: Overzicht
description: De basis van de Mini Engine-API, met authenticatie, het foutformaat, alle foutcodes, origin-controle, een overzicht van alle routes en de versies.
section: API
order: 1
---

# HTTP API-overzicht

Mini Engine heeft een JSON-API onder `/api/v1` en een websocket per kamer. `v1` is de routeversie; deze pagina's horen bij Mini Engine 0.8. Een spel praat er meestal via de [SDK](../sdk/overzicht.md) mee, en de [CLI](../publiceren/cli.md) gebruikt de routes voor ontwikkelaars. Deze sectie beschrijft wat er over de lijn gaat, voor wie zelf een client schrijft of wil weten wat de SDK doet.

[Download de API-referentie (pdf)]({{root}}downloads/MiniEngine-API-v0.6.pdf) voor een afdrukbare versie: editie 0.6, de openbare editie, met alles wat een client, een game of de CLI gebruikt. De wijzigingen van 0.7 en 0.8 staan nog niet in de pdf, wel op deze pagina's.

## Basis

- Verzoeken en antwoorden zijn JSON. Stuur `Content-Type: application/json` mee bij een body. Alleen een [afbeelding uploaden](accounts.md#post-api-v1-accounts-media) stuurt het bestand zelf.
- Onbekende velden in een body worden afgewezen.
- Kamercodes zijn niet hoofdlettergevoelig.
- Een HTTP-body is maximaal 96 KiB. Een afbeelding mag 10 MiB zijn, een upload van een game 16 MiB.
- `/` verwijst door naar de startpagina op `/home`. Oude adressen onder `/demo` sturen door naar hetzelfde pad onder `/home`, met de query erbij.

## Authenticatie

Er zijn drie soorten sleutels, die je nooit door elkaar gebruikt:

| Sleutel | Krijg je van | Gebruik je voor |
| --- | --- | --- |
| Kamersleutel | Kamer maken (host), meedoen (speler), schermsleutel (display) | Alles binnen één kamer |
| Accountsleutel | Registreren of inloggen | `/accounts/me`, `/accounts/stats`, `/accounts/achievements`, `/accounts/sets`, `/accounts/media`, `/accounts/logout`, `/accounts/verify-email`, `/accounts/email`, en optioneel bij kamer maken en meedoen |
| Dev-key (`med_…`) | Wie de server beheert | Je eigen games uploaden en beheren onder [`/dev`](ontwikkelaars.md) |

Stuur een sleutel als header:

```http
Authorization: Bearer <token>
```

Zet sleutels nooit in een queryparameter of logregel. De server bewaart alleen hashes van sleutels: een kwijtgeraakte sleutel is niet terug te halen.

## Foutformaat

Elke fout heeft dezelfde vorm:

```json
{ "error": { "code": "version_conflict", "message": "De state is intussen gewijzigd. Gebruik de nieuwste versie." } }
```

`code` is stabiel en bedoeld voor je code; `message` is een Nederlandse uitleg voor mensen.

## Foutcodes

| Status | Code | Betekenis |
| --- | --- | --- |
| 400 | `invalid_request` | Ongeldige invoer: naam, e-mailadres, instellingen, config, actiedata, spelregel, de inhoud van een set (ook een afbeelding die niet van jou is), een realtimebericht |
| 400 | `invalid_token` | Bevestigingslink onbekend, verlopen, al gebruikt of voor een ander account |
| 400, 413, 415, 422 | `invalid_json` | Geen geldige JSON, verkeerde velden, geen `Content-Type: application/json` of een te grote body |
| 400 | `media_invalid` | Afbeelding: leeg, niet te lezen of meer dan 40 miljoen pixels (sinds 0.8) |
| 400 | `turnstile_required`, `turnstile_failed` | Robotcheck: het token in `X-Turnstile-Token` ontbreekt, of Cloudflare keurde het af; zie [robotcheck](accounts.md#robotcheck) |
| 401 | `unauthorized` | Geen, een ongeldige of een verlopen sleutel; ook een mislukte login |
| 401 | `auth_timeout` | Websocket: niet binnen vijf seconden geauthenticeerd |
| 403 | `forbidden` | Niet toegestaan voor jouw rol, of bij dit soort spel |
| 403 | `origin_forbidden` | Browserverzoek van een niet-toegestane origin |
| 403 | `game_blocked` | De beheerder blokkeerde dit spel; aanzetten of verwijderen kan niet |
| 403 | `not_eligible` | Achievement toekennen: de speler is een gast, de kamer is zonder account gemaakt, of het is je eigen account op een andere plek dan die van de meespelende maker |
| 404 | `not_found` | Onbekende route |
| 404 | `room_not_found` | De kamer bestaat niet of is verlopen |
| 404 | `game_not_found` | Het spel is niet geïnstalleerd |
| 404 | `game_page_not_found` | Het spel heeft geen pagina voor deze rol |
| 404 | `asset_not_found` | Geen publiek asset op dit pad |
| 404 | `player_not_found` | Onbekende speler |
| 404 | `set_not_found` | De set bestaat niet, of hoort bij een ander account |
| 404 | `media_not_found` | De afbeelding bestaat niet, of hoort bij een ander account (sinds 0.8) |
| 404 | `achievement_unknown` | De versie van het spel die de kamer speelt, kent dit achievement-id niet |
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
| 409 | `game_not_running` | Serverspel: start eerst het spel. Achievement toekennen: de kamer staat nog in de lobby |
| 409 | `quota_sets` | Het account heeft al 50 sets |
| 409 | `quota_set_media` | Een set gebruikt meer dan 100 afbeeldingen, of samen meer dan 50 MiB (sinds 0.8) |
| 409 | `quota_media` | De afbeeldingen van het account worden samen meer dan 250 MiB (sinds 0.8) |
| 409 | `media_in_use` | Een van je sets gebruikt deze afbeelding nog (sinds 0.8) |
| 409 | `release_changed` | Kamer maken met een eigen set: het spel kreeg net een nieuwe versie; probeer het opnieuw |
| 413 | `state_too_large` | Gepubliceerde state groter dan 64 KiB |
| 413 | `set_too_large` | De inhoud van een set is groter dan 64 KiB |
| 413 | `media_too_large` | Een upload van een afbeelding is groter dan 10 MiB (sinds 0.8) |
| 415 | `media_unsupported` | Geen PNG, JPEG, WebP of GIF, maar bijvoorbeeld een SVG of HEIC (sinds 0.8) |
| 429 | `rate_limit` | Te veel verzoeken, berichten, mails, setwijzigingen, uploads van afbeeldingen of toegekende achievements |
| 500 | `internal_error` | Opslaan mislukt; de oude state blijft staan |
| 503 | `room_limit` | De server heeft al het maximale aantal kamers |
| 503 | `connection_limit` | Te veel gelijktijdige websocketverbindingen |
| 503 | `turnstile_unavailable` | De robotcheck van Cloudflare was niet bereikbaar; probeer het zo opnieuw |

## Origin-controle

Heeft een verzoek een `Origin`-header, dan moet die overeenkomen met `http://<Host>` of `https://<Host>`, of door de server uitdrukkelijk zijn toegestaan. Anders volgt `403 origin_forbidden`. Verzoeken zonder `Origin`, zoals `curl`, gaan gewoon door.

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
| `GET /api/v1/games` | Openbaar | `{ games: [...], featured: [...] }` |
| `GET /api/v1/games/{id}` | Openbaar | Metadata van één spel |
| `GET /api/v1/games/{id}/{role}` | Openbaar | HTML voor `host`, `player` of `display` |
| `GET /games/{id}/assets/{path}` | Openbaar | Publieke gameassets |
| `GET /sdk/mini-engine.js` | Openbaar | De SDK-bundle |
| `GET /sdk/mini-engine.d.ts` | Openbaar | TypeScript-declaraties van de SDK (`text/plain`) |
| `GET /home`, `/home/games`, `/home/new/{id}`, `/home/join`, `/home/account`, `/home/sets`, `/home/sets/{id}` | Openbaar | De pagina's van Mini Engine: start, alle spellen, kamer maken, meedoen, account, mijn sets. Een onbekend spel in `/home/new/{id}` geeft 404. Zie [pagina's van Mini Engine](games.md#pagina-s-van-mini-engine). |
| `GET /demo/…` | Openbaar | Doorverwijzing naar hetzelfde pad onder `/home` |
| `POST /api/v1/rooms` | Gast of account | 201 met hostsleutel |
| `POST /api/v1/rooms/{code}/join` | Gast of account | 201 met spelerssleutel |
| `GET /api/v1/rooms/{code}/info` | Openbaar | Openbare kamerinfo |
| `GET /api/v1/rooms/{code}` | Kamersleutel | Snapshot voor jouw rol |
| `GET /api/v1/rooms/{code}/game-data` | Host | Geheime `data.json`, of de eigen set van de kamer |
| `PUT /api/v1/rooms/{code}/state` | Host, alleen hostruntime | Volledige state vervangen |
| `PUT /api/v1/rooms/{code}/settings` | Host | Instellingen vervangen |
| `PUT /api/v1/rooms/{code}/config` | Host, lobby | Kameropties wijzigen |
| `POST /api/v1/rooms/{code}/ready` | Deelnemer, lobby | Klaarzetten |
| `POST /api/v1/rooms/{code}/actions` | Speler, of host bij serverspel; bij een hostspel nooit de host | Actie sturen |
| `POST /api/v1/rooms/{code}/lifecycle` | Host | Levensloop wijzigen |
| `POST /api/v1/rooms/{code}/display-token` | Host, scherm aan | Nieuwe schermsleutel |
| `POST /api/v1/rooms/{code}/leave` | Speler | 204, sleutel ingetrokken |
| `POST /api/v1/rooms/{code}/achievements` | Host, alleen hostruntime | Achievement toekennen |
| `DELETE /api/v1/rooms/{code}/players/{player_id}` | Host | 204, speler verwijderd |
| `DELETE /api/v1/rooms/{code}` | Host | 204, kamer verwijderd |
| `GET /api/v1/rooms/{code}/ws` | Kamersleutel in eerste bericht | Websocket |
| `POST /api/v1/accounts/register` | Openbaar | 201 met account en sleutel; stuurt een bevestigingsmail |
| `POST /api/v1/accounts/login` | Openbaar | 200 met account en sleutel |
| `GET /api/v1/accounts/me` | Account | Accountobject |
| `POST /api/v1/accounts/logout` | Account | 204 |
| `GET /api/v1/accounts/stats` | Account | Statistieken |
| `GET /api/v1/accounts/achievements` | Account | Verdiende achievements |
| `GET`, `POST /api/v1/accounts/sets` | Account | Eigen sets bekijken (zonder inhoud) of er een maken |
| `GET`, `PUT`, `DELETE /api/v1/accounts/sets/{id}` | Account | Eén eigen set lezen, vervangen of verwijderen |
| `GET`, `POST /api/v1/accounts/media` | Account | Je afbeeldingen bekijken, of er een uploaden (sinds 0.8) |
| `DELETE /api/v1/accounts/media/{id}` | Account | Een afbeelding verwijderen (sinds 0.8) |
| `GET /media/{id}` | Openbaar | Een afbeelding uit een eigen set (sinds 0.8) |
| `GET /api/v1/accounts/games` | Account | Je eigen geüploade spellen (sinds 0.5.1) |
| `PUT /api/v1/accounts/games/{id}` | Account | Eigen spel aan of uit zetten (sinds 0.5.1) |
| `POST /api/v1/accounts/verify-email` | Account waarvoor de link is | E-mailadres bevestigen met het token uit de link |
| `PUT /api/v1/accounts/email` | Account | E-mailadres toevoegen of wijzigen, of de link opnieuw sturen |
| `GET /releases/{id}/{version}/{path}` | Openbaar | Assets van de actieve versie, of van een versie die een lopende kamer speelt |
| `GET /api/v1/dev/me` | Dev-key | Account en key |
| `GET /api/v1/dev/games` | Dev-key | Jouw games |
| `GET`, `PUT`, `DELETE /api/v1/dev/games/{id}` | Dev-key | Eén game bekijken, aan/uit zetten, verwijderen |
| `POST /api/v1/dev/games/{id}/versions` | Dev-key | Nieuwe versie uploaden |
| `POST /api/v1/dev/games/{id}/versions/{version}/activate` | Dev-key | Versie actief maken |
| `DELETE /api/v1/dev/games/{id}/versions/{version}` | Dev-key | Versie verwijderen |

Details per groep: [spellen](games.md), [kamers](kamers.md), [accounts](accounts.md), [ontwikkelaars](ontwikkelaars.md), [websocket](websocket.md) en [limieten](limieten.md).

## Versies

Deze documentatie hoort bij deze versies:

| Onderdeel | Versie |
| --- | --- |
| Mini Engine | 0.7 (`GET /api/health` geeft de versie van de server) |
| Mini Engine SDK | 0.6.0. De server serveert op `/sdk/mini-engine.js` de client van 0.5.2; die is gelijk aan die van 0.6.0 |
| me-CLI | 0.7.0 |
| API-referentie (pdf) | Editie 0.6, de openbare editie |

Wat je met een bestaand spel doet bij een nieuwe versie, staat bij [upgraden](../upgraden.md).

Nieuw in 0.7:

- Jeopardy is niet meer ingebouwd; Common Dice is het enige ingebouwde spel. De acties en foutcodes van Jeopardy (`buzzer_closed`, `teams_required`, `teams_locked`, `invalid_game_action`) bestaan niet meer, en het id `jeopardy` is vrij voor een geüpload spel. Bestaande sets voor Jeopardy kun je op **Mijn sets** nog bekijken en verwijderen.
- `GET /api/v1/games` geeft naast `games` ook `featured`: hoogstens vier uitgelichte spellen. De start toont ze eerst, `/home/games` bovenaan. Zie [GET /api/v1/games](games.md#get-api-v1-games).
- `/home/games` heeft een zoekveld voor titel, beschrijving, maker en id, met de zoekopdracht in `?q=`.
- De limiet van 10 games per account is een standaard; wie de server beheert, kan een account er meer geven. De foutcode blijft `409 quota_games`.

Nieuw in 0.6:

- De web-app toont spellen als kaarten: het icoon groot op de eigen kleur van het spel, de eerste zin van de beschrijving, en het aantal spelers, tv, eigen sets en achievements. De kaart neemt de kleur van de rand van de icoontegel over; houd die rand dus effen. Zie [op de spelkaart](../game-bouwen/package-en-manifest.md#op-de-spelkaart).
- De pagina met alle spellen heet `/home/games` (tot 0.6.1 `/home/spellen`). Na het bewaren van een set opent `/home/sets/{id}?saved` (was `?opgeslagen`).
- Sinds 0.6.1 heeft een geüpload spel `author`, de weergavenaam van wie het uploadde. Een pagina onder `/home` heeft linkvoorbeelden, en `/og/games/{id}.png` is een deelafbeelding van je spel. Zie [linkvoorbeelden](../publiceren/overzicht.md#linkvoorbeelden).
- Sinds 0.6.1 houdt de kamerpagina het scherm aan; een spel hoeft dat niet meer zelf te doen. Sinds 0.6.3 toont `?wake` achter de kamerlink hoe dat gaat.
- Sinds 0.6.4 gaat een gedeelde link naar de hostpagina of een spelerspagina, in een tabblad zonder die plek, naar de andere rol van dat tabblad, of anders naar de pagina om mee te doen.
- Sinds 0.6.5 is het iframe precies het zichtbare deel van het venster, en neemt de kamerpagina de `theme-color` van je spel over. Zie [op een telefoon](../game-bouwen/rolpaginas.md#op-een-telefoon).

Nieuw in 0.5.3 tot en met 0.5.5:

- Eigen sets met platte velden krijgen een formulier in plaats van een JSON-editor. Zie [eigen sets](../concepten/eigen-sets.md#het-formulier-voor-je-eigen-soort-set).
- Sinds 0.5.5 toont het formulier voor een nieuwe kamer de instellingen in de volgorde van `required` in het `settings_schema`, daarna de rest.

Nieuw in 0.5.1 en 0.5.2:

- Een eigen spel kan de maker laten meespelen: `playing` in `host_modes` bij `runtime: "host"`. Dat is het gewone geval; `me game new` zet sinds 0.5.2 `["playing", "tv"]` met `playing` als standaard. Met `tv` is de maker een tv zonder spelersplek. De plek van de maker staat altijd klaar, verdient achievements zoals elke speler, en het snapshotveld `host_player_id` wijst de maker aan. Een manifest zonder `host_modes` blijft `["moderator"]`. Zie [spelleidermodi](../concepten/spelleidermodi.md#meespelen-in-een-eigen-spel).
- Een spel kan een eigen icoon meenemen met het manifestveld `icon`; `GET /api/v1/games` geeft het mee. Zie [package en manifest](../game-bouwen/package-en-manifest.md#icon).
- Je zet je eigen spellen aan of uit op de accountpagina, met `GET /api/v1/accounts/games` en `PUT /api/v1/accounts/games/{id}`. Zie [Mijn spellen](accounts.md#mijn-spellen).
- De startpagina toont bij meer dan vier spellen een keuze, met een link naar de pagina met alle spellen.
- Een QR-code om mee te doen: het gedeelde scherm toont hem naast de code, en spelleider en spelers hebben een knop *Toon QR*. Een klik op de kamercode kopieert de uitnodigingslink. De uitnodiging noemt alleen het adres van de server, zoals *Doe mee op miniengine.nl met code HWKRTZ*. MiniEngineUI in SDK 0.5.1 doet hetzelfde voor eigen spellen; zie [bouwen met AI](../ai/bouwen-met-ai.md#miniengineui).
- Eigen spellen tonen de instellingen als tekst: de maker kiest ze in het formulier voor een nieuwe kamer. Zie [instellingen liggen vast](../game-bouwen/package-en-manifest.md#instellingen-liggen-vast-tijdens-het-spelen).

Alles uit 0.5.0 werkt nog: packages en kamers van 0.5.0 blijven ongewijzigd geldig.

Nieuw in 0.5:

- [Realtime](../concepten/realtime.md): snelle events en live waarden over de websocket, naast de spelstand.
- [Achievements](../concepten/achievements.md): het manifestveld `achievements`, toekennen door de server of de host, en `GET /api/v1/accounts/achievements`.
- [Eigen sets](../concepten/eigen-sets.md): het manifestveld `set_kinds`, `/api/v1/accounts/sets`, `set_id` bij kamer maken en het snapshotveld `set`.
- De pagina's van Mini Engine staan op `/home` in plaats van `/demo`.

Alles uit 0.4 werkt nog: nieuwe velden zijn optioneel, en kamers en manifests van vóór 0.5 blijven geldig.
