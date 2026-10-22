---
title: Hosten op Coolify
description: Zet Mini Engine 0.4 in productie op een eigen Coolify-server, met DNS, bevestigingsmails via SMTP, back-ups en updates.
section: Snel aan de slag
order: 4
toc_depth: 3
---

# Hosten op Coolify

Deze pagina beschrijft hoe Mini Engine 0.4 in productie draait op een eigen [Coolify](https://coolify.io)-server, met `https://miniengine.nl` als voorbeeld en bevestigingsmails vanaf `noreply@miniengine.nl`. Vervang die adressen door je eigen domein.

Alles wat de engine nodig heeft, staat in de repository: een `Dockerfile` met healthcheck, het compose-bestand `compose.coolify.yaml` en de omgevingsvariabelen hieronder.

## 1. DNS voor de site

Maak bij je domeinbeheerder deze records:

| Type | Naam | Waarde |
| --- | --- | --- |
| `A` | `@` | IPv4-adres van je Coolify-server |
| `AAAA` | `@` | IPv6-adres van de server, als die er een heeft |
| `CNAME` | `www` | `miniengine.nl` (optioneel) |

Coolify vraagt zelf een Let's Encrypt-certificaat aan zodra de records naar de server wijzen.

## 2. Mail en mail-DNS

Accounts krijgen een bevestigingsmail (zie [accounts](../concepten/accounts.md#e-mailbevestiging)). Daarvoor heb je een SMTP-dienst nodig die mail mag versturen namens je domein, bijvoorbeeld Postmark, Brevo, Mailgun, Resend of de SMTP van je eigen mailhosting. Voeg het domein daar toe; de provider geeft je de DNS-records om het te verifiëren. Meestal zijn dat:

| Type | Naam | Waarde |
| --- | --- | --- |
| `TXT` | `@` | SPF-record van je provider |
| `TXT` of `CNAME` | `<selector>._domainkey` | DKIM-sleutel van de provider |
| `TXT` | `_dmarc` | DMARC-beleid |
| `CNAME` | bijvoorbeeld `pm-bounces` | Bounce-domein, als je provider dat vraagt |

SPF en DMARC zien er ongeveer zo uit:

```text
@        TXT  v=spf1 include:<provider> ~all
_dmarc   TXT  v=DMARC1; p=quarantine; rua=mailto:dmarc@miniengine.nl
```

Een domein heeft één SPF-record. Heb je er al een, voeg de include dan toe aan dat record.

Begin eventueel met DMARC op `p=none`, kijk een paar dagen mee in de rapporten en ga dan naar `quarantine`.

De engine verwacht de SMTP-gegevens als één URL:

```text
smtps://GEBRUIKER:WACHTWOORD@smtp.provider.example:465
smtp://GEBRUIKER:WACHTWOORD@smtp.provider.example:587?tls=required
```

Tekens als `@`, `:` of `/` in de gebruikersnaam of het wachtwoord moet je URL-coderen; `@` wordt `%40`.

## 3. De applicatie in Coolify

1. Kies **New Resource → Private Repository (with GitHub App)** en daarna `Casb02/mini-engine`, branch `main`.
2. Kies **Build Pack: Docker Compose** met het compose-bestand `compose.coolify.yaml`.
3. Zet bij de service `engine` het domein op `https://miniengine.nl`, en eventueel `https://www.miniengine.nl`. De engine luistert op poort 3000.
4. Vul in het tabblad **Environment Variables** de variabelen hieronder in.
5. Klik op **Deploy**. Coolify bouwt de image, start de container en wacht tot de healthcheck groen is.

### Omgevingsvariabelen

| Variabele | Waarde |
| --- | --- |
| `MINI_ENGINE_ADMIN_TOKEN` | Verplicht. De uitvoer van `openssl rand -hex 32`; minstens 32 tekens. Bewaar hem in je wachtwoordmanager. |
| `MINI_ENGINE_SMTP_URL` | Verplicht. De SMTP-URL uit stap 2. Markeer hem als secret. |
| `MINI_ENGINE_MAIL_FROM` | `Mini Engine <noreply@miniengine.nl>` (standaard) |
| `MINI_ENGINE_PUBLIC_URL` | `https://miniengine.nl` (standaard). De basis voor links in mails. |
| `MINI_ENGINE_TRUST_PROXY` | `x-forwarded-for` (standaard). Staat Cloudflare als proxy voor Coolify, gebruik dan `cf-connecting-ip`. |
| `MINI_ENGINE_ORIGINS` | Leeg, tenzij een ander adres de engine vanuit de browser moet aanroepen |
| `RUST_LOG` | `mini_engine=info,tower_http=warn` (standaard) |

Het compose-bestand zet de paden zelf: de database op `/app/data/mini-engine.sqlite`, de spellen in `/app/games` en de demo in `/app/web`. Ontbreekt een verplichte variabele, dan start de deploy niet.

`MINI_ENGINE_TRUST_PROXY` bepaalt van welk IP-adres een verzoek komt, en dus voor wie de [aanvraaglimieten](../api/limieten.md#aanvragen-per-ip-adres) tellen. Zonder deze variabele delen alle bezoekers het adres van de proxy. Zet hem alleen als de engine uitsluitend via die proxy bereikbaar is.

### Healthcheck en opslag

De container controleert zichzelf met `mini-engine healthcheck` (elke 30 seconden). Dat commando vraagt `/api/health` op en slaagt bij een 200.

De database staat in het volume `mini-engine-data` (`/app/data`). Dat volume blijft bestaan bij een nieuwe deploy: kamers, accounts, uploads en resultaten overleven een herstart.

## 4. Na de eerste deploy

1. Open `https://miniengine.nl/demo/account`, maak je eigen account en bevestig je e-mailadres via de mail.
2. Log met de [me-CLI](../publiceren/cli.md) in als beheerder en maak dev-keys voor mensen met een bevestigd adres:

   ```sh
   me admin login
   me admin token create dani --label laptop
   ```

   De CLI praat standaard met `https://miniengine.nl`. Voor een ander domein voeg je `--server https://jouw-domein` toe.

3. Komt er geen mail aan, kijk dan bij **Logs** van de service. Een SMTP-fout staat daar als `bevestigingsmail niet verstuurd`. Zonder `MINI_ENGINE_SMTP_URL` schrijft de engine de bevestigingslink in de log. Als beheerder kun je een adres ook met de hand bevestigen met `me admin account verify <gebruikersnaam>`; zie [beheer](../publiceren/beheer.md#e-mailadres-met-de-hand-bevestigen).

## 5. Back-ups

Maak in Coolify onder **Scheduled Tasks** een taak voor de service `engine`, met als frequentie `0 3 * * *` (elke nacht om 03:00):

```sh
mini-engine backup /app/data/backups/mini-engine-$(date +%F).sqlite && ls -1t /app/data/backups/mini-engine-*.sqlite | tail -n +4 | xargs -r rm -f
```

`mini-engine backup <bestand>` maakt een consistente kopie van de database (`VACUUM INTO`), ook terwijl er gespeeld wordt. Het doelbestand mag nog niet bestaan; ontbrekende mappen maakt het commando zelf. Het tweede deel bewaart alleen de drie nieuwste kopieën, zodat de schijf niet volloopt. Het draait alleen als de nieuwe back-up gelukt is. Wil je er meer bewaren, verhoog dan de `4` in `tail -n +4` (aantal plus één).

De back-ups staan dan nog op dezelfde server. Haal de map `backups/` geregeld naar een andere plek, bijvoorbeeld met `rsync` naar een andere machine.

Terugzetten: stop de service, vervang `/app/data/mini-engine.sqlite` door een back-up, verwijder eventuele `-wal`- en `-shm`-bestanden ernaast en start de service opnieuw.

## 6. Updaten

Zet in Coolify **Auto Deploy** aan, of deploy met de hand na een merge naar `main`. Tijdens het wisselen van container zijn de websockets even weg; de SDK verbindt zelf opnieuw en kamers lopen door. Kamers die een versie van een geüploade game spelen, houden die versie.

## 7. Docs op docs.miniengine.nl

Deze documentatie draait op GitHub Pages onder `https://docs.miniengine.nl/`. Zo is dat ingericht:

1. Maak een DNS-record `CNAME` `docs` → `casb02.github.io`.
2. Ga in `Casb02/mini-engine-docs` naar **Settings → Pages → Custom domain**, vul `docs.miniengine.nl` in en zet **Enforce HTTPS** aan zodra het certificaat er is.
3. Zet in `.github/workflows/pages.yml` de build-omgeving `DOCS_BASE=/`, zodat de 404-pagina naar de root verwijst.

## Variabelen in één oogopslag

| Variabele | Standaard | Wat |
| --- | --- | --- |
| `MINI_ENGINE_BIND` | `0.0.0.0:3000` | Adres en poort |
| `MINI_ENGINE_DB` | `/app/data/mini-engine.sqlite` | SQLite-database |
| `MINI_ENGINE_PUBLIC_URL` | `https://miniengine.nl` | Basis voor links in mails |
| `MINI_ENGINE_SMTP_URL` | verplicht | SMTP voor bevestigingsmails |
| `MINI_ENGINE_MAIL_FROM` | `noreply@miniengine.nl` | Afzender, met de naam Mini Engine |
| `MINI_ENGINE_ADMIN_TOKEN` | verplicht | Beheer en dev-keys, minstens 32 tekens |
| `MINI_ENGINE_TRUST_PROXY` | `x-forwarded-for` | Waar het IP-adres van de bezoeker vandaan komt |
| `MINI_ENGINE_ORIGINS` | leeg | Extra toegestane browser-origins |
| `RUST_LOG` | `mini_engine=info,…` | Logniveau |

Voor een server op je eigen netwerk zonder Coolify, zie [de engine draaien](engine-draaien.md) en [draaien met Docker](docker.md).
