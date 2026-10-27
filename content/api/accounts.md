---
title: Accounts
nav_title: Accounts
description: De accountroutes van de HTTP API voor registreren, e-mailbevestiging, inloggen, uitloggen, het eigen account, statistieken, achievements, eigen sets, afbeeldingen voor sets en je eigen spellen aan- of uitzetten.
section: API
order: 4
toc_depth: 3
---

# Accounts

Accounts zijn optioneel. Ze gelden voor alle spellen op één server. Achtergrond en regels staan bij [het concept accounts](../concepten/accounts.md).

## POST /api/v1/accounts/register

```json
{
  "username": "hessel",
  "password": "minstens-tien-bytes",
  "display_name": "Hessel",
  "email": "hessel@example.com"
}
```

**Antwoord** `201`:

```json
{
  "account": {
    "id": "uuid",
    "username": "hessel",
    "display_name": "Hessel",
    "created_at": 1792656419,
    "email": "hessel@example.com",
    "email_verified": false
  },
  "token": "ACCOUNT_SECRET"
}
```

| Veld | Regel |
| --- | --- |
| `username` | Getrimd en naar kleine letters; 3 tot 24 ASCII-letters, cijfers of `_` |
| `password` | 10 tot 128 bytes UTF-8, exact bewaard zoals ingevoerd |
| `display_name` | Getrimd; 1 tot 24 Unicode-tekens zonder controletekens |
| `email` | Verplicht. Getrimd en naar kleine letters; een geldig adres van hoogstens 254 tekens |

Extra velden, zoals een eigen `account_id`, worden geweigerd. Na het aanmaken stuurt de server een bevestigingsmail; zie [e-mailbevestiging](#e-mailbevestiging). Het account kan meteen inloggen en spelen.

**Fouten:** `400 invalid_request`, `409 username_taken`, `409 email_taken` (het adres is al bevestigd door een ander account), `429 rate_limit`, en de [robotcheck](#robotcheck)-fouten.

## POST /api/v1/accounts/login

```json
{ "username": "hessel", "password": "minstens-tien-bytes" }
```

**Antwoord** `200`: dezelfde vorm als bij registreren. Elke login maakt een nieuwe, losse sessie.

**Fouten:** `401 unauthorized` voor zowel een onbekende gebruiker als een fout wachtwoord, `429 rate_limit`.

## GET /api/v1/accounts/me

**Toegang:** accountsleutel. **Antwoord** `200`: het accountobject.

```json
{
  "id": "uuid",
  "username": "hessel",
  "display_name": "Hessel",
  "created_at": 1792656419,
  "email": "hessel@example.com",
  "email_verified": true
}
```

`email` is `null` bij een account zonder adres: een account van vóór 0.4, of een account waarvan een ander account hetzelfde adres eerder bevestigde.

## E-mailbevestiging

De bevestigingsmail bevat een link naar `/home/account?verify=<token>` op het adres van de server en noemt het account (`@gebruikersnaam`) waarvoor hij is. De accountpagina op `/home/account` laat je eerst inloggen en stuurt het token daarna naar de route hieronder. Een eigen app doet hetzelfde. Links uit oudere mails wijzen naar `/demo/account`; die sturen door naar `/home/account`, met het token erbij.

- Een link werkt alleen voor het ingelogde account waarvoor hij is verstuurd. Wie zich met jouw adres registreert, krijgt het dus niet bevestigd doordat jij op de link klikt.
- Een link verloopt na 48 uur, werkt één keer en vervalt zodra het adres van het account verandert.
- Linktokens zijn willekeurig (256 bits).
- Een onbevestigd adres reserveert niets. Het account dat als eerste bevestigt, houdt het adres; bij andere accounts met hetzelfde onbevestigde adres wordt `email` dan `null`.

### POST /api/v1/accounts/verify-email

**Toegang:** accountsleutel van het account waarvoor de link is.

```json
{ "token": "TOKEN_UIT_DE_LINK" }
```

**Antwoord** `200`: `{ "account": Account }` met `email_verified: true`.

**Fouten:** `400 invalid_token` (onbekend, verlopen, al gebruikt, voor een ander adres of voor een ander account), `401 unauthorized`, `409 email_taken` (een ander account heeft dit adres intussen bevestigd), `429 rate_limit`.

### PUT /api/v1/accounts/email

**Toegang:** accountsleutel.

```json
{ "email": "hessel@example.com" }
```

Voegt een adres toe, wijzigt het, of stuurt de link opnieuw als het adres gelijk blijft. Een nieuw adres is weer onbevestigd. Er gaat altijd een nieuwe bevestigingsmail uit.

**Antwoord** `200`:

```json
{ "account": Account, "verification_sent": true }
```

**Fouten:** `400 invalid_request` (geen geldig adres), `401 unauthorized`, de [robotcheck](#robotcheck)-fouten, `409 email_already_verified` (dit adres is al bevestigd voor dit account), `409 email_taken` (bevestigd door een ander account), `429 rate_limit`: er is in de afgelopen minuut al een bevestigingsmail voor dit account verstuurd, of dit IP-adres heeft de mailgrens bereikt (zie [limieten](limieten.md#aanvragen-per-ip-adres)).

## Robotcheck

Vraagt de server om een robotcheck, dan willen `register` en `PUT /api/v1/accounts/email` een token van het Cloudflare Turnstile-widget, omdat ze een mail laten versturen. `GET /api/v1/accounts/config` hieronder geeft de sitekey om het widget mee te tonen; is die `null`, dan is er geen robotcheck en is de header niet nodig. Stuur het token mee in de header `X-Turnstile-Token`. Het widget gebruikt de actie `register` of `email`. Een token werkt één keer; render na elke poging een nieuw token.

Met de SDK: `api.accountConfig()` geeft de sitekey, en `api.register(input, { turnstileToken })` en `api.setEmail(email, { turnstileToken })` zetten het token in de header.

### GET /api/v1/accounts/config

```json
{ "turnstile_site_key": "0x4AAAAAAAxxxxxxxxxxxxxx" }
```

De sitekey om het widget mee te tonen, of `null` als de robotcheck uitstaat.

| Fout | Wanneer |
| --- | --- |
| `400 turnstile_required` | De header ontbreekt of is leeg. |
| `400 turnstile_failed` | Cloudflare keurt het token af, het is al gebruikt, de actie of het domein klopt niet. |
| `503 turnstile_unavailable` | Cloudflare is niet bereikbaar; probeer het zo opnieuw. |

## POST /api/v1/accounts/logout

**Toegang:** accountsleutel. **Antwoord** `204`. Trekt alleen deze sessie in; kamersleutels blijven geldig.

## GET /api/v1/accounts/stats

**Toegang:** accountsleutel. **Antwoord** `200`:

```json
{
  "totals": { "games_played": 2, "wins": 0 },
  "games": [
    {
      "game_id": "common-dice",
      "games_played": 2,
      "wins": 0,
      "total_score": 112,
      "best_score": 64,
      "counters": { "rolls": 9, "dice_rolled": 38 }
    }
  ],
  "recent": [
    {
      "round_id": "…", "game_id": "common-dice", "player_id": "…", "account_id": "…",
      "display_name": "Hessel", "score": 64, "won": false,
      "counters": { "rolls": 5, "dice_rolled": 21 },
      "finished_at": 1792656419, "room_code": "HWKRTZ"
    }
  ]
}
```

- `games` bevat per spel alle opgeslagen resultaten van dit account.
- `counters` telt alleen gehele getallen per sleutel op; andere waarden tellen niet mee.
- `recent` bevat de laatste twintig resultaten, nieuwste eerst.
- Scores kunnen negatief zijn. `finished_at` is in Unix-seconden.
- `display_name` in een resultaat is de naam op het moment van spelen.

Resultaten komen alleen uit afgeronde rondes van een serverspel, en dat is sinds 0.7 alleen Common Dice. Daar is `score` het totaal van je worpen, telt `counters` je worpen (`rolls`) en geworpen stenen (`dice_rolled`), en is `won` altijd `false`. Er is geen route om zelf scores te posten.

## GET /api/v1/accounts/achievements

Sinds 0.5. **Toegang:** accountsleutel. **Antwoord** `200`, nieuwste eerst:

```json
{
  "achievements": [
    {
      "game_id": "common-dice",
      "game_title": "Common Dice",
      "id": "dubbel-zes",
      "title": "Dubbel zes",
      "description": "Gooi minstens twee zessen in één worp.",
      "source": "server",
      "awarded_at": 1792656419
    }
  ]
}
```

- `source` is `server` als een serverspel de achievement toekende, en `game` als de host van een eigen spel dat deed. Die laatste heeft de server niet gecontroleerd; zie [achievements](../concepten/achievements.md#server-of-spel).
- `title` en `description` zijn zoals ze waren bij het verdienen. `game_title` is de huidige titel van het spel, of `null` als de server het spel niet meer kent.
- `awarded_at` is in Unix-seconden. Elke achievement staat er één keer per spel.

Toekennen gaat niet via deze route, maar door de server zelf of door de host van een kamer: zie [`POST /api/v1/rooms/{code}/achievements`](kamers.md#post-api-v1-rooms-code-achievements).

**Fouten:** `401 unauthorized`.

## Sets

Sinds 0.5. Een set is eigen inhoud voor een spel, zoals een eigen vragenlijst voor een quiz; zie [eigen sets](../concepten/eigen-sets.md). Alle routes vragen een accountsleutel. Een bevestigd e-mailadres is niet nodig.

Een **set** ziet er zo uit:

```json
{
  "id": "uuid",
  "game_id": "quiz-bij-dani",
  "kind": "questions",
  "title": "Dani's filmavond",
  "data": {
    "questions": [
      { "question": "Welke film won in 1998 elf Oscars? | Titanic | Avatar | Gladiator", "image": "/media/3f9c0b6e2a7d4c1e8b5a9f0d6e2c4a71" },
      { "question": "Hoeveel poten heeft een spin? | Acht | Zes | Tien" }
    ]
  },
  "size": 1834,
  "created_at": 1792656419,
  "updated_at": 1792660019
}
```

`size` is het aantal bytes van `data` als JSON. Tijden zijn in Unix-seconden. In een lijst ontbreekt `data`.

Een set van een ander account bestaat voor jou niet: elke route geeft dan `404 set_not_found`.

### GET /api/v1/accounts/sets

Jouw sets zonder inhoud, laatst gewijzigd eerst. Filter optioneel met `?game_id=quiz-bij-dani` en `?kind=questions`.

**Antwoord** `200`: `{ "sets": [Set, …] }`, zonder `data`.

**Fouten:** `401 unauthorized`.

### POST /api/v1/accounts/sets

```json
{
  "game_id": "quiz-bij-dani",
  "kind": "questions",
  "title": "Dani's filmavond",
  "data": { "questions": [ … ] }
}
```

| Veld | Regel |
| --- | --- |
| `game_id` | Een spel dat aanstaat. Sinds 0.9 bij een [privéspel](../publiceren/overzicht.md#privespellen) alleen als je de eigenaar bent of bent uitgenodigd; anders `404 game_not_found`, zoals bij een onbekend spel |
| `kind` | Een soort set uit `set_kinds` van de **actieve** versie van dat spel |
| `title` | Getrimd; 1 tot 80 tekens zonder controletekens |
| `data` | Voldoet aan het schema van de soort, hoogstens 64 KiB als JSON. Een afbeeldingsveld is `/media/{id}` van een [afbeelding](#afbeeldingen) van jouw account (sinds 0.8) |

**Antwoord** `201`: de set, met `data`.

Past `data` niet, dan noemt de foutmelding het pad, bijvoorbeeld `questions[2].question: gebruik 5–300 tekens.` Ook een afbeelding die niet van jou is of niet meer bestaat, noemt het pad: `questions[0].image: deze afbeelding bestaat niet (meer). Kies hem opnieuw.`

**Fouten:** `400 invalid_request` (titel, onbekende soort, inhoud past niet, een afbeelding die niet van jou is), `invalid_json` (onbekende velden of geen geldige JSON; status 400 of 422), `401 unauthorized`, `404 game_not_found`, `409 quota_sets` (al 50 sets), `409 quota_set_media` (meer dan 100 afbeeldingen, of samen meer dan 50 MiB; sinds 0.8), `413 set_too_large`, `429 rate_limit`.

### GET /api/v1/accounts/sets/{id}

Eén set, met `data`.

**Fouten:** `401 unauthorized`, `404 set_not_found`.

### PUT /api/v1/accounts/sets/{id}

Vervangt titel en inhoud. Spel en soort liggen vast.

```json
{ "title": "Dani's filmavond", "data": { "questions": [ … ] } }
```

De controle is dezelfde als bij aanmaken, tegen de actieve versie van het spel. Kamers die de set al gebruiken, houden hun eigen kopie. Is het spel privé en is je uitnodiging ingetrokken, dan geeft deze route `404 game_not_found`; lezen en verwijderen blijven werken.

**Antwoord** `200`: de bijgewerkte set, met `data`.

**Fouten:** als bij aanmaken, plus `404 set_not_found`.

### DELETE /api/v1/accounts/sets/{id}

**Antwoord** `204`. Kamers die de set al gebruiken, spelen door.

**Fouten:** `401 unauthorized`, `404 set_not_found`, `429 rate_limit`.

Aanmaken, wijzigen en verwijderen samen mag 30 keer per minuut per IP-adres; zie [limieten](limieten.md#aanvragen-per-ip-adres).

## Afbeeldingen

Sinds 0.8. Afbeeldingen voor [eigen sets](../concepten/eigen-sets.md#afbeeldingen), zoals een foto bij een quizvraag. Een afbeelding hoort bij het account dat haar uploadde; een set verwijst ernaar met haar `url`. De routes onder `/api/v1/accounts/media` vragen een accountsleutel, net als de routes voor sets. Een bevestigd e-mailadres is niet nodig.

### Ruimte voor afbeeldingen

Sinds 0.8.1 hangt de ruimte voor afbeeldingen af van het account. Zolang wie de server beheert geen eigen hoeveelheid koos, geldt:

| Account | Ruimte (`limit_bytes`) |
| --- | --- |
| Beheerder | 1 GiB (1073741824 bytes) |
| Met een dev-key die nog werkt (niet ingetrokken en niet verlopen) | 250 MiB (262144000 bytes) |
| Ieder ander | Geen (0) |

Wie de server beheert, kan een account elk heel aantal MiB geven, van 0 tot 1048576, of het terugzetten naar wat de rol geeft. Wordt de ruimte kleiner dan wat een account al gebruikt, dan blijven de afbeeldingen staan en werken ze in sets; alleen nieuwe uploads geven dan `409 quota_media`. Ruimte vraag je aan met [`POST /api/v1/accounts/media/requests`](#post-api-v1-accounts-media-requests).

In 0.8.0 had elk account 250 MiB.

### Een afbeelding

Een **afbeelding** ziet er zo uit:

```json
{
  "id": "3f9c0b6e2a7d4c1e8b5a9f0d6e2c4a71",
  "url": "/media/3f9c0b6e2a7d4c1e8b5a9f0d6e2c4a71",
  "content_type": "image/jpeg",
  "width": 1920,
  "height": 1440,
  "size": 412337,
  "created_at": 1793030400
}
```

| Veld | Betekenis |
| --- | --- |
| `id` | 32 kleine hexadecimale tekens, willekeurig (128 bits) |
| `url` | `/media/{id}`: de waarde voor een afbeeldingsveld in een set, en het adres voor `<img src>` |
| `content_type` | `image/jpeg` of `image/png`; de server slaat elke upload opnieuw op |
| `width`, `height` | De afmetingen in pixels, na het verkleinen |
| `size` | Het aantal opgeslagen bytes, hoogstens 1 MiB |
| `created_at` | Unix-seconden |

### POST /api/v1/accounts/media

Uploadt één afbeelding. De body is het bestand zelf, geen JSON, van hoogstens 10 MiB. Elk `Content-Type` mag, bijvoorbeeld dat van het bestand: de server herkent het formaat aan de inhoud, niet aan de header of de bestandsnaam.

```sh
curl https://miniengine.nl/api/v1/accounts/media \
  -H "Authorization: Bearer $ACCOUNT_TOKEN" \
  -H "Content-Type: image/jpeg" \
  --data-binary @okapi.jpg
```

**Antwoord** `201`:

```json
{ "media": Afbeelding, "used_bytes": 412337, "limit_bytes": 262144000 }
```

`used_bytes` is wat je afbeeldingen samen nu innemen, deze meegeteld. `limit_bytes` is de [ruimte van je account](#ruimte-voor-afbeeldingen) in bytes, bijvoorbeeld 262144000 (250 MiB); dat kan ook 0 zijn.

De server leest PNG, JPEG, WebP en GIF; van een GIF alleen het eerste beeld. Hij zet een telefoonfoto rechtop volgens de EXIF-oriëntatie, verkleint tot hoogstens 1920 pixels aan de lange kant en slaat de afbeelding opnieuw op: met echte transparantie als PNG, anders als JPEG met kwaliteit 85. Een kleinere afbeelding wordt nooit groter. Is het resultaat groter dan 1 MiB, dan probeert hij kwaliteit 80, 70 en 60 (niet bij een PNG) en daarna telkens ongeveer 15 % kleinere afmetingen, tot het past. Metadata zoals EXIF en GPS gaat daarbij verloren.

| Fout | Wanneer |
| --- | --- |
| `400 media_invalid` | De body is leeg, het bestand is niet te lezen, of de afbeelding heeft meer dan 40 miljoen pixels |
| `401 unauthorized` | Geen of een ongeldige accountsleutel |
| `409 quota_media` | Je afbeeldingen zouden samen meer worden dan de ruimte van je account (`limit_bytes`), ook bij uploads tegelijk. Heeft je account geen ruimte, dan zegt `message` dat je die kunt aanvragen |
| `413 media_too_large` | De upload is groter dan 10 MiB |
| `415 media_unsupported` | Geen PNG, JPEG, WebP of GIF, maar bijvoorbeeld een SVG of HEIC |
| `429 rate_limit` | Meer dan 60 uploads per minuut vanaf dit IP-adres |

De melding in `message` is Nederlands en kan zo bij het veld staan, zoals *Dit soort bestand kan niet. Kies een PNG, JPEG, WebP of GIF.*

### GET /api/v1/accounts/media

Jouw afbeeldingen, nieuwste eerst.

**Antwoord** `200`:

```json
{ "media": [Afbeelding, …], "used_bytes": 412337, "limit_bytes": 262144000, "request": Aanvraag }
```

`limit_bytes` is de [ruimte van je account](#ruimte-voor-afbeeldingen). `request` is er sinds 0.8.1: je nieuwste aanvraag voor ruimte, of `null` als je er nooit een deed. Een **aanvraag** ziet er zo uit:

```json
{
  "id": 12,
  "status": "pending",
  "message": "Voor een fotoquiz met de familie.",
  "requested_at": 1793030400,
  "next_request_at": 1793635200,
  "decided_at": null,
  "granted_mb": null
}
```

| Veld | Betekenis |
| --- | --- |
| `id` | Het nummer van de aanvraag |
| `status` | `pending` (staat open), `granted` (toegekend) of `rejected` (afgewezen) |
| `message` | Wat je erbij schreef; leeg als je niets meegaf |
| `requested_at` | Unix-seconden |
| `next_request_at` | Vanaf dit moment (Unix-seconden) kun je opnieuw aanvragen: 7 dagen na `requested_at` |
| `decided_at` | Wanneer erover beslist is, of `null` |
| `granted_mb` | De toegekende ruimte in MiB, of `null` |

**Fouten:** `401 unauthorized`.

### POST /api/v1/accounts/media/requests

Sinds 0.8.1. Vraagt ruimte voor afbeeldingen aan bij wie de server beheert, of meer ruimte als je account al wat heeft. Die beslist erover: kent die de aanvraag toe, dan krijgt je account die ruimte, en `GET /api/v1/accounts/media` geeft de nieuwe `limit_bytes`. Met de SDK doe je dat sinds 0.7.1 met [`api.requestMediaSpace()`](../sdk/api-client.md#requestmediaspace-options); met SDK 0.7.0 gebruik je de route zelf.

```sh
curl https://miniengine.nl/api/v1/accounts/media/requests \
  -H "Authorization: Bearer $ACCOUNT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "message": "Voor een fotoquiz met de familie." }'
```

| Veld | Regel |
| --- | --- |
| `message` | Optioneel: waarvoor je de afbeeldingen wilt gebruiken, hoogstens 500 tekens. Spaties aan het begin en eind vallen weg |

**Antwoord** `201`: `{ "request": Aanvraag }`, met `status` `pending`.

Je kunt één keer per 7 dagen aanvragen, gerekend vanaf je vorige aanvraag, ook als die is toegekend of afgewezen. Een nieuwe aanvraag vervangt een aanvraag die nog openstaat.

**Fouten:** `400 invalid_request` (een bericht van meer dan 500 tekens), `invalid_json` (onbekende velden of geen geldige JSON; status 400 of 422), `401 unauthorized`, `429 media_request_wait` (je vroeg de afgelopen 7 dagen al; `message` zegt over hoeveel dagen het weer kan).

### DELETE /api/v1/accounts/media/{id}

Verwijdert een afbeelding meteen. Haal haar eerst uit al je sets. Deze route kijkt alleen naar je bewaarde sets: een kamer die nog speelt met een kopie van een set met deze afbeelding, kan haar daarna niet meer laden.

**Antwoord** `204`.

**Fouten:** `401 unauthorized`, `404 media_not_found` (onbekend, of van een ander account), `409 media_in_use` (een van je sets gebruikt haar nog).

### GET /media/{id}

**Toegang:** openbaar. De afbeelding zelf, met het opgeslagen `Content-Type`. Er is geen inlog nodig: het id is niet te raden, en gasten in een kamer en het gedeelde scherm moeten de afbeelding kunnen laden. Een spel toont haar met `<img src="/media/{id}">`.

Het antwoord heeft `Cache-Control: public, max-age=31536000, immutable`, `X-Content-Type-Options: nosniff` en `Content-Security-Policy: default-src 'none'; sandbox`. Een afbeelding verandert nooit; een nieuwe upload krijgt een nieuw id.

**Fouten:** `404 media_not_found` voor een onbekende of ongeldige id.

### Ongebruikte afbeeldingen

Een afbeelding die geen van je sets gebruikt en die ouder is dan 24 uur, verwijdert de server bij je volgende upload of de volgende keer dat je een set opslaat. Een afbeelding in de kopie van een set in een kamer blijft staan. Bewaar een upload dus binnen een dag in een set.

## Mijn spellen

Sinds 0.5.1. Wie met een [dev-key](ontwikkelaars.md) spellen uploadde, zet ze ook vanaf de website aan of uit, zonder dev-key. Beide routes vragen een accountsleutel (`Authorization: Bearer <sessiesleutel>`), net als `GET /api/v1/accounts/me`. De accountpagina op `/home/account` gebruikt ze voor het onderdeel **Mijn spellen**; zie [je game publiceren](../publiceren/overzicht.md#aan-of-uit-vanaf-de-accountpagina).

### GET /api/v1/accounts/games

De geüploade spellen van jouw account. **Antwoord** `200`: `{ "games": [DevGame, …] }`, dezelfde objecten als bij [`GET /api/v1/dev/games`](ontwikkelaars.md#get-api-v1-dev-games), sinds 0.9 met `private` en `invites`. Een account zonder eigen spellen krijgt een lege lijst. De accountpagina toont bij een privéspel het label **Privé**.

**Fouten:** `401 unauthorized`.

### PUT /api/v1/accounts/games/{id}

```json
{ "enabled": false }
```

Zet het spel uit of aan. **Antwoord** `200`: het bijgewerkte DevGame-object. Het werkt precies als [`PUT /api/v1/dev/games/{id}`](ontwikkelaars.md#put-api-v1-dev-games-id): een spel dat uit staat, verdwijnt van de startpagina en uit `GET /api/v1/games`, en er kunnen geen nieuwe kamers mee worden gemaakt. Kamers die al spelen, lopen door.

Deze route neemt alleen `enabled`. Privé of openbaar maken en uitnodigen doe je met de dev-key, via de [CLI](../publiceren/cli.md#prive-en-uitnodigen). Een geüpload spel draait op dezelfde origin als de site en kan de accountsleutel lezen van een speler die ingelogd is (zie [vertrouwen](../publiceren/overzicht.md#vertrouwen)); zo'n spel kan met die sleutel dus geen spel van die speler openbaar maken.

**Fouten:** `invalid_json` (geen geldige body, ook bij `private`), `401 unauthorized`, `403 game_blocked` (aanzetten van een spel dat de beheerder blokkeerde), `404 game_not_found` (het spel bestaat niet of is niet van jou).

## Sessies

- Een sessie verloopt na dertig dagen en overleeft een herstart van de server.
- Sessiesleutels en bevestigingslinks zijn niet terug te lezen: de server bewaart er alleen een hash van.
- Er is geen wachtwoordherstel en geen route om een account te verwijderen.
