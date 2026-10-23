---
title: Eigen sets
description: Eigen inhoud voor een spel, zoals een eigen Jeopardy-bord. Wat een set is, set_kinds en het schemadialect, opslaan op je account, kiezen bij een nieuwe kamer, gameData en de boardeditor.
section: SDK
group: Concepten
order: 10
toc_depth: 3
---

# Eigen sets

Sinds 0.5 kan een spel aangeven welke inhoud spelers zelf mogen maken: een eigen vragenbord, een eigen kaartspel. Zo'n stuk inhoud heet een **set**. Je bewaart sets op je account en kiest er een als je een kamer maakt. Jeopardy is het eerste spel dat het gebruikt: je maakt er je eigen bord voor.

## Wat een set is

Een set is een JSON-document met een titel, bewaard op één account. Elke set hoort bij één spel en heeft een soort (`kind`), bijvoorbeeld `board` bij Jeopardy. Het spel bepaalt in zijn manifest welke soorten er zijn en hoe ze eruitzien.

Een kamer met een set speelt met die set in plaats van de `data.json` van het spel. Sets zijn persoonlijk: in 0.5 deel je ze niet met andere accounts en zijn ze nergens openbaar te zien.

## set_kinds in het manifest

```json
"set_kinds": [
  {
    "id": "board",
    "title": "Vragenbord",
    "description": "Eén tot zes categorieën met elk vijf vragen.",
    "schema": { "type": "object", "properties": { "…": "…" }, "additionalProperties": false }
  }
]
```

| Veld | Regel |
| --- | --- |
| `set_kinds` | Optioneel, hoogstens 4 soorten per spel |
| `id` | 1 tot 48 tekens: kleine letters, cijfers, `_` of `-`, beginnend met een letter of cijfer. Uniek binnen het spel. |
| `title` | 1 tot 60 tekens, niet leeg, geen controletekens. Dit is de naam die spelers zien, zoals *Vragenbord*. |
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
| `string` | `minLength`, `maxLength`, `enum` |
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
| `minimum`, `maximum` | Getallen; het minimum is niet groter dan het maximum |

Het schema van het Jeopardy-bord, iets ingekort:

```json
{
  "type": "object",
  "properties": {
    "categories": {
      "type": "array",
      "title": "Categorieën",
      "minItems": 1,
      "maxItems": 6,
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string", "minLength": 1, "maxLength": 40, "title": "Categorie" },
          "clues": {
            "type": "array",
            "minItems": 5,
            "maxItems": 5,
            "items": {
              "type": "object",
              "properties": {
                "question": { "type": "string", "minLength": 1, "maxLength": 240, "title": "Vraag" },
                "answer": { "type": "string", "minLength": 1, "maxLength": 240, "title": "Antwoord" }
              },
              "required": ["question", "answer"],
              "additionalProperties": false
            }
          }
        },
        "required": ["title", "clues"],
        "additionalProperties": false
      }
    }
  },
  "required": ["categories"],
  "additionalProperties": false
}
```

Past een set niet, dan noemt de fout het pad van het eerste probleem, bijvoorbeeld `categories[0].clues[2].question: gebruik 1–240 tekens.` Een veld dat niet in het schema staat, geeft *dit veld is niet toegestaan*; een ontbrekend verplicht veld *dit veld ontbreekt*.

## Opslaan op je account

Spelers maken en bewerken sets op de pagina **Mijn sets** (`/home/sets`). Met de SDK kan dat ook, met [`createSet` en `updateSet`](../sdk/api-client.md#eigen-sets). Bij elke keer opslaan controleert de server:

- dat de **actieve** versie van het spel deze soort set kent;
- dat de inhoud aan het schema voldoet en hoogstens 64 KiB is;
- de eigen regels van een ingebouwd spel. Jeopardy wil unieke categorienamen (hoofdletters tellen niet) en geen vragen of antwoorden met alleen spaties.

| Grens | Waarde |
| --- | --- |
| Titel | 1 tot 80 tekens, zonder controletekens |
| Inhoud | Hoogstens 64 KiB als JSON |
| Sets per account | 50 (`409 quota_sets`) |
| Wijzigingen | 30 per minuut per IP-adres |

Voor sets heb je geen bevestigd e-mailadres nodig. Een set van een ander account bestaat voor jou niet: die geeft `404 set_not_found`.

Haalt een nieuwe versie van een spel een soort set weg, dan kun je bestaande sets van die soort niet meer kiezen of opslaan. Mijn sets toont ze dan onder *Niet meer te spelen*, zodat je ze nog kunt bekijken en verwijderen.

## Kiezen bij een nieuwe kamer

Op de pagina voor een nieuwe kamer (`/home/new/{id}`) staat een keuzelijst als het spel sets kent en je bent ingelogd. Bij Jeopardy heet die *Vragenbord*, met *Standaardbord* en je eigen borden, en een link *Maak een eigen bord*. Gasten zien een korte hint om in te loggen.

Met de SDK geef je `set_id` mee aan [`api.createRoom()`](../sdk/api-client.md#createroom-options), met een accountsleutel. De server controleert dat de set van dat account is, bij dit spel hoort en dat zijn soort voorkomt in de versie die de kamer krijgt. Daarna controleert hij de inhoud opnieuw tegen die versie.

- **De kamer krijgt een kopie.** Wijzig of verwijder je de set later, dan merkt een lopende kamer daar niets van. Net als de spelversie ligt de set vast voor de hele kamer. De kopie verdwijnt met de kamer.
- **Iedereen ziet welke set het is.** De snapshot heeft een veld `set` met `id`, `kind` en `title`, voor alle rollen, ook het scherm. Zo kan de lobby *Bord: Dani's filmavond* tonen. De inhoud staat nooit in een snapshot.
- **Zonder set** is `set` gelijk aan `null` en speelt de kamer met `data.json`.

## De set in het spel

Bij een **ingebouwd spel** gebruikt de server de set in plaats van `data.json`. Jeopardy maakt van een bord vragen van 100 tot 500 punten per rij, met id's als `c2-300`: kolom 2, 300 punten.

Bij een **eigen spel** leest de host de set met dezelfde route als `data.json`:

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

## De Jeopardy-editor

Een Jeopardy-bord als set ziet er zo uit:

```json
{
  "categories": [
    {
      "title": "Films",
      "clues": [
        { "question": "Welke film won in 1998 elf Oscars?", "answer": "Titanic." },
        { "question": "…", "answer": "…" }
      ]
    }
  ]
}
```

Eén tot zes categorieën, elk met precies vijf vragen. Waarden en id's zet je er niet in; die komen erbij als de kamer start.

Op **Mijn sets** zie je je sets per spel. *Nieuw vragenbord* opent een raster: een kolom per categorie, met vijf vakken van 100 tot 500 punten, elk met een vraag en een antwoord. Je voegt categorieën toe of haalt ze weg. Bij opslaan gelden dezelfde regels als bij de SDK. Gaat er iets mis, dan noemt de editor de plek in gewone woorden, zoals *Categorie 2, vraag voor 300*, en zet hij de cursor in dat vak.

Kom je via *Maak een eigen bord* op de pagina voor een nieuwe kamer, dan brengt opslaan je daar terug, met je nieuwe bord al gekozen. Een set verwijderen kan altijd; kamers die hem al gebruiken, spelen gewoon door.

## Het formulier voor je eigen soort set

Andere soorten sets krijgen een formulier, als hun schema dat toelaat: alleen tekst, getallen, aan/uit, lijsten met teksten en lijsten van kleine items. Een lijst met teksten is een tekstvak met één item per regel, met eronder hoeveel regels er zijn en wat mag. Voor eigen kaarten van een spel als Punchline typ je dus gewoon één vraag per regel. Een lijst van kleine items, zoals vragen met een antwoord en punten, krijgt een blok per item met *Toevoegen* en *Weghalen*. Gaat er iets mis, dan noemt de editor de plek in gewone woorden, zoals *Vragen, regel 13* of *Vraag 2, antwoord*, en zet hij de cursor daar. Een schema met geneste objecten krijgt een eenvoudige JSON-editor, met de foutmeldingen van de server. Het formulier is er sinds Mini Engine 0.5.3.

### Een schema dat in het formulier past

- **Houd het plat.** Velden met tekst, getallen of aan/uit, een lijst met teksten, of een lijst van kleine objecten met zulke velden. Een object in een object, of een lijst in een lijst, valt terug op de JSON-editor.
- **Geef elk veld een `title` en, waar dat helpt, een `description`.** Het formulier gebruikt ze als label en uitleg.
- **Geef `items` een `title` in het enkelvoud**, zoals "Vraag" in een lijst "Vragen". Het formulier noemt er één item mee, ook in een foutmelding.
- **Zet de velden in `required` in de volgorde waarin mensen ze invullen.** Verplichte velden staan bovenaan, in die volgorde.
- **Kies grenzen die mensen begrijpen**, zoals `minItems` en `maxItems` voor het aantal regels en `maxLength` voor een tekst. Bij een lijst met teksten toont het formulier onder het tekstvak hoeveel regels er zijn en wat mag.

Een soort set voor een lijst met eigen stellingen:

```json
{
  "id": "stellingen",
  "title": "Eigen stellingen",
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

## Wie kan erbij?

Een set hoort bij je account. Spellen op dezelfde origin, ingebouwd of geüpload, kunnen met de accountsleutel uit je browser je sets lezen en wijzigen, net als je andere accountgegevens. Installeer daarom alleen spellen die je vertrouwt. Zie [wat een account niet beschermt](accounts.md#wat-een-account-niet-beschermt).
