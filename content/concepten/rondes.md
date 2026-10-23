---
title: Klaarzetten en rondes
description: De levensloop van een kamer, klaarzetten in de lobby, nieuwe rondes met een nieuw round_id en later aansluiten.
section: SDK
group: Concepten
order: 7
---

# Klaarzetten en rondes

Elke kamer doorloopt dezelfde vaste cirkel:

```text
lobby → running → finished → lobby
```

Andere overgangen worden geweigerd met `409 invalid_transition`. De host stuurt een overgang met `client.lifecycle()`.

## Klaarzetten

In de lobby zet elke deelnemer zich klaar:

```js
await client.ready(true);
```

Klaarzetten kan alleen in de lobby (anders `409 room_started`). Een spelleider die alleen leidt of de tv is, heeft geen spelersplek en dus geen klaarstatus. In een eigen spel staat de plek van een meespelende maker sinds 0.5.1 altijd klaar: Mini Engine zet hem klaar bij het maken van de kamer en bij elke terugkeer naar de lobby, en die plek houdt het starten nooit tegen. Zie [meespelen in een eigen spel](spelleidermodi.md#meespelen-in-een-eigen-spel).

## Starten

De overgang naar `running` lukt alleen als alle huidige deelnemers klaarstaan, met uitzondering van de plek van de maker in een eigen spel. Anders faalt hij met `409 players_not_ready`. Starten zet geen spelstand klaar: de host publiceert de eerste spelstand zelf met `setState`, zodra de kamer `running` is. `min_players` uit het manifest wordt bij het starten niet gecontroleerd; doe dat in je hostpagina als het ertoe doet.

```js
await client.lifecycle('running');
```

## Afronden

De overgang naar `finished` sluit de ronde af. Een eigen spel kent dan bijvoorbeeld zijn [achievements](achievements.md) toe; dat kan tijdens en na het spel. Bij de ingebouwde spellen legt de server op dat moment de accountresultaten en achievements vast.

## Een nieuwe ronde

Terug naar de lobby betekent een schone lei:

- een nieuw `round_id`;
- iedereen staat weer op niet klaar;
- de spelstand wordt gereset;
- bij de ingebouwde spellen een nieuw venster voor action-id's.

Spelers, instellingen en een eventuele [eigen set](eigen-sets.md) blijven; de spelstand niet. Realtimewaarden blijven ook staan, tot de host ze wist. Wil je een score over meerdere rondes bijhouden, speel die rondes dan binnen één `running`-fase en houd de stand bij in de state. Terug naar de lobby betekent een nieuw spel. Bewaar geen spelgegevens alleen in de DOM van een pagina: na een herverbinding rendert elke pagina opnieuw vanuit de snapshot.

## Instellingen

De maker kiest de instellingen bij het maken van de kamer, in het formulier dat Mini Engine uit je `settings_schema` maakt. Toon ze in je spel als tekst; zie [instellingen liggen vast](../game-bouwen/package-en-manifest.md#instellingen-liggen-vast-tijdens-het-spelen). Heeft je spel het echt nodig, dan vervangt de host ze met `client.setSettings()`, altijd als geheel object. De server controleert het object tegen het `settings_schema`.

## Later aansluiten

Nieuwe spelers kunnen normaal alleen in de lobby meedoen. Tijdens `running` lukt dat alleen als beide waar zijn:

1. het spel ondersteunt het: `supports_late_join: true` in het manifest;
2. de kamer staat het toe: `allow_late_join: true` in de config.

Probeert iemand toch mee te doen, dan faalt dat met `409 room_started`. Een kamer met `allow_late_join: true` voor een spel dat het niet ondersteunt, wordt bij het maken of configureren al geweigerd.
