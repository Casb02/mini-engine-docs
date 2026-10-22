---
title: Beheer voor de eigenaar
description: Zet beheer aan met MINI_ENGINE_ADMIN_TOKEN, bevestig e-mailadressen, maak dev-keys voor accounts, trek ze in en blokkeer games.
section: Publiceren
order: 4
---

# Beheer voor de eigenaar

Als eigenaar van de server bepaal jij wie mag publiceren. Dat doe je met één geheim: het admintoken.

## Beheer aanzetten

Zet `MINI_ENGINE_ADMIN_TOKEN` in de omgeving van de engine. Het moet minstens 32 tekens lang zijn; anders start de engine niet.

```sh
# .env naast compose.yaml
MINI_ENGINE_ADMIN_TOKEN=<uitvoer van: openssl rand -hex 32>
```

Zonder deze variabele geven alle routes onder `/api/v1/admin` 404 `admin_disabled`. Bewaar het token als een wachtwoord: wie het heeft, kan dev-keys maken.

## Iemand uitnodigen

1. Laat diegene een account maken op `/demo/account` en het e-mailadres bevestigen via de link in de mail.
2. Maak een dev-key:

   ```sh
   me admin login
   me admin token create sander --label laptop --expires 365
   ```

   Heeft het account nog geen bevestigd adres, dan weigert de server met 409 `email_not_verified`.

3. Geef de key (`med_…`) via een veilig kanaal door. Hij verschijnt maar één keer; de server bewaart alleen een hash.

## E-mailadres met de hand bevestigen

Komt de bevestigingsmail niet aan, bijvoorbeeld omdat SMTP nog niet is ingesteld, dan bevestig je het adres zelf:

```sh
me admin account verify sander
```

Dat bevestigt het adres dat bij het account staat. Heeft het account geen adres, dan volgt 409 `email_missing`; laat diegene dan eerst een adres invullen op `/demo/account`. Zonder `MINI_ENGINE_SMTP_URL` staat de bevestigingslink ook in de log van de engine.

## Keys en games beheren

```sh
me admin token list                 # wie heeft een key, wanneer laatst gebruikt
me admin token revoke <id>          # werkt direct niet meer
me admin games                      # alle geüploade games met eigenaar
me admin game block <id>            # noodstop: niets wordt nog geserveerd, ook niet aan lopende kamers
me admin game unblock <id>
```

Een ingetrokken key blokkeert geen games die al zijn geüpload. Wil je iemands games weghalen, blokkeer ze dan ook.

## Wat er wordt vastgelegd

De tabel `audit_log` in de SQLite-database bewaart met tijd en maker: uploads, activeren, aan en uit, verwijderen, blokkeren, het maken en intrekken van keys en het met de hand bevestigen van e-mailadressen.
