---
title: Beheer
description: De routes onder /api/v1/admin waarmee de eigenaar dev-keys maakt en intrekt en geüploade games blokkeert.
section: HTTP API
order: 6
toc_depth: 3
---

# Beheer

Deze routes staan onder `/api/v1/admin` en zijn alleen voor de eigenaar van de server. Ze staan aan als de engine draait met `MINI_ENGINE_ADMIN_TOKEN` (minstens 32 tekens); anders geeft elke route 404 `admin_disabled`. Stuur het token mee als `Authorization: Bearer <admintoken>`. Een verkeerd token geeft 401. Zie ook [beheer voor de eigenaar](../publiceren/beheer.md).

## Dev-keys

### POST /api/v1/admin/dev-tokens

```json
{ "username": "sander", "label": "laptop", "expires_in_days": 365 }
```

`label` (1–80 tekens, standaard `cli`) en `expires_in_days` (1–3650, of weglaten voor geen verloopdatum) zijn optioneel. Antwoord 201:

```json
{
  "id": "uuid",
  "token": "med_3f9a…",
  "username": "sander",
  "display_name": "Sander",
  "label": "laptop",
  "created_at": 1792660000,
  "expires_at": 1824196000
}
```

Het `token` staat alleen in dit antwoord; de server bewaart een SHA-256-hash. Onbekende gebruikersnaam: 404 `account_not_found`.

### GET /api/v1/admin/dev-tokens

```json
{
  "tokens": [
    {
      "id": "uuid", "username": "sander", "display_name": "Sander", "label": "laptop",
      "created_at": 1792660000, "expires_at": null, "last_used_at": 1792661234, "revoked_at": null
    }
  ]
}
```

Nieuwste eerst, zonder geheimen.

### DELETE /api/v1/admin/dev-tokens/{id}

Trekt de key in: 204. Hij werkt meteen niet meer. Al ingetrokken of onbekend: 404 `token_not_found`.

## Games

### GET /api/v1/admin/games

`{ "games": [DevGame + owner, …] }`: alle geüploade games, met `owner: { id, username, display_name }`. Zie [ontwikkelaars](ontwikkelaars.md) voor DevGame.

### PUT /api/v1/admin/games/{id}

```json
{ "enabled": false }
```

`false` blokkeert de game (`blocked: true`): de engine serveert er niets meer van, ook niet aan lopende kamers, en de ontwikkelaar kan hem niet zelf weer aanzetten. `true` heft de blokkade op en zet de game aan. Geeft de DevGame met `owner` terug.
