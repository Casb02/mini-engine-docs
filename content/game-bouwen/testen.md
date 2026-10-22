---
title: Testen op meerdere apparaten
description: Een eigen spel testen, eerst snel lokaal met me dev en dan op een echte engine met spelleider, twee spelers en een gedeeld scherm, plus de geautomatiseerde controles van de SDK.
section: Een game bouwen
order: 5
---

# Testen op meerdere apparaten

Een spel voor een hele tafel test je met een hele tafel. Je hebt minimaal een spelleider, twee spelers en een gedeeld scherm nodig. Dat kan in één browser met losse vensters, maar test ook een paar keer op echte telefoons.

## Eerst lokaal met `me dev`

De snelste manier om te testen is `me dev` uit de [CLI](../publiceren/cli.md#me-dev), sinds CLI 0.5.0. Je hebt er geen engine voor nodig:

```sh
cd mijn-spel
me dev --players 3
```

`me dev` controleert eerst je `manifest.json` en opent dan één overzicht met de spelleider, het gedeelde scherm en de spelers naast elkaar. Elke stoel draait op een eigen poort en heeft dus een eigen sessie, net als een eigen telefoon. Sla je een bestand op, dan laden de stoelen opnieuw en blijft de kamer bestaan; herstarten hoeft niet. Hij bootst kamers, klaar zijn, state met versies, acties, realtime, achievements en game-data na. Met `--set` krijgt de game een [eigen set](../concepten/eigen-sets.md) in plaats van `data.json`.

`me dev` is er voor games met `runtime: "host"`, luistert alleen op je eigen computer en blijft een nabootsing van de engine. Speel je spel daarom voor een avond met vrienden ook een keer op een echte server: op een engine op je eigen netwerk, zoals hieronder, of als testversie via `me game upload`.

## Op een echte engine

1. Start de engine op je netwerk: `MINI_ENGINE_BIND=0.0.0.0:3000 cargo run`.
2. Open `http://<LAN-IP>:3000/home` op je computer en maak een kamer.
3. Doe mee met twee telefoons, of met twee privévensters. Kamersleutels staan in `sessionStorage` per tabblad, dus elk tabblad is een eigen deelnemer.
4. Open het gedeelde scherm vanuit de spelleiderspagina.

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
- Sluit het spelleiderstabblad en open het opnieuw. Bij een eigen spel wachten spelers zolang; acties geven `host_offline`.
- Herstart de engine. Opgeslagen state en sleutels blijven, aanwezigheid begint offline en apparaten verbinden opnieuw.

**Conflicten**

- Druk snel achter elkaar op knoppen van de spelleider en laat spelers tegelijk een actie sturen. Je wachtrij moet `version_conflict` voorkomen.

**Privacy**

- Speler A ziet nooit de `private_state` van speler B.
- Het gedeelde scherm toont geen geheime gegevens.
- Antwoorden staan pas in `public_state` na een expliciete onthulling.

**Ongeldige invoer**

- Stuur een actie met verkeerde data vanuit de browserconsole. De host moet haar negeren of weigeren.
- Probeer instellingen buiten het schema. De engine weigert ze met `400`.

**Telefoonschermen**

- Bekijk de spelerspagina op een smal scherm (360 pixels breed) zonder horizontaal scrollen.
- Is het gedeelde scherm leesbaar vanaf de bank?
- Scan de QR-code op het gedeelde scherm en achter **Toon QR** met een telefoon: je komt op de pagina om mee te doen.
- Een klik op de kamercode kopieert de uitnodigingslink.
- De instellingen staan als tekst op de pagina's, zonder knoppen om ze te wijzigen.

## Geautomatiseerde controles

In de SDK-checkout:

```sh
npm run check         # typecontrole, build, strikte TypeScript-consumer, tests
npm run test:package  # tarball maken, installeren, CLI draaien
```

Een optionele test speelt het gegenereerde stemspel tegen een echte engine. Bouw eerst de engine met `cargo build`, dan:

```sh
MINI_ENGINE_CHECKOUT=/absoluut/pad/naar/mini-engine npm run test:engine
```

Die test start een geïsoleerde engine met een tijdelijke database, laadt het gegenereerde package via de echte catalogus en draait alle drie de rolscripts in een DOM-harnas met echte websockets. Hij controleert klaarzetten, starten, gelijktijdige stemmen, gedeelde totalen en een nieuwe ronde. Opmaak en WebGL test je daarmee niet; daarvoor blijft een echte browser nodig.

De engine zelf heeft een Playwright-suite die met echte HTTP en websockets meerdere rollen, telefoons en het tv-scherm test:

```sh
npm ci
npm run build:server
npx playwright install chromium
npm run test:browser
```
