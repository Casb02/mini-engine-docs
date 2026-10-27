---
title: Je game publiceren
description: Zet je eigen spel online op Mini Engine met een dev-key en de me-CLI, met versies, aan en uit, terugrollen en privéspellen voor jou en je vrienden.
section: CLI
order: 1
---

# Je game publiceren

Met de [me-CLI](cli.md) zet je je spel online op een Mini Engine-server, zoals miniengine.nl. Daarna staat het op de startpagina en kan iedereen er een kamer mee maken. Is het spel eerst alleen voor jou en je vrienden, maak het dan een [privéspel](#privespellen). Je hebt er een **dev-key** voor nodig. Die krijg je van wie de Mini Engine-server beheert waar je naar publiceert.

Zo gaat het:

1. Je maakt een gewoon account op `/home/account` van die server en bevestigt je e-mailadres via de link in de mail.
2. Je vraagt een dev-key voor je gebruikersnaam aan wie de server beheert.
3. Je installeert de [CLI](cli.md), plakt de key met `me auth` en uploadt je spel met `me game upload`.

```sh
me auth
me init mijn-spel
cd mijn-spel
me game upload
```

Met `me doctor` zie je vooraf of alles klaarstaat: je dev-key, de server en het spel in de map.

Een dev-key kan alleen voor een account met een bevestigd e-mailadres. Komt de bevestigingsmail niet aan, vraag dan om hulp bij wie de server beheert. De CLI praat standaard met `https://miniengine.nl`; voor een andere server gebruik je `me auth --server <adres>`.

## Wat er met je upload gebeurt

- **Elke upload is een vaste versie.** De server controleert het pakket en bewaart het onder het `version` uit `manifest.json`. Een versie overschrijven kan niet; voor een wijziging upload je een nieuwe. Zie [versies en kamers](versies.md).
- **De eerste versie van een nieuw spel is meteen actief.** Het staat dan voor iedereen op de startpagina, tenzij je uploadt met `--private` (sinds 0.9): dan is het spel privé voordat die versie live gaat. Latere versies worden actief met `--activate` of `me game activate`.
- **Lopende kamers houden hun versie.** Wie al aan het spelen is, merkt niets van een nieuwe versie.
- **Je game is van jou.** Niemand anders kan er versies aan toevoegen, hem uitzetten, privé maken of verwijderen. Wie de server beheert, kan hem wel blokkeren.

Na een upload van een actieve versie toont de CLI het adres om een kamer te maken: `<server>/home/new/<id>`. Bij de eerste versie van een nieuw spel zegt de CLI erbij dat die meteen live staat, of met `--private` dat alleen jij hem ziet.

## Privéspellen

Sinds 0.9 kan een spel privé zijn. Dan zien alleen jij en de accounts die je uitnodigt het spel, en alleen jullie maken er een kamer mee. Zo maak je een spel voor jezelf en je vrienden, of test je het zonder dat de rest van de server het ziet. Privé hoort bij het spel, niet bij één versie.

```sh
me game upload --private              # ook een nieuw spel is meteen privé
me game invite mijn-spel dani sander  # wie het mag zien en starten
me game invites mijn-spel             # wie er is uitgenodigd
me game public mijn-spel              # later: voor iedereen
```

Alle commando's staan bij [privé en uitnodigen](cli.md#prive-en-uitnodigen). Ze werken vanaf Mini Engine 0.9 en CLI 0.9.0.

### Wie het ziet en start

- **Jij en je genodigden, ingelogd op de site.** Het spel staat dan op `/home` en `/home/games` met het label **Privé**, en `/home/new/<id>` toont het formulier om een kamer te maken. Op de kaart staat zoals altijd *door* met jouw naam, dus een genodigde ziet van wie het spel is.
- **Voor ieder ander bestaat het spel niet.** Het staat niet op de startpagina, niet bij het zoeken en niet in `GET /api/v1/games`, en `/home/new/<id>` zegt *Dit spel bestaat niet.*, net als bij een id dat niemand gebruikt. Dat geldt voor wie niet is ingelogd, voor andere accounts en ook voor beheerders op de gewone pagina's.
- **Meedoen kan iedereen met de code**, de link of de QR-code, ook zonder account. Daar verandert niets aan.
- **De link `/home/new/<id>` werkt alleen voor wie is ingelogd en het spel mag zien.** Wie meedoet, krijgt van jou de kamercode of de uitnodigingslink van de kamer.

### Uitnodigen

- Je nodigt een account uit op gebruikersnaam: `me game invite <id> <gebruikersnaam>…`. Elk account kan, ook een gewone speler zonder dev-key. Een `@` voor de naam mag.
- Een spel heeft hoogstens 50 uitnodigingen. Trek er een in met `me game uninvite <id> <gebruikersnaam>`.
- De genodigde krijgt geen bericht; vertel het zelf. Na het inloggen staat het spel op de startpagina en op `<server>/home/new/<id>`.
- Uitnodigen kan ook bij een openbaar spel. De uitnodiging telt zodra het spel privé is. Maak je het weer openbaar, dan blijven de uitnodigingen bewaard voor de volgende keer.
- Een genodigde kan ook [eigen sets](../concepten/eigen-sets.md) voor het spel maken. Trek je de uitnodiging in, dan kan die ze nog bekijken en verwijderen, onder *Niet meer te spelen*.

### Privé maken en weer openbaar

- `me game private <id>` maakt een spel privé, `me game public <id>` weer openbaar. Een upload zonder `--private` laat een privéspel privé.
- Privé zet je met de CLI, niet in `manifest.json`. Staat er `private` in het manifest, dan stopt de CLI met een fout, en de server weigert een upload met `"private": true` in het manifest zonder `--private`. Zo gaat een spel dat je voor jezelf bedoelde, nooit per ongeluk voor iedereen live.
- Privé maken kan alleen met je dev-key, niet vanaf de accountpagina. Zie [vertrouwen](#vertrouwen).
- `me game upload --private` maakt het spel privé voordat de nieuwe versie live kan gaan. Een nieuw spel is zo nooit, ook niet even, voor iedereen te zien.
- Kamers die al lopen, spelen door als je een spel privé maakt of een uitnodiging intrekt.
- Een privéspel kan niet uitgelicht worden. Was het uitgelicht, dan gaat het eruit zodra je het privé maakt.
- Wie de server beheert, ziet privéspellen in het beheer, met het label, en kan ze blokkeren zoals elk spel. Privé maken, openbaar maken, uitnodigen en intrekken komen in het logboek van de server.

### Wat wel zichtbaar blijft

- **Voor wie de code heeft:** de titel en het icoon van het spel op de pagina om mee te doen, en de titel in het linkvoorbeeld van de uitnodiging. Met de code doe je mee, dus dat is de bedoeling.
- **De bestanden van een kamer, voor wie de code heeft.** Een kamer laadt zijn bestanden zonder inlog, van een adres met de kamercode erin: `/rooms/<code>/assets/…`. Wie de code heeft, kan ze dus laden. Zonder de code geven de bestanden van een privéspel 404, ook terwijl er een kamer loopt. Zet geheimen dus ook in een privéspel nooit in `assets/`; zie [geheime speldata](../game-bouwen/browserhost.md#geheime-speldata).
- **Het id, voor wie een dev-key heeft.** Een id is uniek op de server. Wie een spel uploadt met het id van jouw privéspel, krijgt `forbidden`, zoals bij elk spel van iemand anders. Zit die aan zijn limiet voor games, dan krijgt hij `quota_games`, bij een bezet en een vrij id hetzelfde.
- **Wat een spel van iemand anders in de browser ziet.** Zie [vertrouwen](#vertrouwen).
- **Een oude deelafbeelding.** Was het spel eerst openbaar, dan kan `/og/games/<id>.png` nog tot een dag in de cache van een browser of chat-app staan.

## Aan of uit vanaf de accountpagina

Sinds 0.5.1 zet je je eigen spellen ook aan of uit zonder CLI. Log in op `/home/account`. Heeft je account minstens één geüpload spel, dan staat daar het onderdeel **Mijn spellen**: per spel de titel, de actieve versie, de stand (*Aan*, *Uit* of *Geblokkeerd door de beheerder*) en een knop *Zet uit* of *Zet aan*. Een geblokkeerd spel heeft geen knop. Een privéspel heeft sinds 0.9 het label **Privé**; privé maken en uitnodigen gaat met de CLI.

Het werkt hetzelfde als `me game disable <id>` en `me game enable <id>` uit de [CLI](cli.md#games): een spel dat uit staat, verdwijnt van de startpagina en er kunnen geen nieuwe kamers mee worden gemaakt. Kamers die al spelen, lopen door. Je hebt er geen dev-key voor nodig, alleen je account. Uploaden, versies en verwijderen blijven via de CLI gaan.

## Op de site

Je spel staat als [spelkaart](../game-bouwen/package-en-manifest.md#op-de-spelkaart) op `/home/games`, met je icoon, je titel, *door* met de weergavenaam van je account, en de eerste zin van je `description`. Sinds 0.7 kunnen mensen daar zoeken, op titel, beschrijving, maker en id. Een zoekopdracht staat in de link, zoals `/home/games?q=quiz`.

Wie de site beheert, kan sinds 0.7 tot vier spellen uitlichten. Die staan eerst op de startpagina en bovenaan op `/home/games`. Zelf stel je dat niet in.

Een [privéspel](#privespellen) staat er sinds 0.9 alleen voor jou en je genodigden, als jullie zijn ingelogd: met het label **Privé** op de kaart en op de pagina voor een nieuwe kamer. Op de startpagina komt het na de uitgelichte spellen. Uitlichten kan niet.

## Linkvoorbeelden

Sinds 0.6.1 krijgt een gedeelde link naar je spel een voorbeeld in chat-apps en op sociale media. De pagina om een kamer te maken, `/home/new/<id>`, heeft dan de titel van je spel en je `description`, ingekort tot ongeveer 200 tekens. De afbeelding erbij, `/og/games/<id>.png`, tekent de server uit je icoon, je titel, het aantal spelers en *Met tv* als dat kan. Een uitnodiging voor een kamer, `/home/join?room=CODE`, krijgt een afbeelding met de titel van je spel en de code.

Zo ziet je spel er goed uit in zo'n voorbeeld:

- Een korte `title`, en een `description` die begint met een zin die het spel uitlegt.
- Een eenvoudig icoon. De server laadt daarbij niets: een `<image>` in je icoon, ook een `data:`-afbeelding, blijft op de deelafbeelding leeg. Gebruikt je icoon markers, patronen, zware filters zoals `feTurbulence`, een DTD, meer dan 2000 elementen (kopieën met `<use>` tellen mee) of meer dan 64 lagen, dan staat de beginletter van je titel op de afbeelding in plaats van je icoon.

Een spel dat uit staat of privé is, heeft geen deelafbeelding. De link `/home/new/<id>` van zo'n spel krijgt het gewone voorbeeld van Mini Engine, zonder de naam van je spel, ook als jij hem deelt. Een uitnodiging voor een kamer van een privéspel noemt wel de titel en de code.

## Wat mag

| Regel | Grens |
| --- | --- |
| Runtime | Alleen `host`. Zie [runtimes](../concepten/runtimes.md) |
| Spelleidermodi | `playing`, `tv` en `moderator`, in elke combinatie; `playing` sinds 0.5.1, `tv` sinds 0.5.2. Geen `hostless`. Zie [host_modes](../game-bouwen/package-en-manifest.md#host-modes) |
| Icoon | Optioneel, sinds 0.5.1: een SVG in `assets/` van hoogstens 64 KiB, zonder scripts. Zie [icon](../game-bouwen/package-en-manifest.md#icon) |
| Bestanden | Hoogstens 4096, elk ≤ 2 MiB, samen ≤ 10 MiB; paden tot 255 bytes en 32 niveaus |
| Upload | Hoogstens 16 MiB per keer, en 20 uploads per 10 minuten |
| Versienaam | 1–64 tekens `0-9 A-Z a-z . + _ -`, beginnend met een letter of cijfer |
| Games | Standaard 10 per account (`quota_games`). Wie de server beheert, kan je er meer geven |
| Versies | 10 bewaard per game; ruim oude op met `me game prune` |
| Id | Niet het id van een ingebouwde game (sinds 0.7 alleen `common-dice`) of van iemand anders |

## Vertrouwen

Een geüploade game draait op dezelfde origin als de pagina's van Mini Engine, net als het ingebouwde Common Dice. Hij kan in de browser de kamersleutel van dat tabblad en een eventuele accountsessie lezen, en met die sessie ook de eigen sets van de speler. Sinds 0.9 ziet zo'n spel met die sessie ook welke privéspellen de speler mag zien, en kan het er kamers mee maken. Privé of openbaar maken en uitnodigen kan het niet: dat gaat alleen met een dev-key. Daarom krijgen alleen uitgenodigde mensen een dev-key. Gebruik je accountsessie of die van spelers nooit in je spel.
