---
title: De me-CLI
description: Installeer de Mini Engine CLI en gebruik me init, me dev, me doctor, me game, me auth, me skill en me setup.
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

```sh
mkdir quizavond && cd quizavond
me init
```

`me init` maakt een spel met een paar vragen en laat je het meteen proberen met [`me dev`](#me-dev). Daar heb je nog geen dev-key voor nodig. Om te publiceren wel: die krijg je van wie de Mini Engine-server beheert waar je naar publiceert; zie [je game publiceren](overzicht.md). `me setup` loopt dan één keer alles met je door: welke server, je dev-key en de AI-skills. Elke stap kun je overslaan. `me doctor` laat zien of alles klaarstaat.

## Een spel maken

### `me init`

Sinds CLI 0.6.0. Maakt een nieuw spel in de map waarin je staat, of in `me init <map>`. Elke vraag heeft een standaard tussen haken; met Enter kies je die.

| Vraag | Standaard |
| --- | --- |
| Titel | De naam van de map |
| Id op de server | Gemaakt van de titel: *Quiz bij Dani* wordt `quiz-bij-dani` |
| Startsjabloon | `stemmen`; zie [startsjablonen](#startsjablonen) |
| Spelers (min-max) | Wat bij het sjabloon past, zoals `2-12` |
| Wie maakt de kamer? | Allebei, met *Iedereen doet mee* als standaard; of alleen *Iedereen doet mee*, of alleen *TV* |
| Uiterlijk | MiniEngineUI, met een thema dat bij het sjabloon past (`kalk`, `nacht`, `vilt` of `studio`); of eenvoudig |
| Taal van het spel | Nederlands; of Engels |
| AI-skills installeren? | Ja. Alleen gevraagd als ze in `~/.claude/skills` ontbreken |

Daarna zie je wat er klaarstaat en vraagt `me init`: *Nu proberen met me dev?* Met Enter start `me dev` en opent je browser met de spelleider en twee spelers naast elkaar.

```text
Een nieuw spel in deze map. Enter kiest wat tussen [haken] staat.

Titel [Quizavond]: Quiz bij Dani
Id op de server [quiz-bij-dani]:
Startsjabloon
    1  stemmen  Iedereen stemt ja of nee op één vraag; elk scherm toont de stand.
    2  quiz     Meerkeuzevragen op tijd, punten en een eindstand; spelers maken eigen vragenlijsten.
    3  buzzer   Wie drukt het snelst na het signaal? Realtime knoppen; de host beslist eerlijk op de klok van de server.
    4  beurten  Om de beurt dobbelen; de host gooit, houdt de beurten bij en slaat wie te lang weg is over.
    5  leeg     Een kaal begin: lobby, start, één voorbeeldzet en een einde.
    Kies [1]: 2
Spelers (min-max) [1-16]: 2-8
…

Quiz bij Dani staat klaar in deze map.
  Sjabloon   quiz
  Id         quiz-bij-dani
  Spelers    2 tot 8
  Kamer      Iedereen doet mee (standaard) of TV
  Uiterlijk  MiniEngineUI, thema studio
  Taal       Nederlands

Nu proberen met me dev? [J/n]
```

- Staat er al iets in de map (verborgen bestanden zoals `.git` tellen niet mee), dan komt het spel in een nieuwe map met het id als naam. Een map die je zelf noemt, moet leeg zijn of nog niet bestaan.
- Zonder terminal, of met `--yes` of `--json`, vraagt `me init` niets. Het gebruikt dan je opties en verder de standaard. Met `--interactive` stelt het de vragen toch, met de antwoorden op stdin.
- Een optie die je meegeeft, wordt niet meer gevraagd.

| Optie | Wat het doet |
| --- | --- |
| `--template NAAM` | `stemmen`, `quiz`, `buzzer`, `beurten` of `leeg` |
| `--title TITEL`, `--slug ID` | Naam van het spel en id op de server |
| `--players MIN-MAX` | Aantal spelers, bijvoorbeeld `2-8` |
| `--modes LIJST` | `playing` (*Iedereen doet mee*), `tv` of `playing,tv`; de eerste is de standaard |
| `--look NAAM`, `--theme NAAM` | `mini-engine-ui` of `plain`; het thema bij MiniEngineUI |
| `--lang TAAL` | `nl` of `en` |
| `--skills`, `--no-skills` | Ontbrekende AI-skills wel of niet installeren |
| `--dev`, `--no-dev` | Daarna wel of niet `me dev` starten, zonder het te vragen; met `--port` en `--no-open` voor die `me dev` |
| `-y`, `--yes` | Niets vragen |

```sh
me init quizavond --yes --template quiz --title "Quiz bij Dani" --players 2-8
me init feest --template buzzer --modes tv --look plain --lang en --no-dev --json
```

### Startsjablonen

Elk sjabloon is een werkend spel dat je meteen kunt spelen, met `host_modes: ["playing", "tv"]`. Het zijn beginpunten, geen complete spellen.

| Sjabloon | Wat het is | Wat je eraan ziet |
| --- | --- | --- |
| `stemmen` | Iedereen stemt ja of nee op één vraag; elk scherm toont de stand. Heeft een gedeeld scherm. | De wachtrij van de host, een maker die meespeelt, instellingen als tekst |
| `quiz` | Meerkeuzevragen op tijd, punten en een eindstand. | Geheime antwoorden in `host_state`, het eigen antwoord in `player_states`, `data.json`, [eigen sets](../concepten/eigen-sets.md) met één vraag per regel, een achievement |
| `buzzer` | Wie drukt het snelst nadat de knop groen wordt? Te vroeg telt niet. | [Realtime](../concepten/realtime.md) met de `ts` van de server; de host wacht 150 ms, sorteert en beslist |
| `beurten` | Om de beurt dobbelen; een 1 kost je de punten van die beurt. | Beurten, een dobbelsteen die de host gooit, spelers die weggaan, overslaan na 30 seconden offline |
| `leeg` | Een kaal begin: lobby, start, één voorbeeldzet en een einde. | Het kleinste rondje: actie, scheidsrechter, state |

In elk spel staan dezelfde onderdelen: `assets/logic.js` met de spelregels en `tests/logic.test.mjs`, `assets/app.js` met de weergave en de scheidsrechter, `assets/room.js` met verbinding, kamercode en lobby, `assets/texts.js` met alle woorden, `assets/icon.svg`, een README in de taal van het spel, `jsconfig.json` met `types/`, en `.meignore`. Met MiniEngineUI staat de kit in `assets/ui/`.

### `me game new`

Maakt een spel zonder vragen in `./<slug>`. Zonder opties is het de stemgame, in het Engels en eenvoudig opgemaakt. `--template`, `--title`, `--players`, `--modes`, `--look`, `--theme` en `--lang` werken als bij `me init`; met `--dir MAP` kies je een andere map.

```sh
me game new ja-of-nee
me game new kwis --template quiz --look mini-engine-ui --lang nl
```

## Inloggen

### `me auth`

Vraagt je dev-key (`med_…`) en controleert hem bij de server. Wat je plakt, wordt niet getoond. Standaard is de server `https://miniengine.nl`; met `--server <adres>` kies je een andere. `--token` is er voor scripts.

### `me auth status` en `me auth logout`

Laat zien als wie je bent ingelogd, of vergeet de key op je eigen computer. De key zelf blijft geldig.

## Games

| Commando | Wat het doet |
| --- | --- |
| `me game list` | Je games met actieve versie en of ze aan staan |
| `me game new <slug> [--dir MAP]` | Een nieuw spel uit een sjabloon, in `./<slug>`; zie [me game new](#me-game-new) |
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

`.meignore` heeft één patroon per regel. `*` past binnen één map, `**` over mappen heen, een `/` aan het eind betekent alleen mappen, en een patroon met een `/` erin geldt vanaf de hoofdmap. Regels die met `#` beginnen zijn commentaar. `me init` en `me game new` zetten `jsconfig.json` en `types/` er alvast in, omdat die alleen voor je editor zijn.

Symlinks worden geweigerd. Voordat er iets verstuurd wordt, controleert de CLI het manifest, de rolpagina's, het icoon en de grenzen; zie [wat mag](overzicht.md#wat-mag).

Is het de eerste versie van een nieuw spel, dan zegt `me game upload` erbij dat die meteen live staat, voor iedereen op die server, met het adres om een kamer te maken.

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
| `--lan` | Ook telefoons op hetzelfde wifi laten meedoen; sinds CLI 0.6.0 |
| `--no-open` | Geen browser openen |

```sh
me dev ./ja-of-nee --players 4
me dev --set sets/filmavond.json --no-open
```

- Pas je iets aan in de map, dan laden de stoelen opnieuw en blijft de kamer bestaan. Een fout in het manifest zie je in het overzicht en in de terminal.
- Iedere speler telt als speler met een account, zodat je achievements kunt testen. Gekregen achievements verschijnen in de terminal.
- Sinds CLI 0.5.1 controleert `me dev` ook het [icoon](../game-bouwen/package-en-manifest.md#icon) en volgt hij de regels voor een [meespelende maker](../concepten/spelleidermodi.md#meespelen-in-een-eigen-spel): diens plek staat klaar en de snapshot heeft `host_player_id`. Sinds CLI 0.5.2 kent `me dev` ook [TV](../concepten/spelleidermodi.md#tv): de host zonder plek die het spel toont.
- Alles staat alleen in het geheugen. Stoppen doe je met Ctrl+C.
- Standaard luistert `me dev` alleen op je eigen computer (`127.0.0.1`). Met `--lan` toont hij ook een adres zoals `http://192.168.1.20:3171/join`, met een QR-code in het overzicht. Een telefoon op hetzelfde wifi opent dat adres, kiest een naam en krijgt een eigen plek; het overzicht toont die plek zonder scherm. Alleen die aanmeldpagina en de plekken van de telefoons staan op het netwerk, en een telefoon kan daar alleen wat een speler nodig heeft. Het overzicht en de andere plekken blijven op je eigen computer. Er doen hoogstens 8 telefoons tegelijk mee; na **Nieuwe kamer** doen ze opnieuw mee via hetzelfde adres. Iedereen op het netwerk kan de aanmeldpagina openen, dus gebruik `--lan` alleen op een netwerk dat je vertrouwt.
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

## Controleren

### `me doctor`

Sinds CLI 0.6.0. Loopt alles langs wat je nodig hebt, als lijst met ✓ en ✗. Onder elke ✗ staat één manier om het op te lossen.

- de versie van Node.js en of er een nieuwere CLI is (zonder internet slaat hij dat over);
- de server en of `/api/health` antwoordt;
- je dev-key, zoals `me auth status` die controleert;
- de AI-skills in `~/.claude/skills`;
- in een map met `manifest.json`: dezelfde controles als `me game upload --dry-run`, en of de rolpagina's alleen bestanden uit het spel laden. Ben je ingelogd, dan zegt hij ook of deze versie al op de server staat.

```text
✓ Node.js 22.12.0
✓ CLI 0.6.0 is de nieuwste versie
✓ Server https://miniengine.nl (standaard) is bereikbaar, Mini Engine 0.6.1
✗ Geen dev key voor https://miniengine.nl; uploaden kan nog niet. Spelen met me dev lukt wel.
    Vraag een dev key aan wie de server beheert en log in met: me auth
✓ AI-skills staan in ~/.claude/skills
✓ Spel quizavond 0.1.0 in .: 20 bestanden, 196,4 KiB, klaar om te uploaden

1 ding om op te lossen.
```

Met `--json` krijg je dezelfde lijst als JSON (`ok` en `checks`). De exitcode is 1 als er iets op te lossen is.

## Instellingen

De CLI bewaart de server en je dev-key in `~/.config/miniengine/config.json`, alleen leesbaar voor jou. Omgevingsvariabelen gaan voor:

| Variabele | Betekenis |
| --- | --- |
| `MINIENGINE_SERVER` | Adres van de server (standaard `https://miniengine.nl`) |
| `MINIENGINE_TOKEN` | Dev-key |

`--server <adres>` gaat weer voor de omgeving en geldt voor één commando.

Elk commando kent `--json` voor scripts. Bij een fout stopt de CLI met code 1 en de foutmelding van de server, bij verkeerd gebruik met code 2. Zonder terminal vragen `prune` en `delete` niet om bevestiging maar verwachten ze `--yes`.

Een dev-key is een geheim: wie hem heeft, kan namens jou games uploaden, wijzigen en verwijderen. Zet hem niet in een repository en deel hem niet in een chat. Plakken via `me auth` houdt hem uit je shellgeschiedenis.
