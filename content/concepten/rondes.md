---
title: Klaarzetten en rondes
description: De levensloop van een kamer, klaarzetten in de lobby, nieuwe rondes met een nieuw round_id en later aansluiten.
section: Concepten
order: 7
---

# Klaarzetten en rondes

Elke kamer doorloopt dezelfde vaste cirkel:

```text
lobby → running → finished → lobby
```

Andere overgangen worden geweigerd met `409 invalid_transition`. De host stuurt een overgang met `lifecycle`; in een serverspel zonder spelleider kan iedere deelnemer dat ook met de acties `start` en `finish`.

## Klaarzetten

In de lobby zet elke deelnemer zich klaar:

```js
await client.ready(true);
```

Klaarzetten kan alleen in de lobby (anders `409 room_started`). Een aparte spelleider heeft geen spelersplek en dus geen klaarstatus. Een meespelende maker zet zich in een serverspel wel klaar. In een eigen spel (`runtime: "host"`) staat de plek van een meespelende maker sinds 0.5.1 altijd klaar: de engine zet hem klaar bij het maken van de kamer en bij elke terugkeer naar de lobby, en die plek houdt het starten nooit tegen. Zie [meespelen in een eigen spel](spelleidermodi.md#meespelen-in-een-eigen-spel).

## Starten

De overgang naar `running` lukt alleen als alle huidige deelnemers klaarstaan, met uitzondering van de plek van de maker in een eigen spel. Anders antwoordt de engine met `409 players_not_ready`. Jeopardy vraagt daarnaast dat iedere speler een team heeft gekozen (`409 teams_required`).

```js
await client.lifecycle('running');
```

## Afronden

De overgang naar `finished` sluit de ronde af. Bij een serverspel legt de engine op dat moment de accountresultaten en de verdiende [achievements](achievements.md) vast, in dezelfde transactie als de afgeronde kamer. Nieuwe achievements meldt de engine daarna aan de hele kamer. Jeopardy gaat zelf naar `finished` als alle vragen gespeeld zijn.

## Een nieuwe ronde

Terug naar de lobby betekent een schone lei:

- een nieuw `round_id`;
- iedereen staat weer op niet klaar;
- de spelstand wordt gereset;
- een nieuw venster voor de deduplicatie van action-id's.

Spelers, instellingen en een eventuele [eigen set](eigen-sets.md) blijven; de spelstand niet. Realtimewaarden blijven ook staan, tot de host ze wist. Wil je een score over meerdere rondes bijhouden, speel die rondes dan binnen één `running`-fase en houd de stand bij in de state. Terug naar de lobby betekent een nieuw spel. Bewaar geen spelgegevens alleen in de DOM van een pagina: na een herverbinding rendert elke pagina opnieuw vanuit de snapshot.

## Instellingen

De host vervangt instellingen altijd als geheel object, met `expected_version`. De engine controleert het object tegen het `settings_schema` uit het manifest en tegen de spelregels. Common Dice wist resultaten, vastgehouden stenen en geschiedenis als het aantal stenen of zijden verandert; een ander thema of een andere `roll_permission` laat de worp staan. Bij Jeopardy kan `team_count` alleen in de lobby veranderen, en alleen zolang nog geen speler een team heeft gekozen (`409 teams_locked`).

## Later aansluiten

Nieuwe spelers kunnen normaal alleen in de lobby meedoen. Tijdens `running` lukt dat alleen als beide waar zijn:

1. het spel ondersteunt het: `supports_late_join: true` in het manifest;
2. de kamer staat het toe: `allow_late_join: true` in de config.

Common Dice ondersteunt later aansluiten, Jeopardy niet. Probeert iemand toch mee te doen, dan geeft de engine `409 room_started`. Een kamer met `allow_late_join: true` voor een spel dat het niet ondersteunt, wordt bij het maken of configureren al geweigerd.
