---
title: De me-CLI
description: Installeer de Mini Engine CLI en gebruik me auth, me game, me dev, me skill en me setup.
section: CLI
order: 2
toc_depth: 3
---

# De me-CLI

Met de CLI uit [Casb02/mini-engine-cli](https://github.com/Casb02/mini-engine-cli) maak, test en publiceer je een spel voor Mini Engine. Hij heeft Node.js 22 of nieuwer nodig en geen andere afhankelijkheden. Het commando heet `me`; `miniengine` werkt ook.

```sh
npm install -g github:Casb02/mini-engine-cli
me --help
```

De CLI is openbaar en valt onder de MIT-licentie. Elk commando heeft `--help`, bijvoorbeeld `me game upload --help`.

## Snel aan de slag

`me setup` loopt alles één keer met je door: welke server, je dev-key, de AI-skills en eventueel een eerste spel. Elke stap kun je overslaan. Een dev-key krijg je van wie de Mini Engine-server beheert waar je naar publiceert; zie [je game publiceren](overzicht.md).

## Inloggen

### `me auth`

Vraagt je dev-key (`med_…`) en controleert hem bij de server. Wat je plakt, wordt niet getoond. Standaard is de server `https://miniengine.nl`; met `--server <adres>` kies je een andere. `--token` is er voor scripts.

### `me auth status` en `me auth logout`

Laat zien als wie je bent ingelogd, of vergeet de key op je eigen computer. De key zelf blijft geldig.

## Games

| Commando | Wat het doet |
| --- | --- |
| `me game list` | Je games met actieve versie en of ze aan staan |
| `me game new <slug> [--dir MAP]` | Een nieuw spel uit het SDK-template, in `./<slug>` |
| `me game upload [map] [--activate] [--dry-run]` | Pakt de map in en uploadt een nieuwe versie; `--dry-run` laat alleen zien wat meegaat |
| `me game versions <id>` | Alle bewaarde versies; welke actief is en welke een kamer gebruikt |
| `me game activate <id> <versie>` | Maakt een versie actief, ook om terug te gaan |
| `me game enable <id>` / `me game disable <id>` | Toont of verbergt de game op `/home`; kan sinds 0.5.1 ook op de accountpagina |
| `me game delete-version <id> <versie>` | Verwijdert één oude versie |
| `me game prune <id> [--keep N] [--dry-run]` | Verwijdert oude versies, behalve de actieve, de nieuwste N (standaard 3) en versies in gebruik |
| `me game delete <id>` | Verwijdert de hele game (vraagt om bevestiging, of `--yes`) |

### Wat `me game upload` meestuurt

Alle bestanden in de map, behalve:

- bestanden en mappen die met een punt beginnen (`.git`, `.env`, `.DS_Store`);
- `node_modules`, op elke diepte;
- de map `tests/` in de hoofdmap van de game;
- patronen uit een `.meignore`-bestand.

`.meignore` heeft één patroon per regel. `*` past binnen één map, `**` over mappen heen, een `/` aan het eind betekent alleen mappen, en een patroon met een `/` erin geldt vanaf de hoofdmap. Regels die met `#` beginnen zijn commentaar. `me game new` zet `jsconfig.json` en `types/` er alvast in, omdat die alleen voor je editor zijn.

Symlinks worden geweigerd. Voordat er iets verstuurd wordt, controleert de CLI het manifest, de rolpagina's, het icoon en de grenzen; zie [wat mag](overzicht.md#wat-mag).

### Foutmeldingen van de server

| Code | Wanneer |
| --- | --- |
| `invalid_request` | Het pakket klopt niet: manifest, rolpagina's, `settings_schema`, pad, versienaam, `runtime` niet `host`, of te groot. De melding noemt de reden |
| `forbidden` | De game is van iemand anders |
| `unauthorized` | De dev-key is ongeldig, verlopen of ingetrokken |
| `game_id_taken` | Het id hoort bij een ingebouwde game |
| `version_exists` | Deze versie bestaat al; verhoog `version` in `manifest.json` |
| `quota_games` | Je hebt al 10 games |
| `quota_releases` | Deze game heeft al 10 versies; ruim op met `me game prune` |
| `release_not_found` | Deze versie bestaat niet |
| `release_active` | Je probeert de actieve versie te verwijderen; activeer eerst een andere |
| `release_in_use` | Een lopende kamer speelt deze versie nog |
| `game_in_use` | Je probeert een game te verwijderen waar nog een kamer mee speelt |
| `game_blocked` | Wie de server beheert, heeft deze game geblokkeerd; aanzetten of verwijderen kan dan niet |
| `rate_limit` | Te veel verzoeken; wacht even |

## Lokaal testen

### `me dev`

Sinds CLI 0.5.0. Test een game met `runtime: "host"` op je eigen computer:

```sh
cd mijn-spel
me dev
```

`me dev` controleert eerst `manifest.json` zoals `me game upload` dat doet en start dan een kleine server die Mini Engine nabootst: kamers, spelers en klaar zijn, state met versies, acties naar de spelleider, realtime, achievements en game-data. In de browser zie je de spelleider, het gedeelde scherm en de spelers naast elkaar. Elke stoel draait op een eigen poort, dus elke speler heeft een eigen sessie, net als op een eigen telefoon. Met **Speler toevoegen** komt er iemand bij, met **Nieuwe kamer** begin je opnieuw.

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
- Het overzicht en elke stoel serveren dezelfde adressen als Mini Engine, zoals `/api/v1/rooms` en `/room/CODE/ROL`. Zo kan een script als `scripts/play.mjs` uit de bouwskill er een kamer mee bespelen; zie [testen](../game-bouwen/testen.md#geautomatiseerde-controles).

`me dev` is een nabootsing. Hij volgt het protocol van Mini Engine, en de tests van de CLI draaien hem met dezelfde stappen als de echte server. Test je game voor een avond met vrienden toch ook een keer als testversie op de server, met `me game upload`. Zie [testen](../game-bouwen/testen.md).

## Skills voor AI-agents

| Commando | Wat het doet |
| --- | --- |
| `me skill list` | De meegeleverde skills uit de SDK |
| `me skill install` | Installeert ze in `~/.claude/skills` |
| `me skill install --project` | Installeert ze in `./.claude/skills` |
| `me skill install --path <map>` | Installeert ze in een andere map, bijvoorbeeld voor een andere agent |

Een bestaande skill met andere inhoud wordt alleen met `--force` overschreven. Zie [bouwen met AI](../ai/bouwen-met-ai.md) voor wat de skills doen.

## Instellingen

De CLI bewaart de server en je dev-key in `~/.config/miniengine/config.json`, alleen leesbaar voor jou. Omgevingsvariabelen gaan voor:

| Variabele | Betekenis |
| --- | --- |
| `MINIENGINE_SERVER` | Adres van de server (standaard `https://miniengine.nl`) |
| `MINIENGINE_TOKEN` | Dev-key |

`--server <adres>` gaat weer voor de omgeving en geldt voor één commando.

Elk commando kent `--json` voor scripts. Bij een fout stopt de CLI met code 1 en de foutmelding van de server, bij verkeerd gebruik met code 2. Zonder terminal vragen `prune` en `delete` niet om bevestiging maar verwachten ze `--yes`.

Een dev-key is een geheim: wie hem heeft, kan namens jou games uploaden, wijzigen en verwijderen. Zet hem niet in een repository en deel hem niet in een chat. Plakken via `me auth` houdt hem uit je shellgeschiedenis.
