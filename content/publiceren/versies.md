---
title: Versies en kamers
description: Hoe versies werken, waarom een kamer zijn versie houdt en hoe je terugrolt of opruimt.
section: Publiceren
order: 3
---

# Versies en kamers

Elke upload is een **release**: een vaste kopie van je pakket onder het `version` uit `manifest.json`, met een contenthash. Eén release per game is **actief**; die krijgen nieuwe kamers.

## Een kamer houdt zijn versie

Bij het maken van een kamer onthoudt de engine de actieve versie als `game_version`. Activeer je daarna een nieuwe versie, dan:

- krijgen **nieuwe** kamers de nieuwe versie;
- spelen **lopende** kamers door met hun eigen versie, ook als iemand de pagina ververst of later aansluit.

De engine regelt dat zelf. Hij serveert de HTML van de kamer uit de juiste release en verwijst `/games/<id>/assets/…` naar `/releases/<id>/<versie>/assets/…`. Schrijf imports tussen je eigen modules daarom **relatief**:

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

`me game disable mijn-spel` haalt de game van `/demo` en uit `GET /api/v1/games`. Nieuwe kamers kunnen dan niet meer, lopende kamers spelen door met hun eigen versie. `me game enable` zet hem terug.

Blokkeert de eigenaar je game, dan is dat een noodstop: de engine serveert er niets meer van, ook niet aan lopende kamers, en je kunt hem niet zelf weer aanzetten.
