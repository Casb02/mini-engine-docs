---
title: Achievements
description: Mijlpalen die een spel declareert en die spelers met een account verdienen. Het manifest, wie ze mag toekennen, het verschil tussen server en spel, en waar je ze terugziet.
section: Concepten
order: 9
toc_depth: 3
---

# Achievements

Sinds 0.5 kan een spel achievements declareren: kleine mijlpalen zoals *Winnaar* of *Dubbel zes*. Spelers met een account verdienen ze en houden ze op hun account. Gasten krijgen er geen.

## In het manifest

Een spel noemt zijn achievements in `manifest.json`:

```json
"achievements": [
  { "id": "winnaar", "title": "Winnaar", "description": "Win een show met je team." },
  { "id": "foutloos", "title": "Foutloos", "description": "Geef minstens drie goede antwoorden in één show, zonder fout." }
]
```

| Veld | Regel |
| --- | --- |
| `achievements` | Optioneel, hoogstens 50 per spel |
| `id` | 1 tot 48 tekens: kleine letters, cijfers, `_` of `-`, beginnend met een letter of cijfer. Uniek binnen het spel. |
| `title` | 1 tot 60 tekens, niet leeg, geen controletekens |
| `description` | 1 tot 160 tekens, niet leeg, geen controletekens |

De engine controleert dit bij het opstarten en bij elke upload. De definities zijn openbaar via [`GET /api/v1/games`](../api/games.md#get-api-v1-games). Een kamer gebruikt de achievements van de versie van het spel waarmee hij is gemaakt.

## Wie kan er een verdienen?

Alleen spelers met een spelersplek én een account. Het account komt uit de spelersplek die de engine zelf bijhoudt: het account waarmee iemand de kamer maakte of meedeed. Een client kan nooit zelf een account opgeven.

- Gasten, een aparte spelleider zonder spelersplek en het gedeelde scherm krijgen nooit een achievement. Een meespelende maker heeft wel een spelersplek en kan ze dus verdienen.
- Elke achievement verdien je één keer per spel. Nog een keer verdienen verandert niets.
- De engine bewaart titel en beschrijving zoals ze waren op het moment van verdienen. Ze blijven staan als het spel later verandert, wordt uitgezet of verdwijnt.

## Wie kent ze toe?

Dat hangt af van de [runtime](runtimes.md) van het spel.

### Serverspellen

Bij Common Dice en Jeopardy beslist de engine zelf, in Rust, aan het eind van een ronde: bij de overgang van `running` naar `finished`. De achievements worden opgeslagen in dezelfde transactie als de resultaten en de afgeronde kamer. Lukt opslaan niet, dan is er niets toegekend.

| Spel | Id | Titel | Wanneer |
| --- | --- | --- | --- |
| Jeopardy | `eerste-antwoord` | Eerste goede antwoord | Je gaf minstens één goed antwoord in de show |
| Jeopardy | `winnaar` | Winnaar | Je team had de hoogste score (gedeeld telt ook) en scoorde punten |
| Jeopardy | `foutloos` | Foutloos | Minstens drie goede antwoorden en geen enkel fout antwoord in één show |
| Jeopardy | `eigen-bord` | Eigen bord | Je speelde in een team een show op een [eigen vragenbord](eigen-sets.md) |
| Common Dice | `dubbel-zes` | Dubbel zes | Minstens twee zessen in één worp, met alleen de stenen die je echt gooide (vastgehouden stenen tellen niet) |
| Common Dice | `hoogste-worp` | Hoogste worp | De hoogste losse worp van de ronde; bij gelijke stand krijgt iedereen met die worp hem |

### Eigen spellen

Bij een eigen spel met `runtime: "host"` draaien de spelregels in de browser van de spelleider. Daar kent de host de achievements toe:

```js
await client.award(playerId, 'winnaar');
```

Dat kan ook met het websocketbericht `award` of met [`POST /api/v1/rooms/{code}/achievements`](../api/kamers.md#post-api-v1-rooms-code-achievements) en de hostsleutel. De engine controleert:

| Regel | Anders |
| --- | --- |
| Het spel heeft `runtime: "host"` | `403 forbidden`: bij een serverspel kent de server toe |
| De kamer is bezig of afgerond | `409 game_not_running` |
| De speler zit in de kamer | `404 player_not_found` |
| De speler heeft een account | `403 not_eligible` |
| Het id staat in de versie van het spel die de kamer speelt | `404 achievement_unknown` |
| De kamer is gemaakt door iemand die was ingelogd | `403 not_eligible` |
| Het account van de speler is niet dat van de host, behalve op de eigen plek van een meespelende maker (`host_player_id`) | `403 not_eligible`: een spelleider die met hetzelfde account ook als speler meedoet, kan zichzelf niets geven |
| Hoogstens 30 toekenningen per kamer per minuut | `429 rate_limit` |

Een achievement die de speler al had, geeft gewoon een bevestiging.

Speelt de maker mee (`host_mode: "playing"`, sinds 0.5.1 ook in eigen spellen), dan is die een speler zoals iedereen. De host mag een achievement toekennen aan de eigen plek van de maker, `host_player_id`, als de maker met een account speelt. Wat niet kan: een spelleider die alleen leidt en met hetzelfde account ook als speler meedoet, kan zichzelf niets geven.

Dit is een bewuste keuze over vertrouwen. Een spelleider kan de achievements van **dat ene spel** toekennen aan andere spelers in **zijn eigen kamer**. Omdat de spelcode in de browser van de host draait, kan de server niet controleren of iemand de achievement echt verdiende. Daarom bewaart de engine deze achievements apart, zie hieronder. Resultaten en statistieken blijven alleen voor serverspellen.

Een host die een ronde afsluit, kan zo de winnaar belonen:

```js
const best = Math.max(...Object.values(scores));
for (const player of client.room.players) {
  if (player.account_id && scores[player.id] === best) {
    await client.award(player.id, 'winnaar');
  }
}
```

Sla gasten over: hun `account_id` is `null`, en voor hen geeft `award` `not_eligible`.

## Server of spel

Elke verdiende achievement heeft een `source`:

| `source` | Toegekend door | Gecontroleerd door de server |
| --- | --- | --- |
| `server` | De engine, bij een serverspel | Ja |
| `game` | De host van een eigen spel | Nee |

De accountpagina op `/home/account` toont ze in twee groepen. Onder **Achievements** staan die van de server, per spel. Onder **Toegekend door eigen spellen** staan die van eigen spellen, met de uitleg dat het spel ze zelf gaf en de server ze niet heeft gecontroleerd. Die tweede groep verschijnt alleen als er iets in staat.

Lees ze zelf met [`GET /api/v1/accounts/achievements`](../api/accounts.md#get-api-v1-accounts-achievements), of met `api.achievements()` in de SDK.

## Vieren in het spel

Verdient een speler een achievement voor het eerst, dan stuurt de engine de hele kamer een bericht:

```json
{ "type": "achievement", "player_id": "…", "achievement": { "id": "winnaar", "title": "Winnaar", "description": "Win een show met je team." } }
```

Het hoort niet bij de spelstand: het heeft geen versie en staat niet in de snapshot. Het komt niet als iemand de achievement al had. Wie op dat moment niet verbonden is, mist het bericht, maar de achievement staat gewoon op het account.

```js
client.on('achievement', ({ player_id, achievement }) => {
  const name = client.room?.players.find((player) => player.id === player_id)?.name ?? 'Iemand';
  showToast(`${name} haalde ${achievement.title}`);
});
```
