---
title: Upgraden
nav_title: Upgraden
description: Wat je met een bestaand spel doet bij de overstap van Mini Engine 0.4 naar 0.5, van 0.5 naar 0.6, van 0.6 naar 0.7 en van 0.7 naar 0.8, en welke SDK en CLI daarbij horen.
section: Start
order: 2
---

# Upgraden

Mini Engine, de SDK en de CLI krijgen af en toe een nieuwe versie. Op deze pagina staat per stap wat je met een bestaand spel moet doen, wat er nieuw is als je het wilt gebruiken, en wat vanzelf goed gaat. Sla je een versie over, loop dan de stappen na elkaar door. Van 0.4 naar 0.8 zijn het er vier.

Een spel dat werkte, blijft werken. Manifests, kamers en sets van een oudere versie blijven geldig, en nieuwe velden zijn optioneel. De meeste stappen gaan over je gereedschap, je links en hoe je spel op een telefoon past.

## Eerst: welke versie heb ik?

Er zijn drie onderdelen, elk met een eigen versienummer: Mini Engine op de server, de SDK in je spel en de CLI op je eigen computer.

```sh
me --version     # de versie van de CLI
me doctor        # of er een nieuwere CLI is, en welke versie van Mini Engine de server draait
```

`me doctor` vraagt de versie van de server op bij [`GET /api/health`](api/games.md#get-api-health). Dat adres is openbaar, dus het kan ook zonder CLI:

```sh
curl https://miniengine.nl/api/health
```

Het antwoord is `{ "status": "ok", "version": "…" }`, met in `version` de versie van Mini Engine op die server. Publiceer je naar een andere server, vraag het dan daar op.

Je spelpagina's laden de SDK van de server, op `/sdk/mini-engine.js`. Die werk je dus niet zelf bij. Je spel heeft wel een eigen kopie van de types voor je editor, in `types/mini-engine.d.ts`. De eerste regel van dat bestand noemt de versie van de SDK waar het uit komt.

Deze versies horen bij elkaar:

| Mini Engine | SDK | CLI |
| --- | --- | --- |
| 0.4 | 0.3.1 en 0.3.2 | 0.4.0 en 0.4.1 |
| 0.5.0 | 0.5.0 | 0.5.0 |
| 0.5.1 | 0.5.1 | 0.5.1 |
| 0.5.2 tot en met 0.5.5 | 0.5.2 | 0.5.2 |
| 0.6.0 tot en met 0.6.5 | 0.6.0 | 0.6.0 |
| 0.7.0 en 0.7.1 | 0.6.0 | 0.7.0 |
| 0.8.0 en 0.8.1 | 0.7.0 | 0.8.0 |

De client in de SDK bleef van 0.5.0 tot en met 0.6.0 gelijk; die versies brachten types, startsjablonen en skills. SDK 0.7.0 geeft `ApiClient` drie methoden voor afbeeldingen erbij. Mini Engine 0.6 en 0.7 serveren de client van SDK 0.5.2, die verder gelijk is; Mini Engine 0.8 serveert SDK 0.7.0, ook op `/sdk/mini-engine.d.ts`. Een spelpagina heeft de methoden voor afbeeldingen niet nodig: afbeeldingen uploadt een speler in de set-editor. Haal de types voor je eigen kopie uit SDK 0.7.0, zoals hieronder.

Een nieuwere CLI en SDK werken met Mini Engine 0.5 en nieuwer. Wat een nieuwere versie van de server vraagt, staat er in deze documentatie steeds bij, zoals *sinds 0.5.1*. Zie ook [versies](sdk/overzicht.md#versies) bij de SDK.

## Je gereedschap bijwerken

Dit doe je bij elke stap. De nieuwste CLI brengt de startsjablonen en de skills van de nieuwste SDK mee.

```sh
npm install -g github:Casb02/mini-engine-cli   # de nieuwste CLI
me skill install --force                        # de AI-skills uit die CLI, over de oude heen
```

`--force` overschrijft ook wat je zelf in een skill hebt aangepast. Zonder `--force` blijft een oudere skill staan; `me doctor` meldt dat verschil.

Gebruik je de types in je editor of met `tsc`, vervang dan de kopie in je spel door die van SDK 0.7.0:

```sh
curl -o types/mini-engine.d.ts https://raw.githubusercontent.com/Casb02/mini-engine-sdk/v0.7.0/types/mini-engine.d.ts
```

Gebruik je het npm-pakket in een eigen project, installeer dan versie 0.7.0; zie [in een eigen project](sdk/overzicht.md#in-een-eigen-project).

Pas je daarna iets aan je spel aan, verhoog dan `version` in `manifest.json` en upload de nieuwe versie met `--activate`. Nieuwe kamers krijgen die versie; lopende kamers spelen door met de hunne. Zie [versies en kamers](publiceren/versies.md).

```sh
me game upload --activate
```

## Van 0.4 naar 0.5

Mini Engine 0.5.0 bracht realtime, achievements en eigen sets. In 0.5.1 tot en met 0.5.5 kwamen de meespelende maker, TV, een eigen icoon en een formulier voor eigen sets erbij. De SDK en de CLI gingen mee naar 0.5.

### Wat je moet doen

**Werk je gereedschap en de types bij**, zoals [hierboven](#je-gereedschap-bijwerken). Sinds SDK 0.5.0 geeft `roomInfo()` het type `RoomInfo`, met `runtime: 'host' | 'server'` in plaats van een gewone string. `register()` en `setEmail()` kregen een optioneel tweede argument met `turnstileToken`. Los de typefouten op die je daarna ziet.

**Vervang links naar `/demo` door `/home`.** De pagina's van Mini Engine staan sinds 0.5 onder `/home`. Een oude link onder `/demo`, zoals `/demo/join?room=CODE` in een uitnodiging, stuurt nog door naar hetzelfde pad onder `/home`, met de query erbij. Dat geldt alleen voor `GET`; andere verzoeken naar `/demo` geven `405`.

**Houd elke `enum` in `settings_schema` op hoogstens 64 waarden.** Een upload met een langere keuzelijst wordt geweigerd. `me dev` en `me game upload` melden het al op je eigen computer.

**Zet `required` in de volgorde van je formulier.** Sinds 0.5.5 toont de pagina voor een nieuwe kamer de instellingen in de volgorde van `required` in het `settings_schema`, en daarna de rest. Daarvoor stonden ze op alfabet. Zie [settings_schema](game-bouwen/package-en-manifest.md#settings-schema).

**Let bij een nieuw spel op de versie van de server.** Een nieuw spel uit de CLI biedt `playing` en `tv` aan. Mini Engine 0.5.0 weigert `playing`, en `tv` kan pas vanaf 0.5.2. Met `me doctor` zie je welke versie de server draait.

**Schreef je zelf een websocketclient?** Na `auth` stuurt de server naast `snapshot` nu ook `rt.values`, en later kunnen `rt.event`, `rt.value`, `rt.reset`, `rt.throttled` en `achievement` binnenkomen. Sla berichten over waarvan je het `type` niet kent. De SDK doet dat al. Zie [berichten van de server](api/websocket.md#berichten-van-de-server).

### Nieuw, als je wilt

| Sinds | Wat | Lees verder |
| --- | --- | --- |
| 0.5.0 | Realtime: snelle events en live waarden naast de spelstand | [Realtime](concepten/realtime.md) |
| 0.5.0 | Achievements in het manifest, die de host toekent | [Achievements](concepten/achievements.md) |
| 0.5.0 | Eigen sets: inhoud die spelers zelf maken en op hun account bewaren | [Eigen sets](concepten/eigen-sets.md) |
| 0.5.0 | `me dev`: je spel testen op je eigen computer | [me dev](publiceren/cli.md#me-dev) |
| 0.5.1 | De maker speelt mee (`playing`) | [Meespelen in een eigen spel](concepten/spelleidermodi.md#meespelen-in-een-eigen-spel) |
| 0.5.1 | Een eigen icoon (`icon`) | [icon](game-bouwen/package-en-manifest.md#icon) |
| 0.5.1 | Je eigen spellen aan of uit zetten op de accountpagina | [Aan of uit vanaf de accountpagina](publiceren/overzicht.md#aan-of-uit-vanaf-de-accountpagina) |
| 0.5.1 | De kamercode kopiëren en een QR-code om mee te doen, ook in MiniEngineUI | [MiniEngineUI](ai/bouwen-met-ai.md#miniengineui) |
| 0.5.2 | De maker is een tv (`tv`) | [TV](concepten/spelleidermodi.md#tv) |
| 0.5.3 | Een formulier voor eigen sets met platte velden | [Het formulier](concepten/eigen-sets.md#het-formulier-voor-je-eigen-soort-set) |

Gebruik je eigen sets, houd dan twee dingen in gedachten. Het formulier werkt alleen met veldnamen van 1 tot 64 tekens uit `A-Z`, `a-z`, `0-9`, `_` en `-` (sinds 0.5.4); andere namen krijgen de JSON-editor. En sets worden gecontroleerd tegen de actieve versie van je spel. Haal je in een nieuwe versie een soort weg, of maak je het schema strenger, dan kunnen spelers hun bestaande sets niet meer kiezen of opslaan.

### Geen actie nodig

- Manifests en kamers van 0.4 blijven geldig. Nieuwe velden zijn optioneel: zonder `achievements` en `set_kinds` zijn het lege lijsten, en zonder `host_modes` leidt de maker het spel zoals vroeger (`["moderator"]`).
- Je spel laadt de SDK van de server en krijgt de nieuwe client dus vanzelf. Je hoeft niets te bundelen.
- De Content-Security-Policy, de dev-key en het uploaden, activeren en terugrollen werken zoals in 0.4.

### Checklist

1. De CLI is bijgewerkt, de skills zijn opnieuw geïnstalleerd met `--force`, en `types/mini-engine.d.ts` komt uit de nieuwste SDK.
2. Er staan geen links meer naar `/demo`.
3. Elke `enum` in `settings_schema` heeft hoogstens 64 waarden.
4. `required` staat in de volgorde waarin het formulier de instellingen moet tonen.
5. Je spel heeft een nieuwe `version` en is geüpload met `me game upload --activate`.

## Van 0.5 naar 0.6

Mini Engine 0.6.0 is een vernieuwde site met spelkaarten. In 0.6.1 tot en met 0.6.5 kwamen de naam van de maker, linkvoorbeelden, een scherm dat vanzelf aan blijft en een kamer die past in het zichtbare deel van een telefoon erbij. De SDK en de CLI gingen naar 0.6.0, met startsjablonen, `me init` en `me doctor`. Kom je van 0.5.0 of 0.5.1, kijk dan ook bij [van 0.4 naar 0.5](#van-0-4-naar-0-5) naar wat er sinds 0.5.1 kwam.

### Wat je moet doen

**Werk je gereedschap, de skills en de types bij**, zoals [hierboven](#je-gereedschap-bijwerken). Oudere skills laten een spel nog zelf het scherm aanhouden en kennen het zichtbare deel van een telefoon niet. Met `me skill install --force` krijgt je AI-agent de nieuwe regels.

**Laat je spel passen in het zichtbare deel van de telefoon** (sinds 0.6.5). Het iframe van de kamer is precies zo groot als het deel van het browservenster tussen de adresbalk en de werkbalk: ongeveer 393×660 op een iPhone 15 of 16 in Safari, en 375×548 op een iPhone SE. Haal `min-height: 100vh` weg, want dan schuift de onderkant onder de werkbalk. Vul de pagina met `height: 100%` of `100dvh`, en houd de belangrijkste knop in beeld zonder te scrollen. Zie [op een telefoon](game-bouwen/rolpaginas.md#op-een-telefoon).

```css
html, body { height: 100%; }   /* niet: min-height: 100vh */
```

**Geef elke rolpagina een `theme-color`** (sinds 0.6.5). Na het laden neemt de kamerpagina de eerste `<meta name="theme-color">` van je pagina over waarvan `media` past, of die geen `media` heeft. Die kleur komt in de strook rond het iframe en in de balken van de browser. Zet in de `<head>` van elke rolpagina een tag voor licht en een voor donker. De kamerpagina leest ze bij het laden, en opnieuw als het kleurschema wisselt; een kleur die je tijdens het spel verandert, neemt ze niet over.

```html
<meta name="theme-color" content="#f3efe6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16201b" media="(prefers-color-scheme: dark)">
```

**Je eigen scherm-aan-code mag weg** (sinds 0.6.1). De kamerpagina houdt het scherm van elke telefoon en tv zelf aan met een Screen Wake Lock. Ze vraagt het opnieuw aan na een tik of een toets, ook in je spel, en als het tabblad terugkomt. Je eigen `navigator.wakeLock`-code is daarom niet meer nodig; laten staan kan geen kwaad. Onder `me dev` doet de kamerpagina dit niet.

**Haal `author` uit je manifest** (sinds 0.6.1). De server zet `author` zelf, op de weergavenaam van het account dat het spel uploadde, en een `author` in het manifest wordt genegeerd. De naam staat als *door …* op de spelkaart.

**Vervang links naar `/home/spellen` door `/home/games`** (sinds 0.6.1). Alle adressen van Mini Engine zijn Engels. Het oude adres stuurt door, met de query erbij. Na het bewaren van een set opent `/home/sets/{id}?saved`; `?opgeslagen` werkt nog.

### Nieuw, als je wilt

| Sinds | Wat | Lees verder |
| --- | --- | --- |
| 0.6.0 | Spelkaarten op `/home` en `/home/games`: je icoon groot op een vlak in de kleur van de rand van de tegel, de eerste zin van `description` als ondertitel, en labels voor spelers, tv, eigen sets en achievements. De pagina voor een nieuwe kamer toont de hele beschrijving. | [Op de spelkaart](game-bouwen/package-en-manifest.md#op-de-spelkaart) |
| 0.6.0 | Op de accountpagina staan alle achievements van een spel als badges, ook die je nog niet hebt | [Achievements](concepten/achievements.md#server-of-spel) |
| CLI 0.6.0 | Startsjablonen, `me init`, `me doctor` en `me dev --lan` | [De me-CLI](publiceren/cli.md) |
| 0.6.1 | De naam van de maker op de spelkaart (`author`) | [GET /api/v1/games](api/games.md#get-api-v1-games) |
| 0.6.1 | Linkvoorbeelden en een deelafbeelding van je spel | [Linkvoorbeelden](publiceren/overzicht.md#linkvoorbeelden) |
| 0.6.3 | `?wake` achter de kamerlink toont of het scherm aan blijft, en sinds 0.6.5 ook de maat van het iframe | [Op een echte telefoon](game-bouwen/testen.md#op-een-echte-telefoon) |
| 0.6.4 | Een gedeelde link naar `/room/CODE/host` of `/room/CODE/player` opent bij een ander de pagina om mee te doen | [Een kamer op miniengine.nl](concepten/kamers-en-rollen.md#een-kamer-op-miniengine-nl) |

### Geen actie nodig

- 0.6.0 vernieuwde alleen de site. De API, de websocket, het manifest en het uploaden zijn gelijk gebleven.
- Manifests, kamers en sets uit 0.5 blijven geldig. Er zijn geen nieuwe verplichte velden.
- De client van de SDK is gelijk. SDK 0.6.0 heb je alleen nodig voor de types (`author`), de startsjablonen en de skills.
- In het iframe is `env(safe-area-inset-*)` 0. De kamerpagina houdt het iframe zelf vrij van de notch, de ronde hoeken en de thuisbalk. Een `max(12px, env(safe-area-inset-bottom))` in je CSS mag blijven staan.

### Checklist

1. De CLI, de skills en de types zijn bijgewerkt.
2. Er staat nergens meer `min-height: 100vh`, en de belangrijkste knop staat in beeld op 393×660 en 375×548.
3. Elke rolpagina heeft een `theme-color` voor licht en voor donker.
4. Het manifest heeft geen `author`; eigen scherm-aan-code is weg of mag blijven.
5. Links gaan naar `/home/games`, niet naar `/home/spellen`.
6. De rand van je icoontegel is effen en dekkend, en de eerste zin van `description` staat op zichzelf.
7. Je spel heeft een nieuwe `version`, is geüpload met `--activate` en getest op een echte telefoon, met `?wake` achter de kamerlink.

## Van 0.6 naar 0.7

Mini Engine 0.7.0 brengt uitgelichte spellen en zoeken, en Jeopardy is niet meer ingebouwd. Voor een eigen spel verandert er bijna niets. Er kwam geen nieuwe SDK: bij 0.7 hoort SDK 0.6.0. CLI 0.7.0 verandert niets aan de commando's die je gebruikt.

### Wat je moet doen

**Gebruik Jeopardy nergens meer.** Common Dice is nu het enige ingebouwde spel. De acties die de server voor Jeopardy afhandelde (`choose_team`, `buzz`, `select_clue`, `judge`, `reveal`, `reopen` en `close_clue`) en de foutcodes `buzzer_closed`, `teams_required`, `teams_locked` en `invalid_game_action` bestaan niet meer. Gebruikt een eigen client, script of test `game_id: 'jeopardy'`, of `listSets({ game_id: 'jeopardy' })`, stap dan over op Common Dice of op je eigen spel.

**Let bij de gamelimiet op de code, niet op de tekst.** Een account heeft standaard hoogstens 10 games, maar jouw limiet kan anders zijn. Zit je eraan, dan geeft de upload van een nieuw spel `409 quota_games`, met een melding als *Je hebt al 10 games. Verwijder er eerst een.* Een script dat op de tekst "10 games" let, laat je voortaan op `quota_games` letten. Nieuwe versies van een spel dat je al hebt, tellen niet mee. Heb je meer games nodig, vraag het dan aan wie de server beheert.

**Werk de CLI bij naar 0.7.0.** Met CLI 0.6.0 meldt `me doctor` een ✗ zolang er een nieuwere versie is.

**Lees je `GET /api/v1/games` zelf?** Het antwoord heeft naast `games` nu ook `featured`: de id's van hoogstens vier uitgelichte spellen, in hun volgorde. Er is alleen iets bijgekomen. De types van SDK 0.6.0 en 0.7.0 kennen `featured` nog niet. Zie [GET /api/v1/games](api/games.md#get-api-v1-games).

### Nieuw, als je wilt

- **Uitgelichte spellen.** De startpagina toont eerst de uitgelichte spellen en vult aan tot vier; op `/home/games` staan ze bovenaan. Wie de site beheert, kiest ze. Zelf stel je dat niet in.
- **Zoeken op `/home/games`.** Het zoekveld zoekt in de titel, de beschrijving, de naam van de maker en het id, zonder op hoofdletters of accenten te letten. De zoekopdracht staat in `?q=`, dus je kunt linken naar bijvoorbeeld `/home/games?q=quiz`. Zet in de titel en de beschrijving van je spel de woorden waarop mensen zoeken.
- **Het id `jeopardy` is vrij** voor een geüpload spel. `game_id_taken` geldt alleen nog voor `common-dice`.

### Geen actie nodig

- Het manifest, de regels voor uploads, kamers, de websocket, realtime, achievements en eigen sets zijn gelijk gebleven. Alleen de gamelimiet is nieuw.
- De SDK, de startsjablonen en de skills zijn gelijk. Je hoeft je spel niet opnieuw te uploaden.
- Sets voor Jeopardy blijven op **Mijn sets** staan, onder *Niet meer te spelen*. Spelers kunnen ze bekijken en verwijderen, maar er niet meer mee spelen.

### Checklist

1. Er staat geen `jeopardy` meer in je code, scripts, tests of voorbeelden.
2. Scripts letten op `quota_games`, niet op de tekst "10 games".
3. De CLI is 0.7.0 of nieuwer, en `me doctor` is groen.

## Van 0.7 naar 0.8

Mini Engine 0.8.0 brengt afbeeldingen in eigen sets: een speler zet bijvoorbeeld een foto bij een quizvraag, en je spel toont die. SDK 0.7.0 en CLI 0.8.0 horen erbij, ook bij 0.8.1. Mini Engine 0.8.1 geeft elk account een eigen [ruimte voor afbeeldingen](#ruimte-voor-afbeeldingen-sinds-0-8-1). Gebruikt je spel geen afbeeldingen, dan werk je alleen je gereedschap bij.

### Wat je moet doen

**Werk de CLI bij naar 0.8.0 en installeer de skills opnieuw**, zoals [hierboven](#je-gereedschap-bijwerken):

```sh
npm install -g github:Casb02/mini-engine-cli
me skill install --force
```

Een oudere CLI kent `"format": "image"` niet: `me dev` weigert dan je manifest, en `me dev --set` kent geen afbeeldingen. De nieuwe skills leren je AI-agent wat een afbeeldingsveld is, welke grenzen gelden en hoe een spel afbeeldingen toont.

**Haal de types uit SDK 0.7.0**, als je ze gebruikt:

```sh
curl -o types/mini-engine.d.ts https://raw.githubusercontent.com/Casb02/mini-engine-sdk/v0.7.0/types/mini-engine.d.ts
```

Daarin staan `format: 'image'` in `SetSchema`, en `uploadMedia`, `listMedia` en `deleteMedia` met de types `MediaItem`, `MediaUpload` en `MediaList`. Gebruik je het npm-pakket, installeer dan 0.7.0.

**Upload een spel met afbeeldingen pas als de server 0.8 draait.** Een oudere server weigert een soort set met een afbeeldingsveld. `me game upload` waarschuwt je daarvoor, en `me doctor` laat zien welke versie de server draait.

### Nieuw, als je wilt

| Sinds | Wat | Lees verder |
| --- | --- | --- |
| 0.8.0 | Afbeeldingsvelden in een soort set: `{ "type": "string", "format": "image" }` | [Afbeeldingen](concepten/eigen-sets.md#afbeeldingen) |
| 0.8.0 | Spelers uploaden afbeeldingen in het formulier op **Mijn sets**, met een voorbeeld, **Vervang** en **Verwijder** | [Afbeeldingen toevoegen](concepten/eigen-sets.md#afbeeldingen-toevoegen-op-mijn-sets) |
| 0.8.0 | Standaardplaatjes in `data.json`, als pad onder `assets/` | [Standaardplaatjes](concepten/eigen-sets.md#standaardplaatjes-in-data-json) |
| 0.8.0 | De routes onder `/api/v1/accounts/media` en `GET /media/{id}` | [Afbeeldingen in de API](api/accounts.md#afbeeldingen) |
| 0.8.1 | Ruimte voor afbeeldingen per account, `request` in `GET /api/v1/accounts/media` en `POST /api/v1/accounts/media/requests` om ruimte aan te vragen | [Ruimte voor afbeeldingen](api/accounts.md#ruimte-voor-afbeeldingen) |
| SDK 0.7.0 | `uploadMedia`, `listMedia` en `deleteMedia`; het startsjabloon `quiz` heeft een optionele afbeelding bij elke vraag | [ApiClient](sdk/api-client.md#afbeeldingen) |
| CLI 0.8.0 | `me dev --set` met afbeeldingen uit een map `media/`; `me doctor` controleert de afbeeldingen in `data.json` | [Afbeeldingen in een set testen](publiceren/cli.md#afbeeldingen-in-een-set-testen) |

Zo geef je je eigen soort set een afbeelding:

1. Zet een veld `{ "type": "string", "format": "image", "title": "Afbeelding" }` in het schema. Laat het buiten `required`, dan blijven de sets die spelers al maakten geldig. Maak je het verplicht, dan kunnen ze die sets niet meer kiezen of opslaan.
2. Toon de waarde met `<img src>`, en toon niets als het veld ontbreekt. Zie [afbeeldingen tonen in je spel](concepten/eigen-sets.md#afbeeldingen-tonen-in-je-spel).
3. Test het met `me dev --set` en een map `media/` naast het set-bestand.
4. Verhoog `version` en upload met `me game upload --activate`.

Maakte je een spel met het oude `quiz`-sjabloon? Daar is een eigen vragenlijst een lijst teksten, één vraag per regel. Het nieuwe sjabloon heeft een blok per vraag, met `question` en `image`. Neem je die vorm over, dan passen de vragenlijsten die spelers al maakten niet meer. Laat je hem zoals hij is, dan blijft je spel gewoon werken, zonder afbeeldingen.

### Ruimte voor afbeeldingen (sinds 0.8.1)

In 0.8.0 had elk account 250 MiB voor afbeeldingen. Sinds 0.8.1 hangt dat af van het account: een beheerder heeft 1 GiB, een account met een dev-key die nog werkt 250 MiB, en ieder ander eerst niets. Een speler vraagt ruimte aan op **Mijn sets**, en wie de server beheert beslist erover. Afbeeldingen die er al stonden, blijven staan en werken in sets, ook als de ruimte kleiner wordt.

- **Reken er niet op dat een speler kan uploaden.** Zonder ruimte geeft een upload `409 quota_media`. Laat een afbeeldingsveld buiten `required` en toon niets als het leeg is, zoals hierboven.
- **Lees `limit_bytes`, niet het getal 250 MiB.** Een eigen tool die de ruimte toont, gebruikt `limit_bytes` uit `listMedia` of `GET /api/v1/accounts/media`; dat kan 0 zijn.
- **Ruimte aanvragen gaat via de API.** SDK 0.7.0 heeft er geen methode voor; zie [`POST /api/v1/accounts/media/requests`](api/accounts.md#post-api-v1-accounts-media-requests). Eén keer per 7 dagen, anders `429 media_request_wait`.

Jouw eigen account heeft met een dev-key die nog werkt 250 MiB, dus `me dev --set` en je eigen sets testen gaan zoals in 0.8.0. `me dev` kijkt niet naar de ruimte.

### Geen actie nodig

- Spellen zonder afbeeldingen werken zoals in 0.7. Het manifest kreeg geen nieuwe velden, en manifests, kamers en sets uit 0.7 blijven geldig.
- De Content-Security-Policy van spellen staat afbeeldingen van de eigen origin al toe, en `/media/…` staat op die origin.
- Je spelpagina's laden de SDK van de server en hoeven niet te veranderen. De nieuwe methoden heb je alleen nodig in een eigen project.

### Checklist

1. De CLI is 0.8.0, de skills zijn opnieuw geïnstalleerd met `--force`, en `types/mini-engine.d.ts` komt uit SDK 0.7.0.
2. `me doctor` is groen, en meldt Mini Engine 0.8 op de server voordat je een spel met afbeeldingen uploadt.
3. Een optionele afbeelding staat buiten `required`, en je spel toont geen leeg of kapot plaatje als ze ontbreekt, ook voor spelers die (nog) geen ruimte voor afbeeldingen hebben.
4. Standaardplaatjes in `data.json` zijn paden onder `assets/` die in je spel staan.
5. Heb je iets aangepast, dan heeft je spel een nieuwe `version` en is het geüpload met `--activate`.
