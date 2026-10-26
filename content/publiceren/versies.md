---
title: Versies en kamers
description: Hoe versies werken, waarom een kamer zijn versie houdt en hoe je terugrolt of opruimt.
section: CLI
order: 3
---

# Versies en kamers

Elke upload is een **release**: een vaste kopie van je pakket onder het `version` uit `manifest.json`, met een contenthash. Eén release per game is **actief**; die krijgen nieuwe kamers.

Deze pagina gaat over de versies van je eigen spel. Krijgt Mini Engine zelf een nieuwe versie, of de SDK of de CLI, dan staat bij [upgraden](../upgraden.md) wat je met je spel moet doen.

## Een kamer houdt zijn versie

Bij het maken van een kamer onthoudt Mini Engine de actieve versie als `game_version`. Activeer je daarna een nieuwe versie, dan:

- krijgen **nieuwe** kamers de nieuwe versie;
- spelen **lopende** kamers door met hun eigen versie, ook als iemand de pagina ververst of later aansluit.

Mini Engine regelt dat zelf. De pagina's van een kamer komen uit de juiste versie, en de verwijzingen naar `/games/<id>/assets/…` in je HTML wijzen dan naar de bestanden van die versie. In je JavaScript gebeurt dat niet. Schrijf imports tussen je eigen modules daarom **relatief**:

```js
import { score } from './logic.js';      // goed: komt uit dezelfde versie
import { score } from '/games/mijn-spel/assets/logic.js'; // fout: altijd de actieve versie
```

## Een nieuwe versie uitbrengen

```sh
# version in manifest.json: "1.1.0"
me game upload ./mijn-spel            # bewaard, nog niet actief
me game activate mijn-spel 1.1.0      # nu krijgen nieuwe kamers 1.1.0
```

Of in één keer: `me game upload ./mijn-spel --activate`.

## Terugrollen

Ging er iets mis, activeer dan de vorige versie:

```sh
me game activate mijn-spel 1.0.0
```

## Opruimen

Een game bewaart hoogstens 10 versies. Verwijderen kan niet bij:

- de **actieve** versie (`release_active`), activeer eerst een andere;
- een versie die een **lopende kamer** nog speelt (`release_in_use`). Kamers verlopen 12 uur na hun laatste activiteit.

```sh
me game prune mijn-spel --keep 3     # houdt de actieve, de nieuwste 3 en versies in gebruik
```

## Aan en uit

`me game disable mijn-spel` haalt de game van `/home` en uit de spellenlijst van `api.getGames()`. Nieuwe kamers kunnen dan niet meer, lopende kamers spelen door met hun eigen versie. `me game enable` zet hem terug. Sinds 0.5.1 kan dat ook op de accountpagina, onder **Mijn spellen**; zie [aan of uit vanaf de accountpagina](overzicht.md#aan-of-uit-vanaf-de-accountpagina).

Blokkeert wie de server beheert je game, dan is dat een noodstop: er wordt niets meer van geserveerd, ook niet aan lopende kamers, en je kunt hem niet zelf weer aanzetten (`game_blocked`).
