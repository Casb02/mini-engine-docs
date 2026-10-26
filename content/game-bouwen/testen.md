---
title: Testen
description: Een eigen spel testen, eerst op je eigen computer met me dev en daarna als testversie op de server met telefoons, plus een checklist en geautomatiseerde controles.
section: SDK
group: Aan de slag
order: 3
---

# Testen

Een spel voor een hele tafel test je met een hele tafel: minimaal een spelleider, twee spelers en een gedeeld scherm. Begin op je eigen computer met `me dev`. Speel het daarna als testversie op de server, met echte telefoons.

## Eerst met `me dev`

`me dev` uit de [CLI](../publiceren/cli.md#me-dev) bootst Mini Engine na op je eigen computer. Vanuit de map van je spel:

```sh
me dev --players 3
```

`me dev` controleert eerst je `manifest.json` zoals `me game upload` dat doet, en opent dan één overzicht met de spelleider, het gedeelde scherm en de spelers naast elkaar. Elke stoel draait op een eigen poort en heeft dus een eigen sessie, net als een eigen telefoon. Sla je een bestand op, dan laden de stoelen opnieuw en blijft de kamer bestaan. Kamers, klaar zijn, state met versies, acties, realtime, achievements en game-data werken zoals online. Met `--set` krijgt de game een [eigen set](../concepten/eigen-sets.md) in plaats van `data.json`.

De kamer krijgt de `default_host_mode` uit je manifest. Wil je `tv` of `moderator` proberen, zet die dan even als standaard en kies **Nieuwe kamer**.

`me dev` is er voor games met `runtime: "host"` en luistert standaard alleen op je eigen computer. Met `me dev --lan` doen ook telefoons op hetzelfde wifi mee: ze openen het adres dat `me dev` toont, of scannen de QR-code in het overzicht, en kiezen een naam. Gebruik dat alleen op een netwerk dat je vertrouwt. Het blijft een nabootsing. Speel je spel daarom voor een avond met vrienden ook een keer als testversie op de server.

## Daarna als testversie op de server

Daarvoor heb je een dev-key nodig; zie [je game publiceren](../publiceren/overzicht.md). Log één keer in met `me auth`. Kijk met `me doctor` of alles klaarstaat, en upload vanuit de map van je spel:

```sh
me doctor
me game upload
```

- **De eerste upload van een nieuw spel is meteen live.** Het staat dan voor iedereen op de startpagina van die server.
- **Latere versies worden pas actief met `--activate`**, of later met `me game activate`. Verhoog eerst `version` in `manifest.json`; een versie overschrijven kan niet. Nieuwe kamers krijgen de actieve versie, lopende kamers houden de hunne. Ging er iets mis, activeer dan de vorige versie. Zie [versies en kamers](../publiceren/versies.md).
- Wil je testen zonder dat je echte spel verandert, upload dan een kopie met een eigen `id` in `manifest.json`, zoals `mijn-spel-test`. Ook die is meteen live. Zet hem na het testen uit met `me game disable mijn-spel-test`, of verwijder hem met `me game delete mijn-spel-test`.

Na de upload toont de CLI het adres om een kamer te maken, zoals `https://miniengine.nl/home/new/mijn-spel`. Maak daar een kamer en laat anderen meedoen met de code of de QR-code. Wie de kamer maakte, opent het gedeelde scherm via **Kamer** → **Open het gedeelde scherm**. Heb je geen telefoons bij de hand: kamersleutels staan per browsertabblad, dus elk privévenster is een eigen deelnemer. Een gedupliceerd tabblad is dezelfde deelnemer. Meer over de pagina's van een kamer staat bij [kamers en rollen](../concepten/kamers-en-rollen.md#een-kamer-op-miniengine-nl).

## Op een echte telefoon

Een paar dingen doet alleen de kamerpagina van de server, niet `me dev`: het scherm aanhouden (sinds 0.6.1), het iframe zo groot maken als het zichtbare deel van het venster en de `theme-color` van je spel overnemen (sinds 0.6.5). Test die op een echte telefoon, met je spel als testversie op de server.

Zet daarvoor `?wake` achter de kamerlink, bijvoorbeeld `https://miniengine.nl/room/HWKRTZ/player?wake`. De pagina toont dan onderaan een regel met de status van het scherm-aan-slot en van het stille filmpje dat als reserve dient, en sinds 0.6.5 ook de maat van het iframe en van het zichtbare deel. Op een iPhone 15 of 16 in Safari is het zichtbare deel ongeveer 393×660, op een iPhone SE ongeveer 375×548. Zie [op een telefoon](rolpaginas.md#op-een-telefoon).

## Checklist

**Klaarzetten en rondes**

- Starten lukt pas als iedereen klaarstaat.
- Afronden en terug naar de lobby reset klaarstatus en spelstand.
- Een tweede ronde werkt net zo goed als de eerste.
- Speelt de maker mee, dan staat diens plek klaar zonder knop, telt de zet van de maker net zo goed als die van anderen, en ziet de hostpagina eruit als de telefoon van een speler.
- Biedt je spel `tv` aan: maak ook een kamer als TV. Toont de hostpagina het scherm, heeft de tv geen plek, en start het spel vanaf de tv?
- Bij beurten: zet een telefoon op slot tijdens de eigen beurt. Na 30 seconden hoort die beurt over te slaan.
- Biedt je spel ook `moderator` aan: speel ook een ronde waarin de maker alleen leidt.

**Later aansluiten**

- Als je spel `supports_late_join: false` heeft: een speler kan tijdens het spel niet meer instromen.
- Als het wel mag: een late speler krijgt een bruikbare weergave midden in een ronde.

**Wegvallen en terugkomen**

- Ververs een spelerspagina midden in een ronde: de stand is er meteen weer.
- Zet een telefoon even op slot en open hem weer.
- Sluit het spelleiderstabblad en open het opnieuw. Spelers wachten zolang; acties geven `host_offline`.
- Laat een speler midden in een ronde vertrekken. De volgende `setState` mag daar niet op mislukken.

**Conflicten**

- Druk snel achter elkaar op knoppen van de spelleider en laat spelers tegelijk een actie sturen. Je wachtrij moet `version_conflict` voorkomen.

**Privacy**

- Speler A ziet nooit de `private_state` van speler B.
- Het gedeelde scherm toont geen geheime gegevens.
- Antwoorden staan pas in `public_state` na een expliciete onthulling.

**Ongeldige invoer**

- Stuur een actie met verkeerde data vanuit de browserconsole. De host moet haar negeren of weigeren.

**Telefoonschermen**

- Bekijk de spelerspagina op een smal scherm (360 pixels breed) zonder horizontaal scrollen.
- Op 393×660 en 375×548 staat de belangrijkste knop in beeld zonder te scrollen, en valt er niets onder de werkbalk van de browser.
- De strook rond de werkbalk heeft de kleur van je spel, in licht en in donker.
- Laat een telefoon een paar minuten liggen tijdens het spel: het scherm blijft aan.
- Is het gedeelde scherm leesbaar vanaf de bank?
- Scan de QR-code op het gedeelde scherm en achter **Toon QR** met een telefoon: je komt op de pagina om mee te doen.
- Een klik op de kamercode kopieert de uitnodigingslink.
- De instellingen staan als tekst op de pagina's, zonder knoppen om ze te wijzigen.

## Geautomatiseerde controles

In de map van je spel:

```sh
npx -p typescript tsc -p jsconfig.json   # typecontrole van je spelcode
node --test tests/*.test.mjs             # spelregels, als pure functies in assets/logic.js
```

Zet je tests in `tests/`: `me game upload` laat die map thuis.

Een hele kamer bespeel je met `scripts/play.mjs` uit de skill `build-mini-engine-game` in de SDK (zie [bouwen met AI](../ai/bouwen-met-ai.md)). Het script maakt een kamer, laat spelleider, spelers en scherm elk in een eigen browsercontext meedoen via Playwright, en maakt schermafbeeldingen in telefoon- en tv-formaat. Kopieer het naar `tests/play.mjs`, vervang het stuk dat bij het stemspel hoort door de stappen van jouw spel, en:

```sh
npm install --no-save playwright         # eenmalig; me dev en me game upload slaan node_modules over
npx playwright install chromium          # eenmalig
me dev --no-open                         # in een tweede terminal
node tests/play.mjs                      # standaard tegen me dev op http://127.0.0.1:3170
```

De schermafbeeldingen komen in `tests/`. Tegen de server werkt hetzelfde script, zodra je spel daar actief is: `node tests/play.mjs https://miniengine.nl`. Het maakt dan een echte kamer. Opmaak en WebGL beoordeel je met de schermafbeeldingen of in een echte browser.
