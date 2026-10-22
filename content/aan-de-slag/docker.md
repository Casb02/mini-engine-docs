---
title: Draaien met Docker
description: Start Mini Engine met Docker Compose, bewaar kamers en accounts in een volume en zet de engine achter HTTPS.
section: Snel aan de slag
order: 3
---

# Draaien met Docker

De repository bevat een `Dockerfile` en een `compose.yaml`. Daarmee draait de engine met een blijvend volume voor de database.

## Starten

```sh
docker compose up --build
```

Open daarna `http://localhost:3000/demo`. De container luistert op poort 3000.

## Wat Compose instelt

```yaml
services:
  mini-engine:
    build: .
    ports:
      - "3000:3000"
    environment:
      MINI_ENGINE_BIND: "0.0.0.0:3000"
      MINI_ENGINE_DB: "/app/data/mini-engine.sqlite"
      MINI_ENGINE_GAMES: "/app/games"
      MINI_ENGINE_WEB: "/app/web"
      MINI_ENGINE_ORIGINS: "${MINI_ENGINE_ORIGINS:-}"
      MINI_ENGINE_ADMIN_TOKEN: "${MINI_ENGINE_ADMIN_TOKEN:-}"
      MINI_ENGINE_PUBLIC_URL: "${MINI_ENGINE_PUBLIC_URL:-http://localhost:3000}"
      MINI_ENGINE_SMTP_URL: "${MINI_ENGINE_SMTP_URL:-}"
      MINI_ENGINE_MAIL_FROM: "${MINI_ENGINE_MAIL_FROM:-Mini Engine <noreply@localhost>}"
    volumes:
      - mini-engine-data:/app/data
    restart: unless-stopped

volumes:
  mini-engine-data:
```

De image bouwt de engine in een Rust-builder en kopieert de binary, `games/` en `web/` naar een slanke Debian-image. Het containerproces draait als niet-rootgebruiker (uid `10001`). Docker controleert de container elke 30 seconden met `mini-engine healthcheck`.

Zonder `MINI_ENGINE_SMTP_URL` komen bevestigingsmails met hun link alleen in de log: `docker compose logs mini-engine`.

## Gegevens bewaren

SQLite staat in het volume `mini-engine-data`. Kamers, accounts, sessies en resultaten delen dat ene bestand.

- `docker compose down` bewaart alles.
- `docker compose down -v` verwijdert het volume, en daarmee alle kamers, accounts en resultaten.
- Een back-up maak je terwijl de engine draait: `docker compose exec mini-engine mini-engine backup /app/data/backups/mini-engine.sqlite`.

Na een herstart blijven kamersleutels, opgeslagen spelstand, accountsessies en statistieken bewaard. Aanwezigheid begint offline: apparaten verbinden opnieuw en zijn dan weer online.

Bij een normale stop (SIGTERM) sluit de engine de websockets met de reden `server_shutdown`. De SDK verbindt daarna vanzelf opnieuw.

## Hosting

Gebruik voor hosting buiten je eigen netwerk HTTPS en WSS achter een reverse proxy. Stuur tokens buiten lokale ontwikkeling alleen over HTTPS. Staat de demopagina op een ander adres dan de engine ziet, voeg dat adres toe aan `MINI_ENGINE_ORIGINS`. Zet achter een proxy ook `MINI_ENGINE_TRUST_PROXY`, anders delen alle bezoekers één limiet.

Een complete route met domein, mail en back-ups staat bij [hosten op Coolify](coolify.md).

## Huidige grenzen

- Eén proces beheert één SQLite-bestand.
- Een engine beheert maximaal 500 kamers en 1024 gelijktijdige websocketverbindingen.
- Gamepackages worden bij opstart geladen. Herstart na wijzigingen.

Alle limieten staan bij [limieten](../api/limieten.md).
