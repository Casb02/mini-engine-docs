---
title: Accounts
nav_title: Accounts
description: De accountroutes van de HTTP API voor registreren, e-mailbevestiging, inloggen, uitloggen, het eigen account en statistieken.
section: HTTP API
order: 4
toc_depth: 3
---

# Accounts

Accounts zijn optioneel. Ze gelden voor alle spellen op één engine. Achtergrond en regels staan bij [het concept accounts](../concepten/accounts.md).

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

Extra velden, zoals een eigen `account_id`, worden geweigerd. Na het aanmaken stuurt de engine een bevestigingsmail; zie [e-mailbevestiging](#e-mailbevestiging). Het account kan meteen inloggen en spelen.

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

De bevestigingsmail bevat een link naar `MINI_ENGINE_PUBLIC_URL/demo/account?verify=<token>` en noemt het account (`@gebruikersnaam`) waarvoor hij is. De accountpagina van de demo laat je eerst inloggen en stuurt het token daarna naar de route hieronder. Een eigen app doet hetzelfde.

- Een link werkt alleen voor het ingelogde account waarvoor hij is verstuurd. Wie zich met jouw adres registreert, krijgt het dus niet bevestigd doordat jij op de link klikt.
- Een link verloopt na 48 uur, werkt één keer en vervalt zodra het adres van het account verandert.
- Linktokens zijn willekeurig (256 bits); de engine bewaart alleen een SHA-256-hash.
- Een onbevestigd adres reserveert niets. Het account dat als eerste bevestigt, houdt het adres; bij andere accounts met hetzelfde onbevestigde adres wordt `email` dan `null`.
- Zonder `MINI_ENGINE_SMTP_URL` komt de mail met de link alleen in de log van de engine.

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

Op een server met Cloudflare Turnstile (zie [hosten op Coolify](../aan-de-slag/coolify.md#robotcheck-met-cloudflare-turnstile)) vragen `register` en `PUT /api/v1/accounts/email` een token van het Turnstile-widget, in de header `X-Turnstile-Token`. Het widget gebruikt de actie `register` of `email`. Een token werkt één keer; render na elke poging een nieuw token.

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
  "totals": { "games_played": 4, "wins": 1 },
  "games": [
    {
      "game_id": "jeopardy",
      "games_played": 2,
      "wins": 1,
      "total_score": 600,
      "best_score": 500,
      "counters": { "correct_answers": 5, "wrong_answers": 1 }
    }
  ],
  "recent": [
    {
      "round_id": "…", "game_id": "jeopardy", "player_id": "…", "account_id": "…",
      "display_name": "Hessel", "score": 500, "won": true,
      "counters": { "correct_answers": 3, "wrong_answers": 0 },
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

Resultaten komen alleen uit afgeronde rondes van serverspellen. Er is geen route om zelf scores te posten.

## Sessies

- Een sessie verloopt na dertig dagen en overleeft een herstart van de engine.
- Wachtwoorden: Argon2id. Sessiesleutels en bevestigingslinks: alleen een SHA-256-hash in de database.
- Er is geen wachtwoordherstel en geen route om een account te verwijderen.
