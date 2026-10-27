---
title: Bouwen met AI
description: Gebruik de skills uit de Mini Engine SDK met Claude Code of een andere AI-codeeragent om spellen te bouwen die zich aan het contract houden.
section: SDK
group: Aan de slag
order: 4
---

# Bouwen met AI

Een AI-codeeragent kan een Mini Engine-spel prima opzetten, zolang hij de regels kent: wie de scheidsrechter is, wat er in welke state hoort, en dat de SDK nooit automatisch opnieuw probeert. De SDK levert die kennis mee als *skills*: mappen met een `SKILL.md` volgens de [Agent Skills-specificatie](https://agentskills.io/specification), die een agent inleest zodra de taak erom vraagt.

## De skills

De skills staan in de map `skills/` van de SDK-repository en gaan mee in het pakket. Na `npm install @casb02/mini-engine-sdk` vind je ze ook in `node_modules/@casb02/mini-engine-sdk/skills/`. De CLI heeft dezelfde skills aan boord.

| Skill | Waarvoor |
| --- | --- |
| `build-mini-engine-game` | De werkwijze van begin tot eind: scaffolden met `me init`, `me game new --template` of `create-mini-game` uit een van de vijf startsjablonen, manifest en `settings_schema`, de spelleider en de rollen, state in de hostruntime (publiek, alleen host, geheim per speler), rondes, het gedeelde scherm, testen met `me dev` en daarna als privé testversie op de server. Met naslag over de SDK, manifestregels, recepten voor de hostruntime en probleemoplossing, plus `scripts/play.mjs`, dat met Playwright een hele kamer bespeelt. |
| `design-mini-engine-game-ui` | De drie pagina's: speler (telefoon), scherm (tv aan de overkant van de kamer) en spelleider. Een eigen sfeer per spel, raakvlakken, leesbaarheid, zelf gehoste lettertypes, geen inline scripts onder de Content-Security-Policy van Mini Engine, minder beweging als de gebruiker dat vraagt. Instellingen als gewone tekst, een kopieerbare kamercode en een QR-code om mee te doen. |
| `mini-engine-ui` | **MiniEngineUI**: de rustige stijl van de demospellen als kant-en-klare kit. Een stylesheet, Space Grotesk en DM Sans, en pagina's voor spelleider, speler en scherm die meteen op de scaffold passen. Vier sferen (`kalk`, `nacht`, `vilt`, `studio`) en ruimte voor één eigen blikvanger per spel. |

De bouwskill roept de ontwerpskill zelf aan als hij aan de pagina's toekomt.

## MiniEngineUI

Heb je alleen een idee en geen ontwerp in je hoofd, kies dan MiniEngineUI. De bouwskill vraagt aan het begin één keer of je die stijl wilt. Zeg je niets, of heb je geen wensen voor het uiterlijk, dan gebruikt hij hem vanzelf. Je spel krijgt dan dezelfde rustige schil als de spellen van Mini Engine zelf: een balk met de naam van het spel en de kamercode, grote knoppen op de telefoon, een overzicht voor de spelleider en een scherm dat je vanaf de bank kunt lezen. De sfeer van jouw spel zit in één thema en één blikvanger op het speelveld, zoals het vilt bij de dobbelstenen.

Sinds SDK 0.5.1 regelt de kit ook het uitnodigen:

- **De kamercode is een knop.** Op de pagina's van spelleider en spelers kopieert een klik op de code (`me-code`) de uitnodigingslink, `/home/join?room=CODE` op het adres van de server, en toont even *Gekopieerd*. Op het gedeelde scherm is de code gewone tekst.
- **Een QR-code op het scherm.** In de lobby toont het gedeelde scherm naast de grote code een QR-code met dezelfde link, groot genoeg om vanaf de bank te scannen. Zodra het spel loopt, verdwijnt de QR; de code blijft in de balk.
- **Toon QR.** Waar geen vaste QR past, op de pagina's van spelleider en spelers, staat een rustige knop *Toon QR* naast de code. Die opent een venster met een grote QR, de code en *Sluiten*. Zo kan ook een speler een vriend laten scannen.
- **Een korte uitnodiging.** Het scherm noemt alleen het adres, zonder `/home`: *Ga naar miniengine.nl en vul de code in*. Het adres komt uit `location.host`; dat adres stuurt zelf door naar de startpagina.

De QR-code komt uit `kit/ui/qr.js` (de bibliotheek uqr, MIT, met de licentie ernaast) en `kit/ui/invite.js`, dat `joinUrl(code)`, `qrSvg(text)`, `bindCopyCode(button, code)` en `bindQrDialog(button, code)` levert. De stijl staat in de componenten `me-qr` en `me-dialog`.

Wil je het meteen, zeg het er dan bij:

> Bouw met MiniEngineUI een Mini Engine-spel waarin iedereen in het geheim een getal kiest. Gebruik de sfeer studio.

## Installeren met de CLI

Met de [me-CLI](../publiceren/cli.md) staan de skills er in één commando:

```sh
me skill install            # naar ~/.claude/skills
me skill install --project  # naar ./.claude/skills
```

## Claude Code

Claude Code laadt skills uit twee plekken:

| Plek | Geldt voor |
| --- | --- |
| `~/.claude/skills/` | Al jouw projecten |
| `.claude/skills/` in een project | Alleen dat project, bijvoorbeeld de map met je spellen |

`me skill install` zet ze op de eerste plek, `me skill install --project` op de tweede. Zonder CLI kopieer je ze uit het geïnstalleerde pakket:

```sh
mkdir -p ~/.claude/skills
cp -R node_modules/@casb02/mini-engine-sdk/skills/* ~/.claude/skills/
```

Start daarna een nieuwe sessie. De skill start vanzelf bij een passende vraag, bijvoorbeeld:

> Bouw een Mini Engine-spel waarin iedereen in het geheim een getal kiest en wie het dichtst bij twee derde van het gemiddelde zit, wint. Toon de uitslag op het gedeelde scherm.

Je kunt hem ook bij naam aanroepen: `/build-mini-engine-game`.

## Andere agents

- **Agents die het SKILL.md-formaat lezen**, zoals Codex, Gemini CLI en Copilot CLI, zoeken ook in `~/.agents/skills/`. Kopieer of koppel dezelfde mappen daarheen, of naar de plek die je agent documenteert.
- **Agents zonder skills** wijs je direct naar het bestand: *Lees skills/build-mini-engine-game/SKILL.md in de Mini Engine SDK en volg het.*
- Geef de agent ook `types/mini-engine.d.ts` uit de SDK. Daarin staan alle methoden en types exact.

## Deze docs als Markdown

Elke pagina van deze documentatie staat er ook als Markdown, voor agents die liever geen HTML lezen. Vervang `.html` door `.md` in het adres, of volg de link onderaan de pagina:

| Adres | Wat |
| --- | --- |
| `https://docs.miniengine.nl/<pagina>.md` | Eén pagina als Markdown, met titel, beschrijving en sectie bovenaan. Links wijzen naar de andere `.md`-pagina's, met het volledige adres. |
| [`llms.txt`](https://docs.miniengine.nl/llms.txt) | De inhoudsopgave volgens [llmstxt.org](https://llmstxt.org): elke pagina met een link en één zin uitleg, in de volgorde van het menu. |
| [`llms-full.txt`](https://docs.miniengine.nl/llms-full.txt) | Alle pagina's achter elkaar in één bestand. |

Een agent zonder skills geef je zo de hele documentatie in één keer: *Lees https://docs.miniengine.nl/llms-full.txt en bouw daarna het spel.* Elke HTML-pagina verwijst ook in de `<head>` naar haar Markdown-versie, met `<link rel="alternate" type="text/markdown">`.

## Een spel bouwen en testen

De bouwskill maakt een nieuw spel met `me init --yes` of `npx -p @casb02/mini-engine-sdk create-mini-game`, uit het startsjabloon dat het best past, en test het eerst met [`me dev`](../publiceren/cli.md#me-dev) op je eigen computer. Daarna zet hij het als testversie op de server. Sinds Mini Engine 0.9 doet hij dat met `me game upload --private`, zodat alleen jij het spel ziet, en niet iedereen op de server. Wil je vrienden laten testen, nodig ze dan uit met `me game invite <id> <gebruikersnaam>`; telefoons doen mee met de code. Voor de upload heb je een dev-key nodig. Ontbreekt iets, dan wijst de agent je erop. Mag iedereen het spel spelen, dan zet je het open met `me game public <id>`. Zie ook [testen](../game-bouwen/testen.md).

## Wat je de agent meegeeft

Een goede opdracht noemt alleen wat het ontwerp verandert:

- hoeveel spelers, en wat geheim is voor wie;
- de opbouw van rondes of beurten en hoe je wint;
- wat het gedeelde scherm laat zien;
- de taal van de interface.

De rest mag de agent aannemen, mits hij zijn aannames aan het eind opsomt.

## Controleer wat de agent maakt

Een agent schrijft overtuigende code die net naast het contract kan zitten. De bouwskill heeft een eigen afvinklijst; let in elk geval op:

- **De host is de scheidsrechter.** Spelersdata is onbetrouwbaar; `player_id` komt van de server. Hostknoppen roepen SDK-methoden aan, geen `action()`. Speelt de maker mee, dan past de hostpagina diens zetten zelf toe met `setState`.
- **Instellingen als tekst.** De maker kiest ze in het formulier voor een nieuwe kamer; het spel toont ze daarna als een korte regel, zonder knoppen om ze te wijzigen.
- **Eén wachtrij voor mutaties**, met `expected_version` uit de laatste snapshot.
- **Rondes met een doorlopende score spelen binnen één `running`-fase.** Terug naar de lobby wist de state.
- **Geheimen niet in `assets/` of `public_state`**, maar in `data.json`, `host_state` of `player_states`.
- **`player_states` alleen voor huidige spelers.** Een vertrokken speler in die map laat `setState` mislukken.
- **Geen inline scripts, geen `onclick`-attributen en geen CDN's.** De Content-Security-Policy van Mini Engine blokkeert ze.
- **Geen automatische retries.** Na een fout eerst de snapshot bekijken.

Speel het spel zelf terwijl de agent bouwt: `me dev` in de spelmap toont de spelleider, het scherm en de spelers naast elkaar en laadt opnieuw zodra de agent iets opslaat. Gebruik ook de [testchecklist](../game-bouwen/testen.md) en draai `npx -p typescript tsc -p jsconfig.json` in de spelmap voor de typecontrole. Probeer het spel voor een avond met vrienden ook een keer als testversie op de server, met echte telefoons.
