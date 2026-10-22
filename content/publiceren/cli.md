---
title: De me-CLI
description: Installeer de Mini Engine CLI en gebruik me auth, me game, me dev, me skill, me setup en me admin.
section: Publiceren
order: 2
toc_depth: 3
---

# De me-CLI

De CLI uit [Casb02/mini-engine-cli](https://github.com/Casb02/mini-engine-cli) praat met de [ontwikkelaarsroutes](../api/ontwikkelaars.md) van een engine. Hij heeft Node.js 22 of nieuwer nodig en geen andere afhankelijkheden. Het commando heet `me`; `miniengine` werkt ook.

```sh
npm install -g github:Casb02/mini-engine-cli
me --help
```

De CLI is openbaar en valt onder de MIT-licentie.

## Snel aan de slag

`me setup` loopt alles één keer met je door: welke server, je dev-key, de AI-skills en eventueel een eerste spel. Elke stap kun je overslaan.

## Inloggen

### `me auth`

Vraagt je dev-key (`med_…`) en controleert hem bij de server. Wat je plakt, wordt niet getoond. Standaard is dat `https://miniengine.nl`; met `--server http://localhost:3000` of een ander adres kies je een andere engine. `--token` is er voor scripts.

### `me auth status` en `me auth logout`

Laat zien als wie je bent ingelogd, of vergeet de key.

## Games

| Commando | Wat het doet |
| --- | --- |
| `me game list` | Je games met actieve versie en of ze aan staan |
| `me game new <slug>` | Een nieuw spel uit het SDK-template, in `./<slug>` |
| `me game upload [map] [--activate] [--dry-run]` | Pakt de map in en uploadt een nieuwe versie; `--dry-run` laat alleen zien wat meegaat |
| `me game versions <id>` | Alle bewaarde versies; welke actief is en welke een kamer gebruikt |
| `me game activate <id> <versie>` | Maakt een versie actief, ook om terug te gaan |
| `me game enable <id>` / `me game disable <id>` | Toont of verbergt de game op `/home`; kan sinds 0.5.1 ook op de accountpagina |
| `me game delete-version <id> <versie>` | Verwijdert één oude versie |
| `me game prune <id> [--keep N] [--dry-run]` | Verwijdert oude versies, behalve de actieve, de nieuwste N (standaard 3) en versies in gebruik |
| `me game delete <id>` | Verwijdert de hele game (vraagt om bevestiging, of `--yes`) |

### Wat `me game upload` meestuurt

Alle bestanden in de map, behalve verborgen bestanden en mappen (`.git`, `.DS_Store`), `node_modules/`, `tests/` en patronen uit een `.meignore`-bestand. Symlinks worden geweigerd. De CLI controleert de grenzen al voordat hij iets verstuurt.

## Lokaal testen

### `me dev`

Sinds CLI 0.5.0. Test een game met `runtime: "host"` zonder engine:

```sh
cd mijn-spel
me dev
```

`me dev` controleert eerst `manifest.json` zoals `me game upload` dat doet en start dan een kleine server die de engine nabootst: kamers, spelers en klaar zijn, state met versies, acties naar de spelleider, realtime, achievements en game-data. In de browser zie je de spelleider, het gedeelde scherm en de spelers naast elkaar. Elke stoel draait op een eigen poort, dus elke speler heeft een eigen sessie, net als op een eigen telefoon. Met **Speler toevoegen** komt er iemand bij, met **Nieuwe kamer** begin je opnieuw.

| Optie | Wat het doet |
| --- | --- |
| `[map]` | De map van de game; standaard de map waarin je staat |
| `--port POORT` | Poort van het overzicht (standaard 3170); de stoelen krijgen de poorten erna. `0` kiest vrije poorten |
| `--players N` | Aantal spelers bij de start (standaard 2) |
| `--set BESTAND` | JSON-bestand dat de game krijgt in plaats van `data.json`, gecontroleerd als [eigen set](../concepten/eigen-sets.md) |
| `--no-open` | Geen browser openen |

```sh
me dev ./ja-of-nee --players 4
me dev --set sets/filmavond.json --no-open
```

- Pas je iets aan in de map, dan laden de stoelen opnieuw en blijft de kamer bestaan. Een fout in het manifest zie je in het overzicht en in de terminal.
- Iedere speler telt als speler met een account, zodat je achievements kunt testen. Gekregen achievements verschijnen in de terminal.
- Sinds CLI 0.5.1 controleert `me dev` ook het [icoon](../game-bouwen/package-en-manifest.md#icon) en volgt hij de regels voor een [meespelende maker](../concepten/spelleidermodi.md#meespelen-in-een-eigen-spel): diens plek staat klaar en de snapshot heeft `host_player_id`. Sinds CLI 0.5.2 kent `me dev` ook [TV](../concepten/spelleidermodi.md#tv): de host zonder plek die het spel toont.
- Alles staat alleen in het geheugen. Stoppen doe je met Ctrl+C.
- De server luistert alleen op je eigen computer (`127.0.0.1`). Telefoons op je wifi kunnen er niet bij.

`me dev` is een nabootsing. Hij volgt het protocol van de engine, en de tests van de CLI draaien hem met dezelfde stappen als de echte engine. Test je game voor een avond met vrienden toch ook een keer op een echte server, bijvoorbeeld met een testversie via `me game upload`. Zie ook [testen](../game-bouwen/testen.md).

## Skills voor AI-agents

| Commando | Wat het doet |
| --- | --- |
| `me skill list` | De meegeleverde skills uit de SDK |
| `me skill install` | Installeert ze in `~/.claude/skills` |
| `me skill install --project` | Installeert ze in `./.claude/skills` |
| `me skill install --path <map>` | Installeert ze in een andere map, bijvoorbeeld voor een andere agent |

Zie [bouwen met AI](../ai/bouwen-met-ai.md) voor wat de skills doen.

## Voor de eigenaar

Deze commando's gebruiken het admintoken van de server, niet een dev-key. Zie [beheer](beheer.md).

| Commando | Wat het doet |
| --- | --- |
| `me admin login` / `me admin logout` | Controleert en bewaart het admintoken, of vergeet het |
| `me admin token create <gebruiker> [--label TEKST] [--expires DAGEN]` | Maakt een dev-key; die zie je maar één keer |
| `me admin token list` | Alle keys, zonder geheimen |
| `me admin token revoke <id>` | Trekt een key direct in |
| `me admin account verify <gebruikersnaam>` | Bevestigt het e-mailadres van een account met de hand; een dev-key kan alleen voor een bevestigd adres |
| `me admin games` | Alle geüploade games met eigenaar |
| `me admin game block <id>` / `unblock <id>` | Noodstop voor een game, of opheffen |

## Instellingen

De CLI bewaart server en keys in `~/.config/miniengine/config.json` (alleen leesbaar voor jou). Omgevingsvariabelen gaan voor:

| Variabele | Betekenis |
| --- | --- |
| `MINIENGINE_SERVER` | Adres van de engine (standaard `https://miniengine.nl`) |
| `MINIENGINE_TOKEN` | Dev-key |
| `MINIENGINE_ADMIN_TOKEN` | Admintoken |

Elk commando kent `--json` voor scripts. Bij een fout stopt de CLI met code 1 en de foutmelding van de server, bij verkeerd gebruik met code 2. Zonder terminal vragen `prune` en `delete` niet om bevestiging maar verwachten ze `--yes`.
