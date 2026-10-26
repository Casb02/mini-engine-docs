---
title: Eigen sets
description: Eigen inhoud voor een spel, zoals een eigen vragenlijst voor een quiz. Wat een set is, set_kinds en het schemadialect, opslaan op je account, kiezen bij een nieuwe kamer, gameData, het formulier op Mijn sets en afbeeldingen in een set.
section: SDK
group: Concepten
order: 10
toc_depth: 3
---

# Eigen sets

Sinds 0.5 kan een spel aangeven welke inhoud spelers zelf mogen maken: een eigen vragenlijst, een eigen kaartspel. Zo'n stuk inhoud heet een **set**. Je bewaart sets op je account en kiest er een als je een kamer maakt. De `quiz` uit de [startsjablonen](../publiceren/cli.md#startsjablonen) doet het voor: spelers maken er een eigen vragenlijst voor. Sinds 0.8 kan een set ook [afbeeldingen](#afbeeldingen) bevatten, zoals een foto bij een vraag.

## Wat een set is

Een set is een JSON-document met een titel, bewaard op één account. Elke set hoort bij één spel en heeft een soort (`kind`), bijvoorbeeld `questions` bij een quiz. Het spel bepaalt in zijn manifest welke soorten er zijn en hoe ze eruitzien.

Een kamer met een set speelt met die set in plaats van de `data.json` van het spel. Sets zijn persoonlijk: je deelt ze niet met andere accounts, en ze zijn nergens openbaar te zien.

## set_kinds in het manifest

```json
"set_kinds": [
  {
    "id": "questions",
    "title": "Vragenlijst",
    "description": "Drie tot vijftig vragen, elk met een antwoord en punten.",
    "schema": { "type": "object", "properties": { "…": "…" }, "additionalProperties": false }
  }
]
```

| Veld | Regel |
| --- | --- |
| `set_kinds` | Optioneel, hoogstens 4 soorten per spel |
| `id` | 1 tot 48 tekens: kleine letters, cijfers, `_` of `-`, beginnend met een letter of cijfer. Uniek binnen het spel. |
| `title` | 1 tot 60 tekens, niet leeg, geen controletekens. Dit is de naam die spelers zien, zoals *Vragenlijst*. Kent je spel één soort, dan staat er op de [spelkaart](../game-bouwen/package-en-manifest.md#op-de-spelkaart) *Eigen* voor, in kleine letters: *Eigen vragenlijst*. |
| `description` | 1 tot 160 tekens, niet leeg, geen controletekens |
| `schema` | De vorm van een set, in het schemadialect hieronder |

`me dev`, `me game upload` en de server controleren dit, net als de rest van het manifest.

## Het schemadialect

Het schema van een set gebruikt een kleine, begrensde subset van JSON Schema. Dit dialect staat los van het [`settings_schema`](../game-bouwen/package-en-manifest.md#settings-schema), dat plat blijft.

Elk onderdeel van het schema heeft een `type`. Per type mogen alleen deze sleutels:

| `type` | Sleutels |
| --- | --- |
| `object` | `properties` (verplicht), `required`, `additionalProperties: false` (verplicht) |
| `array` | `items` (verplicht), `minItems`, `maxItems` |
| `string` | `minLength`, `maxLength`, `enum`; of alleen `format: "image"` voor een [afbeelding](#afbeeldingen) (sinds 0.8) |
| `integer`, `number` | `minimum`, `maximum` |
| `boolean` | geen |

Elk onderdeel mag daarnaast een `title` en `description` hebben, als tekst. Al het andere, zoals `$ref`, `default`, `pattern` of `oneOf`, wordt geweigerd.

| Regel | Grens |
| --- | --- |
| Diepte | Hoogstens 8 niveaus, de buitenste laag telt mee |
| Omvang | Hoogstens 256 onderdelen |
| `required` | Alleen namen uit `properties`, elk één keer |
| `minItems`, `maxItems`, `minLength`, `maxLength` | Gehele getallen van 0 of meer; het minimum is niet groter dan het maximum |
| `minLength`, `maxLength` | Geteld in tekens, niet in bytes |
| `enum` | Alleen bij `string`: een niet-lege lijst van hoogstens 256 unieke teksten, elk binnen de lengtegrenzen |
| `format` | Alleen bij `string`, en alleen `"image"`. Dan mogen `minLength`, `maxLength` en `enum` er niet bij |
| `minimum`, `maximum` | Getallen; het minimum is niet groter dan het maximum |

Het schema van een vragenlijst met een antwoord en punten per vraag:

```json
{
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "title": "Vragen",
      "minItems": 3,
      "maxItems": 50,
      "items": {
        "type": "object",
        "title": "Vraag",
        "properties": {
          "question": { "type": "string", "minLength": 1, "maxLength": 240, "title": "Vraag" },
          "answer": { "type": "string", "minLength": 1, "maxLength": 120, "title": "Antwoord" },
          "points": { "type": "integer", "minimum": 1, "maximum": 10, "title": "Punten" }
        },
        "required": ["question", "answer", "points"],
        "additionalProperties": false
      }
    }
  },
  "required": ["questions"],
  "additionalProperties": false
}
```

Past een set niet, dan noemt de fout het pad van het eerste probleem, bijvoorbeeld `questions[2].question: gebruik 1–240 tekens.` Een veld dat niet in het schema staat, geeft *dit veld is niet toegestaan*; een ontbrekend verplicht veld *dit veld ontbreekt*.

## Opslaan op je account

Spelers maken en bewerken sets op de pagina **Mijn sets** (`/home/sets`). Met de SDK kan dat ook, met [`createSet` en `updateSet`](../sdk/api-client.md#eigen-sets). Bij elke keer opslaan controleert de server:

- dat de **actieve** versie van het spel deze soort set kent;
- dat de inhoud aan het schema voldoet en hoogstens 64 KiB is;
- dat elke afbeelding een afbeelding van jouw account is, en dat de set er hoogstens 100 gebruikt, samen hoogstens 50 MiB (sinds 0.8).

| Grens | Waarde |
| --- | --- |
| Titel | 1 tot 80 tekens, zonder controletekens |
| Inhoud | Hoogstens 64 KiB als JSON |
| Sets per account | 50 (`409 quota_sets`) |
| Wijzigingen | 30 per minuut per IP-adres |

Voor sets heb je geen bevestigd e-mailadres nodig. Een set van een ander account bestaat voor jou niet: die geeft `404 set_not_found`.

Haalt een nieuwe versie van een spel een soort set weg, dan kun je bestaande sets van die soort niet meer kiezen of opslaan. Mijn sets toont ze dan onder *Niet meer te spelen*, zodat je ze nog kunt bekijken en verwijderen. Zo staan ook de sets voor Jeopardy erbij, dat sinds 0.7 niet meer ingebouwd is.

## Kiezen bij een nieuwe kamer

Op de pagina voor een nieuwe kamer (`/home/new/{id}`) staat een keuze als het spel sets kent en je bent ingelogd. Die heeft de titel van je soort set, of *Eigen set* bij meer soorten. Je kiest *Standaard* voor de `data.json` van het spel, of een van je eigen sets, en er is een link *Maak een eigen set*. Gasten zien een korte hint om in te loggen.

Met de SDK geef je `set_id` mee aan [`api.createRoom()`](../sdk/api-client.md#createroom-options), met een accountsleutel. De server controleert dat de set van dat account is, bij dit spel hoort en dat zijn soort voorkomt in de versie die de kamer krijgt. Daarna controleert hij de inhoud opnieuw tegen die versie.

- **De kamer krijgt een kopie.** Wijzig of verwijder je de set later, dan merkt een lopende kamer daar niets van. Net als de spelversie ligt de set vast voor de hele kamer. De kopie verdwijnt met de kamer.
- **Iedereen ziet welke set het is.** De snapshot heeft een veld `set` met `id`, `kind` en `title`, voor alle rollen, ook het scherm. Zo kan de lobby *Vragen: Dani's filmavond* tonen. De inhoud staat nooit in een snapshot.
- **Zonder set** is `set` gelijk aan `null` en speelt de kamer met `data.json`.

## De set in het spel

De host leest de set met dezelfde route als `data.json`:

```js
import { ApiClient } from '/sdk/mini-engine.js';

const content = await new ApiClient().gameData(client.code, client.token);
if (client.room.set) {
  // De set van de maker, in de vorm van de soort client.room.set.kind.
} else {
  // De data.json van je spel.
}
```

Heeft de kamer een set, dan geeft `gameData()` die set, precies zoals hij is opgeslagen. Anders geeft hij `data.json`. Alleen de host mag lezen. Geef je `data.json` dezelfde vorm als je soort set, dan werkt één stuk code voor allebei. Test het met `me dev --set bestand.json`.

## Het formulier voor je eigen soort set

Op **Mijn sets** krijgt een soort set een formulier, als zijn schema dat toelaat: alleen tekst, getallen, aan/uit, afbeeldingen, lijsten met teksten en lijsten van kleine items. Een lijst met teksten is een tekstvak met één item per regel, met eronder hoeveel regels er zijn en wat mag. Voor eigen kaarten van een spel als Punchline typ je dus gewoon één vraag per regel. Een lijst van kleine items, zoals vragen met een antwoord en punten, krijgt een blok per item met *Toevoegen* en *Weghalen*. Een afbeelding krijgt een eigen vak met een voorbeeld; zie [afbeeldingen toevoegen](#afbeeldingen-toevoegen-op-mijn-sets). Gaat er iets mis, dan noemt de editor de plek in gewone woorden, zoals *Vragen, regel 13* of *Vraag 2, antwoord*, en zet hij de cursor daar. Een schema dat niet in het formulier past, krijgt een eenvoudige JSON-editor, met de foutmeldingen van de server. Het formulier is er sinds Mini Engine 0.5.3.

Kent je spel één soort set en kiest de maker *Maak een eigen set* op de pagina voor een nieuwe kamer, dan brengt opslaan hem daar terug, met de nieuwe set al gekozen. Een set verwijderen kan altijd; kamers die hem al gebruiken, spelen gewoon door.

### Een schema dat in het formulier past

- **Houd het plat.** Velden met tekst, getallen, aan/uit of een afbeelding, een lijst met teksten, of een lijst van kleine objecten met zulke velden. Een object in een object, of een lijst in een lijst, valt terug op de JSON-editor.
- **Gebruik eenvoudige veldnamen**: 1 tot 64 tekens uit `A-Z`, `a-z`, `0-9`, `_` en `-` (sinds 0.5.4). Andere namen krijgen de JSON-editor.
- **Geef elk veld een `title` en, waar dat helpt, een `description`.** Het formulier gebruikt ze als label en uitleg.
- **Geef `items` een `title` in het enkelvoud**, zoals "Vraag" in een lijst "Vragen". Het formulier noemt er één item mee, ook in een foutmelding.
- **Zet de velden in `required` in de volgorde waarin mensen ze invullen.** Verplichte velden staan bovenaan, in die volgorde.
- **Kies grenzen die mensen begrijpen**, zoals `minItems` en `maxItems` voor het aantal regels en `maxLength` voor een tekst. Bij een lijst met teksten toont het formulier onder het tekstvak hoeveel regels er zijn en wat mag.
- **Zet een afbeelding in een item**, als veld naast de tekst waar ze bij hoort, zoals een foto bij elke vraag. Een lijst met alleen afbeeldingen wordt een tekstvak met één adres per regel, zonder knop om te uploaden.

Een soort set voor een lijst met eigen stellingen:

```json
{
  "id": "stellingen",
  "title": "Stellingen",
  "description": "Tien tot veertig stellingen om over te stemmen.",
  "schema": {
    "type": "object",
    "properties": {
      "stellingen": {
        "type": "array",
        "title": "Stellingen",
        "description": "Eén stelling per regel.",
        "minItems": 10,
        "maxItems": 40,
        "items": { "type": "string", "title": "Stelling", "minLength": 1, "maxLength": 120 }
      }
    },
    "required": ["stellingen"],
    "additionalProperties": false
  }
}
```

## Afbeeldingen

Sinds Mini Engine 0.8 kan een set afbeeldingen bevatten, zoals een foto bij een quizvraag of een plaatje op een vragenbord. Een afbeelding hoort bij het account dat haar uploadde, en de set verwijst ernaar met haar adres. Je spel toont haar met een gewone `<img>`.

### Een afbeeldingsveld

Een tekstveld met `"format": "image"` is een afbeelding. Daar horen geen `minLength`, `maxLength` of `enum` bij. Een optionele afbeelding laat je uit `required`. Een lege tekst is geen afbeelding: een optioneel veld zonder afbeelding laat je weg.

Een soort set voor een vragenbord zoals bij Jeopardy, met per vraag een categorie, punten, een antwoord en eventueel een afbeelding:

```json
{
  "id": "bord",
  "title": "Vragenbord",
  "description": "Vijf tot dertig vragen in categorieën, met punten en eventueel een afbeelding.",
  "schema": {
    "type": "object",
    "properties": {
      "vragen": {
        "type": "array",
        "title": "Vragen",
        "minItems": 5,
        "maxItems": 30,
        "items": {
          "type": "object",
          "title": "Vraag",
          "properties": {
            "categorie": { "type": "string", "minLength": 1, "maxLength": 40, "title": "Categorie" },
            "punten": { "type": "integer", "minimum": 100, "maximum": 500, "title": "Punten" },
            "vraag": { "type": "string", "minLength": 1, "maxLength": 200, "title": "Vraag" },
            "antwoord": { "type": "string", "minLength": 1, "maxLength": 80, "title": "Antwoord" },
            "afbeelding": { "type": "string", "format": "image", "title": "Afbeelding", "description": "Optioneel. Staat bij de vraag op het scherm." }
          },
          "required": ["categorie", "punten", "vraag", "antwoord"],
          "additionalProperties": false
        }
      }
    },
    "required": ["vragen"],
    "additionalProperties": false
  }
}
```

Een set van deze soort ziet er zo uit. De eerste vraag heeft een afbeelding, de tweede niet:

```json
{
  "vragen": [
    { "categorie": "Dieren", "punten": 100, "vraag": "Welk dier is dit?", "antwoord": "Een okapi", "afbeelding": "/media/3f9c0b6e2a7d4c1e8b5a9f0d6e2c4a71" },
    { "categorie": "Dieren", "punten": 200, "vraag": "Hoeveel poten heeft een spin?", "antwoord": "Acht" }
  ]
}
```

In een bewaarde set is de waarde van een afbeelding altijd `/media/<id>`: het adres van een afbeelding die hetzelfde account uploadde, met een id van 32 tekens `0-9a-f`. Iets anders weigert de server bij het opslaan met `400 invalid_request` en het pad van het veld, zoals `vragen[0].afbeelding: verwacht een afbeelding.` Een afbeelding van een ander account, of een die er niet meer is, geeft `vragen[0].afbeelding: deze afbeelding bestaat niet (meer). Kies hem opnieuw.`

### Afbeeldingen toevoegen op Mijn sets

In het formulier op **Mijn sets** krijgt een afbeeldingsveld een eigen vak: een voorbeeld van de afbeelding, of een lege tegel, met de knop **Kies een afbeelding**. Het gekozen bestand gaat meteen naar je account. Daarna staan er **Vervang** en **Verwijder**. **Verwijder** haalt de afbeelding alleen uit het veld; de server ruimt haar later zelf op (zie [opruimen](#opruimen)). De pagina toont hoeveel ruimte je afbeeldingen innemen, zoals *12,3 MB van 250 MB gebruikt voor afbeeldingen*. Gaat er iets mis, zoals een bestand dat te groot is, dan staat de melding van de server bij het veld.

Past je schema niet in het formulier, dan heeft de JSON-editor een apart vak **Afbeelding toevoegen**. Upload daar een afbeelding, en zet het adres dat verschijnt als waarde bij een afbeeldingsveld.

Met de SDK upload je een afbeelding met [`uploadMedia`](../sdk/api-client.md#afbeeldingen). Het antwoord heeft `media.url`, de waarde voor het veld.

### Wat de server met een afbeelding doet

De server herkent een PNG, JPEG, WebP of GIF aan de inhoud van het bestand, niet aan de naam of het `Content-Type`. Van een GIF blijft alleen het eerste beeld over. SVG, HEIC en andere formaten weigert hij.

Daarna zet hij een telefoonfoto rechtop, verkleint hij de afbeelding tot hoogstens 1920 pixels aan de lange kant en slaat hij haar opnieuw op: als PNG als ze echt doorzichtige delen heeft, anders als JPEG. Een kleinere afbeelding maakt hij nooit groter. Is het resultaat nog groter dan 1 MiB, dan verlaagt hij eerst de kwaliteit en daarna de afmetingen, tot het past. Metadata zoals EXIF en de GPS-locatie van een foto gaan daarbij verloren.

### Grenzen voor afbeeldingen

| Grens | Waarde |
| --- | --- |
| Formaten | PNG, JPEG, WebP en GIF (alleen het eerste beeld); geen SVG of HEIC |
| Eén upload | Hoogstens 10 MiB en 40 miljoen pixels |
| Opgeslagen afbeelding | Hoogstens 1920 pixels aan de lange kant, nooit vergroot, hoogstens 1 MiB en zonder metadata |
| Per account | 250 MiB aan afbeeldingen samen |
| Per set | Hoogstens 100 verschillende afbeeldingen, samen hoogstens 50 MiB |
| Uploads | 60 per minuut per IP-adres |

De foutcodes staan bij [de accountroutes](../api/accounts.md#afbeeldingen).

### Opruimen

Een afbeelding die geen van je sets gebruikt en die ouder is dan 24 uur, verwijdert de server bij je volgende upload of de volgende keer dat je een set opslaat. Een afbeelding in de kopie van een set in een kamer blijft staan, zodat een lopende kamer haar niet kwijtraakt. Upload je een afbeelding, bewaar haar dan binnen een dag in een set.

### Standaardplaatjes in data.json

Geef je `data.json` dezelfde vorm als je soort set, dan kan je spel ook zonder eigen set afbeeldingen tonen. In `data.json` is de waarde van een afbeelding het pad van een bestand in je package, onder `assets/`: relatief en zonder `..`.

```json
{
  "vragen": [
    { "categorie": "Dieren", "punten": 100, "vraag": "Welk dier is dit?", "antwoord": "Een okapi", "afbeelding": "assets/bord/okapi.jpg" }
  ]
}
```

Mini Engine controleert `data.json` niet tegen je soort set; houd die paden dus zelf goed. `me dev` waarschuwt en `me doctor` meldt het als zo'n afbeelding geen pad onder `assets/` is, of niet in je spel staat. Bestanden in `assets/` zijn openbaar, net als de rest van je package: wie het pad kent, ziet het plaatje.

### Afbeeldingen tonen in je spel

Een afbeelding komt in `gameData()` binnen als tekst: `/media/…` uit een eigen set, `assets/…` uit je `data.json`. Toon haar met een gewone `<img>`. `/media/…` staat op dezelfde origin als je spel, en de Content-Security-Policy van spellen staat `img-src 'self'` toe. `/media/…` vraagt geen inlog, dus ook gasten en het gedeelde scherm laden de afbeelding.

Een `assets/`-pad is relatief aan je package. Reken het om vanaf je eigen module, net als een [relatieve import](../publiceren/versies.md); dan klopt het ook voor een kamer die een oudere versie van je spel speelt.

```js
// assets/app.js
/** /media/… blijft zoals het is; assets/… komt uit de map van dit bestand. */
const imageSrc = (value) =>
  value.startsWith('assets/') ? new URL(value.slice('assets/'.length), import.meta.url).href : value;

const picture = document.querySelector('#picture'); // <img id="picture" alt="" hidden>
picture.hidden = !vraag.afbeelding;
if (vraag.afbeelding && picture.getAttribute('src') !== imageSrc(vraag.afbeelding)) {
  picture.src = imageSrc(vraag.afbeelding);
}
```

- **Controleer de waarde één keer**, net als de rest van de inhoud: neem alleen een tekst over die begint met `/media/` of `assets/`.
- **Een optioneel veld kan ontbreken.** Toon de vraag dan zonder afbeelding, niet met een leeg of kapot plaatje.
- **Zet `src` alleen als het adres verandert.** Anders begint het laden bij elke snapshot opnieuw.
- **Geef de afbeelding een vaste ruimte**, zoals `max-width: 100%; max-height: 40vh; object-fit: contain`, en meer ruimte op het gedeelde scherm. Een afbeelding van 1 MiB heeft op een telefoon even nodig: laat spelers daar niet op wachten om te antwoorden.
- **Verraadt een afbeelding het antwoord**, zet haar adres dan pas in `public_state` als iedereen haar mag zien.

De `quiz` uit de [startsjablonen](../publiceren/cli.md#startsjablonen) doet het voor, met een optionele afbeelding bij elke vraag.

### Testen met me dev

Met `me dev --set` test je een set met afbeeldingen op je eigen computer. Zet de bestanden in een map `media/` naast het set-bestand en schrijf in de set `/media/<bestandsnaam>`, zoals `"/media/okapi.jpg"`. Zie [afbeeldingen in een set testen](../publiceren/cli.md#afbeeldingen-in-een-set-testen).

## Wie kan erbij?

Een set hoort bij je account. Spellen op dezelfde origin, ingebouwd of geüpload, kunnen met de accountsleutel uit je browser je sets lezen en wijzigen, net als je andere accountgegevens. Installeer daarom alleen spellen die je vertrouwt. Zie [wat een account niet beschermt](accounts.md#wat-een-account-niet-beschermt).

Afbeeldingen zijn openbaar voor wie hun adres kent: `/media/<id>` vraagt geen inlog, zodat gasten in een kamer ze kunnen zien. Het id is willekeurig en niet te raden, maar zodra een spel een afbeelding toont, staat haar adres in de spelstand. Zet in een set dus geen afbeeldingen die geheim moeten blijven.
