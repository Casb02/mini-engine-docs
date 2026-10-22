---
title: Bouwen met AI
description: Gebruik de skills uit de Mini Engine SDK met Claude Code of een andere AI-codeeragent om spellen te bouwen die zich aan het contract houden.
section: Bouwen met AI
order: 1
---

# Bouwen met AI

Een AI-codeeragent kan een Mini Engine-spel prima opzetten, zolang hij de regels kent: wie de scheidsrechter is, wat er in welke state hoort, en dat de SDK nooit automatisch opnieuw probeert. De SDK levert die kennis mee als *skills*: mappen met een `SKILL.md` volgens de [Agent Skills-specificatie](https://agentskills.io/specification), die een agent inleest zodra de taak erom vraagt.

## De skills

De skills staan in de map `skills/` van de SDK-repository en gaan mee in het pakket. Na `npm install` van de tarball vind je ze ook in `node_modules/@casb02/mini-engine-sdk/skills/`.

| Skill | Waarvoor |
| --- | --- |
| `build-mini-engine-game` | De werkwijze van begin tot eind: scaffolden met `create-mini-game`, manifest en `settings_schema`, de spelleider en de rollen, state in de hostruntime (publiek, alleen host, geheim per speler), rondes, het gedeelde scherm, de engine draaien en controleren met meerdere apparaten. Met naslag over de SDK, manifestregels, recepten voor de hostruntime en probleemoplossing, plus `scripts/play.mjs`, dat met Playwright een echte kamer bespeelt. |
| `design-mini-engine-game-ui` | De drie pagina's: speler (telefoon), scherm (tv aan de overkant van de kamer) en spelleider. Een eigen sfeer per spel, raakvlakken, leesbaarheid, zelf gehoste lettertypes, geen inline scripts onder de CSP van de engine, minder beweging als de gebruiker dat vraagt. |

De bouwskill roept de ontwerpskill zelf aan als hij aan de pagina's toekomt.

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
| `.claude/skills/` in een project | Alleen dat project, bijvoorbeeld je engine-checkout |

Vanuit de root van de SDK-checkout:

```sh
# voor al je projecten; symlinks volgen een git pull
mkdir -p ~/.claude/skills
ln -s "$PWD"/skills/* ~/.claude/skills/

# of alleen voor de engine-checkout; een kopie, dus opnieuw kopiëren na updates
mkdir -p ../mini-engine/.claude/skills
cp -R skills/* ../mini-engine/.claude/skills/
```

Start daarna een nieuwe sessie. De skill start vanzelf bij een passende vraag, bijvoorbeeld:

> Bouw een Mini Engine-spel waarin iedereen in het geheim een getal kiest en wie het dichtst bij twee derde van het gemiddelde zit, wint. Toon de uitslag op het gedeelde scherm.

Je kunt hem ook bij naam aanroepen: `/build-mini-engine-game`.

## Andere agents

- **Agents die het SKILL.md-formaat lezen**, zoals Codex, Gemini CLI en Copilot CLI, zoeken ook in `~/.agents/skills/`. Kopieer of koppel dezelfde mappen daarheen, of naar de plek die je agent documenteert.
- **Agents zonder skills** wijs je direct naar het bestand: *Lees skills/build-mini-engine-game/SKILL.md in de Mini Engine SDK en volg het.*
- Geef de agent ook `types/mini-engine.d.ts` uit de SDK. Daarin staan alle methoden en types exact.

De skills gaan uit van een engine-checkout (om het spel te draaien en te testen) en een SDK-checkout (voor `create-mini-game`). Ontbreken die, dan wijst de agent je erop. Beide repositories zijn privé, dus je hebt GitHub-toegang nodig.

## Wat je de agent meegeeft

Een goede opdracht noemt alleen wat het ontwerp verandert:

- hoeveel spelers, en wat geheim is voor wie;
- de opbouw van rondes of beurten en hoe je wint;
- wat het gedeelde scherm laat zien;
- de taal van de interface.

De rest mag de agent aannemen, mits hij zijn aannames aan het eind opsomt.

## Controleer wat de agent maakt

Een agent schrijft overtuigende code die net naast het contract kan zitten. De bouwskill heeft een eigen afvinklijst; let in elk geval op:

- **De host is de scheidsrechter.** Spelersdata is onbetrouwbaar; `player_id` komt van de engine. Hostknoppen roepen SDK-methoden aan, geen `action()`.
- **Eén wachtrij voor mutaties**, met `expected_version` uit de laatste snapshot.
- **Rondes met een doorlopende score spelen binnen één `running`-fase.** Terug naar de lobby wist de state.
- **Geheimen niet in `assets/` of `public_state`**, maar in `data.json`, `host_state` of `player_states`.
- **`player_states` alleen voor huidige spelers.** Een vertrokken speler in die map laat `setState` mislukken.
- **Geen inline scripts, geen `onclick`-attributen en geen CDN's.** De Content-Security-Policy van de engine blokkeert ze.
- **Geen automatische retries.** Na een fout eerst de snapshot bekijken.

Gebruik ook de [testchecklist](../game-bouwen/testen.md) en draai `npx -p typescript tsc -p jsconfig.json` in de spelmap voor de typecontrole.
