---
title: Eigen sets
description: Eigen inhoud voor een spel, zoals een eigen vragenlijst voor een quiz. Wat een set is, set_kinds en het schemadialect, opslaan op je account, kiezen bij een nieuwe kamer, gameData en het formulier op Mijn sets.
section: SDK
group: Concepten
order: 10
toc_depth: 3
---

# Eigen sets

Sinds 0.5 kan een spel aangeven welke inhoud spelers zelf mogen maken: een eigen vragenlijst, een eigen kaartspel. Zo'n stuk inhoud heet een **set**. Je bewaart sets op je account en kiest er een als je een kamer maakt. De `quiz` uit de [startsjablonen](../publiceren/cli.md#startsjablonen) doet het voor: spelers maken er een eigen vragenlijst voor.

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
- dat de inhoud aan het schema voldoet en hoogstens 64 KiB is.

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

Op **Mijn sets** krijgt een soort set een formulier, als zijn schema dat toelaat: alleen tekst, getallen, aan/uit, lijsten met teksten en lijsten van kleine items. Een lijst met teksten is een tekstvak met één item per regel, met eronder hoeveel regels er zijn en wat mag. Voor eigen kaarten van een spel als Punchline typ je dus gewoon één vraag per regel. Een lijst van kleine items, zoals vragen met een antwoord en punten, krijgt een blok per item met *Toevoegen* en *Weghalen*. Gaat er iets mis, dan noemt de editor de plek in gewone woorden, zoals *Vragen, regel 13* of *Vraag 2, antwoord*, en zet hij de cursor daar. Een schema dat niet in het formulier past, krijgt een eenvoudige JSON-editor, met de foutmeldingen van de server. Het formulier is er sinds Mini Engine 0.5.3.

Kent je spel één soort set en kiest de maker *Maak een eigen set* op de pagina voor een nieuwe kamer, dan brengt opslaan hem daar terug, met de nieuwe set al gekozen. Een set verwijderen kan altijd; kamers die hem al gebruiken, spelen gewoon door.

### Een schema dat in het formulier past

- **Houd het plat.** Velden met tekst, getallen of aan/uit, een lijst met teksten, of een lijst van kleine objecten met zulke velden. Een object in een object, of een lijst in een lijst, valt terug op de JSON-editor.
- **Gebruik eenvoudige veldnamen**: 1 tot 64 tekens uit `A-Z`, `a-z`, `0-9`, `_` en `-` (sinds 0.5.4). Andere namen krijgen de JSON-editor.
- **Geef elk veld een `title` en, waar dat helpt, een `description`.** Het formulier gebruikt ze als label en uitleg.
- **Geef `items` een `title` in het enkelvoud**, zoals "Vraag" in een lijst "Vragen". Het formulier noemt er één item mee, ook in een foutmelding.
- **Zet de velden in `required` in de volgorde waarin mensen ze invullen.** Verplichte velden staan bovenaan, in die volgorde.
- **Kies grenzen die mensen begrijpen**, zoals `minItems` en `maxItems` voor het aantal regels en `maxLength` voor een tekst. Bij een lijst met teksten toont het formulier onder het tekstvak hoeveel regels er zijn en wat mag.

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

## Wie kan erbij?

Een set hoort bij je account. Spellen op dezelfde origin, ingebouwd of geüpload, kunnen met de accountsleutel uit je browser je sets lezen en wijzigen, net als je andere accountgegevens. Installeer daarom alleen spellen die je vertrouwt. Zie [wat een account niet beschermt](accounts.md#wat-een-account-niet-beschermt).
