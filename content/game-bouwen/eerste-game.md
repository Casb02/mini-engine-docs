---
title: Je eerste game
description: Maak met me init in vijf minuten een speelbaar spel uit een startsjabloon, speel het met me dev op je eigen computer en pas het aan.
section: SDK
group: Aan de slag
order: 2
---

# Je eerste game

De CLI maakt met `me init` een compleet, speelbaar spel uit een startsjabloon: een stemspel, een quiz, een buzzer, een spel met beurten of een kaal begin. Daarna speel je het met `me dev` meteen op je eigen computer, en pas je het aan tot je eigen spel. De sjablonen komen uit de SDK; ook de scaffolder `create-mini-game` maakt ze.

## Wat je nodig hebt

- Node.js 22 of nieuwer.
- De [me-CLI](../publiceren/cli.md), sinds 0.6.0 voor `me init`.

```sh
npm install -g github:Casb02/mini-engine-cli
```

## In vijf minuten

```sh
mkdir mijn-spel
cd mijn-spel
me init
```

`me init` vraagt de titel, het startsjabloon, het aantal spelers, wie de kamer maakt (*Iedereen doet mee*, *TV* of allebei), het uiterlijk en de taal. Elke vraag heeft een standaard, dus Enter, Enter, Enter werkt ook. Alle vragen en opties staan bij [me init](../publiceren/cli.md#me-init).

Aan het eind vraagt `me init` of je het meteen wilt proberen. Dan start `me dev` en zie je in je browser de spelleider en twee spelers naast elkaar. Je speelt zelf mee: *Iedereen doet mee* (`playing`) is de standaard, en je plek staat meteen klaar. Zet de twee spelers klaar en start het spel op de pagina van de spelleider. Sla je een bestand op, dan laden de stoelen opnieuw en blijft de kamer bestaan. Stoppen doe je met Ctrl+C.

Wil je het op echte telefoons proberen, op hetzelfde wifi? Start dan `me dev --lan` en open op de telefoon het adres dat `me dev` toont, of scan de QR-code in het overzicht.

Meer over `me dev`, en hoe je daarna op een echte server test, staat bij [testen](testen.md).

## Kies een sjabloon

| Sjabloon | Wat het is | Goed begin voor |
| --- | --- | --- |
| `stemmen` | Iedereen stemt ja of nee op één vraag; elk scherm toont de stand. | Een spel waarin iedereen tegelijk iets kiest |
| `quiz` | Meerkeuzevragen op tijd, punten en een eindstand. Spelers maken eigen vragenlijsten, één vraag per regel. | Alles met geheime antwoorden en rondes |
| `buzzer` | Wie drukt het snelst nadat de knop groen wordt? | Snelheid en reacties met [realtime](../concepten/realtime.md) |
| `beurten` | Om de beurt dobbelen; een 1 kost je de punten van die beurt. | Bord-, kaart- en dobbelspellen |
| `leeg` | Een kaal begin: lobby, start, één voorbeeldzet en een einde. | Een eigen idee dat op niets lijkt |

Elk sjabloon biedt *Iedereen doet mee* en *TV*. Bij TV is de pagina van de host het gedeelde scherm: in de lobby met de QR-code en de kamercode, tijdens het spel met het spel groot.

## Het id

`me init` maakt van de titel een id, de naam van je spel op de server: *Quiz bij Dani* wordt `quiz-bij-dani`. Je kunt het aanpassen. Een id heeft hoogstens 48 tekens: kleine letters, cijfers en losse streepjes, en het begint met een letter. Dus `mijn-spel` en `quiz2` mogen, `2quiz` en `mijn--spel` niet.

`me init` schrijft in de map waarin je staat als die leeg is. Staat er al iets, dan maakt het een nieuwe map met het id als naam. Het overschrijft nooit iets.

## Wat je krijgt

```text
mijn-spel/
  manifest.json         id, titel, spelers, instellingen, runtime, icoon
  host.html             pagina voor de spelleider
  player.html           pagina voor elke speler
  assets/
    app.js              wat elke pagina toont, en de scheidsrechter van de host
    logic.js            de spelregels, zonder scherm of netwerk
    room.js             verbinding, kamercode, klaar zijn en starten
    texts.js            alle woorden van het spel
    style.css           opmaak
    icon.svg            het icoon op de startpagina
    ui/                 MiniEngineUI, als je dat uiterlijk koos
  tests/
    logic.test.mjs      tests voor de spelregels
  jsconfig.json         alleen voor je editor: types voor /sdk/mini-engine.js
  types/
    mini-engine.d.ts    gebundelde typedeclaraties van de SDK
  README.md             uitleg bij dit spel
  .meignore             wat me game upload overslaat
```

Het stemspel heeft ook `display.html`, een gedeeld scherm naast de spelers. De quiz heeft `data.json` met de vragen; die leest alleen de host. Elk sjabloon is een spel met `runtime: "host"`: de pagina van de spelleider controleert elke zet en publiceert de stand. Laat dat tabblad open tijdens het spelen.

## Waar pas je wat aan?

| Wil je | Pas aan |
| --- | --- |
| Andere spelregels | `assets/logic.js`, en de tests in `tests/logic.test.mjs` |
| Wat de host doet met een zet | `assets/app.js`: de scheidsrechter |
| Andere woorden, of een andere taal | `assets/texts.js` |
| Een andere weergave | `host.html`, `player.html` en `assets/style.css` |
| Andere standaardinstellingen | `manifest.json`: `default_settings` en `settings_schema` |
| Geheime speldata, zoals antwoorden | `data.json`, die alleen de host leest met `gameData()` |

## Controleren

Vanuit de map van je spel:

```sh
node --test tests/*.test.mjs
npx -p typescript tsc -p jsconfig.json
me doctor
```

De bestanden in `assets/` zijn gewone JavaScript met JSDoc-types, dus de browser draait ze zonder build. `jsconfig.json` koppelt de import `/sdk/mini-engine.js` aan de typedeclaraties in `types/`. VS Code en andere editors met TypeScript pakken dat vanzelf op. `me doctor` controleert je spel zoals `me game upload` dat doet, en kijkt of alles klaarstaat om te publiceren.

Alleen bestanden onder `assets/` zijn publiek. `jsconfig.json` en `types/` staan in `.meignore`, en `tests/` gaat nooit mee, dus `me game upload` laat ze thuis.

## Zonder vragen, of zonder de CLI

`me game new mijn-spel --template quiz` maakt een spel zonder vragen. Zonder opties is dat het stemspel, in het Engels en eenvoudig opgemaakt.

De scaffolder zit ook in het SDK-pakket, als `create-mini-game`, met dezelfde sjablonen en opties:

```sh
npx -p @casb02/mini-engine-sdk create-mini-game mijn-spel --template quiz --look mini-engine-ui --lang nl
npx -p @casb02/mini-engine-sdk create-mini-game --list
npx -p @casb02/mini-engine-sdk create-mini-game --help
```

Het pakket staat in GitHub Packages; zie [het SDK-overzicht](../sdk/overzicht.md#in-een-eigen-project) voor de eenmalige instelling. Met `--directory pad/naar/mijn-spel` kies je een andere map; de laatste mapnaam moet dan gelijk zijn aan de slug.

> Open gegenereerde HTML niet via `file://` of een losse static server. De pagina's hebben kamers, sessies, websockets en de SDK op `/sdk/mini-engine.js` nodig. `me dev` levert die op je eigen computer, net als Mini Engine online.

## Volgende stap

Lees hoe je [test](testen.md), hoe [een package en manifest](package-en-manifest.md) in elkaar zitten, of ga meteen naar [de browserhost schrijven](browserhost.md). Klaar om te spelen met vrienden? Zie [je game publiceren](../publiceren/overzicht.md).
