---
title: De engine draaien
description: Start Mini Engine lokaal met cargo, speel met telefoons op je wifi-netwerk en stel de omgevingsvariabelen in.
section: Snel aan de slag
order: 1
---

# De engine draaien

Mini Engine is één Rust-programma. Het serveert de API, de websockets, de demopagina en de geïnstalleerde spellen vanaf één adres. Je hebt geen aparte frontend-build nodig om te spelen.

## Wat je nodig hebt

- Toegang tot de privérepository `Casb02/mini-engine` en een checkout ervan.
- Een Rust-toolchain via `rustup`. De `rust-toolchain.toml` in de repository kiest het stabiele kanaal met `clippy` en `rustfmt`.
- Een moderne browser. Voor de 3D-dobbelstenen van Common Dice is WebGL 2 nodig; zonder WebGL toont het spel dezelfde uitkomst als tekst.

## Starten

Vanuit de root van de checkout:

```sh
cargo run
```

Open [localhost:3000/demo](http://localhost:3000/demo). Kies een spel, stel de kamer in en deel de code. `/` verwijst zelf door naar `/demo`.

Standaard luistert de engine alleen op `127.0.0.1:3000`, dus alleen deze computer kan meedoen.

## Spelen met telefoons op je wifi

Laat de engine op alle netwerkinterfaces luisteren:

```sh
MINI_ENGINE_BIND=0.0.0.0:3000 cargo run
```

Open op de telefoons `http://<LAN-IP>:3000/demo`, bijvoorbeeld `http://192.168.1.20:3000/demo`. Gebruik dat LAN-adres ook op de computer van de spelleider, zodat alle apparaten dezelfde origin gebruiken.

> **Waarom dezelfde origin?** De engine weigert browserverzoeken van een andere origin met `403 origin_forbidden`. Een verzoek met een `Origin`-header moet overeenkomen met het adres waarop de engine wordt bezocht, of in `MINI_ENGINE_ORIGINS` staan.

## Omgevingsvariabelen

| Variabele | Standaard | Betekenis |
| --- | --- | --- |
| `MINI_ENGINE_BIND` | `127.0.0.1:3000` | Adres en poort waarop de engine luistert |
| `MINI_ENGINE_DB` | `data/mini-engine.sqlite` | SQLite-bestand voor kamers, accounts en resultaten |
| `MINI_ENGINE_GAMES` | `games` | Map met gamepackages |
| `MINI_ENGINE_WEB` | `web` | Map met de demopagina en de SDK-bundle |
| `MINI_ENGINE_ORIGINS` | leeg | Extra toegestane browser-origins, kommagescheiden, met schema en poort |

Paden zijn relatief aan de werkmap. Buiten Docker Compose wordt `.env` niet automatisch ingelezen; exporteer de waarden zelf. De repository bevat een `.env.example` als voorbeeld:

```sh
MINI_ENGINE_BIND=127.0.0.1:3000
MINI_ENGINE_DB=data/mini-engine.sqlite
MINI_ENGINE_GAMES=games
MINI_ENGINE_WEB=web
# MINI_ENGINE_ORIGINS=http://localhost:3000,http://192.168.1.20:3000
```

## Spellen toevoegen of wijzigen

De engine laadt gamepackages bij het opstarten. Na het toevoegen of wijzigen van een spel herstart je de engine. Wijzig of verwijder packages tussen speelsessies, niet tijdens een avond: gameversies worden nog niet aan lopende kamers vastgezet.

## Controleren of alles werkt

```sh
curl http://localhost:3000/api/health
```

Het antwoord is `{"status":"ok","version":"0.2.0"}`, met de versie uit `Cargo.toml`. De spellencatalogus staat op `/api/v1/games`.

## Volgende stap

Maak [je eerste kamer](eerste-kamer.md), of draai de engine [in Docker](docker.md) zodat kamers en accounts een herstart overleven.
