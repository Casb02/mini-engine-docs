---
title: De engine draaien
description: Start Mini Engine lokaal met cargo, speel met telefoons op je wifi-netwerk en stel de omgevingsvariabelen in.
section: Snel aan de slag
order: 1
---

# De engine draaien

Mini Engine is één Rust-programma. Het serveert de API, de websockets, de eigen pagina's onder `/home` en de geïnstalleerde spellen vanaf één adres. Je hebt geen aparte frontend-build nodig om te spelen.

## Wat je nodig hebt

- Toegang tot de privérepository `Casb02/mini-engine` en een checkout ervan.
- Een Rust-toolchain via `rustup`. De `rust-toolchain.toml` in de repository kiest het stabiele kanaal met `clippy` en `rustfmt`.
- Een moderne browser. Voor de 3D-dobbelstenen van Common Dice is WebGL 2 nodig; zonder WebGL toont het spel dezelfde uitkomst als tekst.

## Starten

Vanuit de root van de checkout:

```sh
cargo run
```

Open [localhost:3000/home](http://localhost:3000/home). Kies een spel, stel de kamer in en deel de code. `/` verwijst zelf door naar `/home`; oude adressen onder `/demo` sturen ook door.

Standaard luistert de engine alleen op `127.0.0.1:3000`, dus alleen deze computer kan meedoen.

## Spelen met telefoons op je wifi

Laat de engine op alle netwerkinterfaces luisteren:

```sh
MINI_ENGINE_BIND=0.0.0.0:3000 cargo run
```

Open op de telefoons `http://<LAN-IP>:3000/home`, bijvoorbeeld `http://192.168.1.20:3000/home`. Gebruik dat LAN-adres ook op de computer van de spelleider, zodat alle apparaten dezelfde origin gebruiken.

> **Waarom dezelfde origin?** De engine weigert browserverzoeken van een andere origin met `403 origin_forbidden`. Een verzoek met een `Origin`-header moet overeenkomen met het adres waarop de engine wordt bezocht, of in `MINI_ENGINE_ORIGINS` staan.

## Omgevingsvariabelen

| Variabele | Standaard | Betekenis |
| --- | --- | --- |
| `MINI_ENGINE_BIND` | `127.0.0.1:3000` | Adres en poort waarop de engine luistert |
| `MINI_ENGINE_DB` | `data/mini-engine.sqlite` | SQLite-bestand voor kamers, accounts en resultaten |
| `MINI_ENGINE_GAMES` | `games` | Map met gamepackages |
| `MINI_ENGINE_WEB` | `web` | Map met de pagina's onder `/home` en de SDK-bundle |
| `MINI_ENGINE_ORIGINS` | leeg | Extra toegestane browser-origins, kommagescheiden, met schema en poort |
| `MINI_ENGINE_ADMIN_TOKEN` | leeg | Zet [beheer](../publiceren/beheer.md) aan; minstens 32 tekens |
| `MINI_ENGINE_PUBLIC_URL` | `http://localhost:3000` | Publiek adres voor links in bevestigingsmails, zonder `/` aan het eind |
| `MINI_ENGINE_SMTP_URL` | leeg | SMTP-server voor bevestigingsmails, als URL (zie het voorbeeld hieronder). Zonder deze variabele komen de mails met de link alleen in de log. |
| `MINI_ENGINE_MAIL_FROM` | `Mini Engine <noreply@localhost>` | Afzender van de mails |
| `MINI_ENGINE_TRUST_PROXY` | leeg | Achter een reverse proxy: `x-forwarded-for`, of een headernaam zoals `cf-connecting-ip`. Alleen zetten als de engine uitsluitend via die proxy bereikbaar is. |

Paden zijn relatief aan de werkmap. Buiten Docker Compose wordt `.env` niet automatisch ingelezen; exporteer de waarden zelf. De repository bevat een `.env.example` als voorbeeld:

```sh
MINI_ENGINE_BIND=127.0.0.1:3000
MINI_ENGINE_DB=data/mini-engine.sqlite
MINI_ENGINE_GAMES=games
MINI_ENGINE_WEB=web
# MINI_ENGINE_ORIGINS=http://localhost:3000,http://192.168.1.20:3000
# MINI_ENGINE_ADMIN_TOKEN=
# MINI_ENGINE_PUBLIC_URL=https://miniengine.nl
# MINI_ENGINE_SMTP_URL=smtps://user:password@smtp.example.com:465
# MINI_ENGINE_MAIL_FROM=Mini Engine <noreply@miniengine.nl>
# MINI_ENGINE_TRUST_PROXY=x-forwarded-for
```

Lokaal hoef je geen SMTP in te stellen. Registreer je een account, dan staat de bevestigingslink in de uitvoer van de engine; open die link in dezelfde browser waarin je bent ingelogd.

## Spellen toevoegen of wijzigen

De engine laadt gamepackages bij het opstarten. Na het toevoegen of wijzigen van een spel herstart je de engine. Wijzig of verwijder packages tussen speelsessies, niet tijdens een avond: gameversies worden nog niet aan lopende kamers vastgezet.

## Controleren of alles werkt

```sh
curl http://localhost:3000/api/health
```

Het antwoord is `{"status":"ok","version":"0.5.0"}`, met de versie uit `Cargo.toml`. De spellencatalogus staat op `/api/v1/games`.

In een container doet `mini-engine healthcheck` hetzelfde: het commando slaagt als `/api/health` een 200 geeft.

## Back-ups

```sh
mini-engine backup backups/mini-engine.sqlite
```

Dit maakt een consistente kopie van de database uit `MINI_ENGINE_DB`, ook terwijl de engine draait. Het doelbestand mag nog niet bestaan. Draai je de engine met `cargo run`, gebruik dan `cargo run -- backup <bestand>`.

## Volgende stap

Maak [je eerste kamer](eerste-kamer.md), of draai de engine [in Docker](docker.md) zodat kamers en accounts een herstart overleven. Voor een publieke server met een eigen domein en bevestigingsmails, zie [hosten op Coolify](coolify.md).
