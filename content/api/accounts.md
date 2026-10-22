---
title: Accounts
nav_title: Accounts
description: De accountroutes van de HTTP API voor registreren, inloggen, uitloggen, het eigen account en statistieken.
section: HTTP API
order: 4
toc_depth: 3
---

# Accounts

Accounts zijn optioneel. Ze gelden voor alle spellen op één engine. Achtergrond en regels staan bij [het concept accounts](../concepten/accounts.md).

## POST /api/v1/accounts/register

```json
{ "username": "hessel", "password": "minstens-tien-bytes", "display_name": "Hessel" }
```

**Antwoord** `201`:

```json
{ "account": { "id": "uuid", "username": "hessel", "display_name": "Hessel", "created_at": 1792656419 }, "token": "ACCOUNT_SECRET" }
```

| Veld | Regel |
| --- | --- |
| `username` | Getrimd en naar kleine letters; 3 tot 24 ASCII-letters, cijfers of `_` |
| `password` | 10 tot 128 bytes UTF-8, exact bewaard zoals ingevoerd |
| `display_name` | Getrimd; 1 tot 24 Unicode-tekens zonder controletekens |

Extra velden, zoals een eigen `account_id`, worden geweigerd.

**Fouten:** `400 invalid_request`, `409 username_taken`, `429 rate_limit`.

## POST /api/v1/accounts/login

```json
{ "username": "hessel", "password": "minstens-tien-bytes" }
```

**Antwoord** `200`: dezelfde vorm als bij registreren. Elke login maakt een nieuwe, losse sessie.

**Fouten:** `401 unauthorized` voor zowel een onbekende gebruiker als een fout wachtwoord, `429 rate_limit`.

## GET /api/v1/accounts/me

**Toegang:** accountsleutel. **Antwoord** `200`: het accountobject.

```json
{ "id": "uuid", "username": "hessel", "display_name": "Hessel", "created_at": 1792656419 }
```

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
- Wachtwoorden: Argon2id. Sessiesleutels: alleen een SHA-256-hash in de database.
- Er is geen wachtwoordherstel en geen route om een account te verwijderen.
