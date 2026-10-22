---
title: Hosten op Coolify
description: Zet Mini Engine 0.4 in productie op een eigen Coolify-server, met DNS, zelf verstuurde bevestigingsmails, een robotcheck, back-ups en updates.
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

Accounts krijgen een bevestigingsmail (zie [accounts](../concepten/accounts.md#e-mailbevestiging)). De engine kan die mail zelf versturen, rechtstreeks naar de mailserver van de ontvanger, of via een SMTP-dienst. Zolang je niets instelt, schrijft de engine de bevestigingslinks in de log.

### Zelf versturen

De engine zoekt het MX-record van de ontvanger op, levert de mail af op poort 25 (met TLS als de ontvanger dat aanbiedt) en ondertekent hem met DKIM. Dat gebeurt op de achtergrond; bij een tijdelijke weigering probeert de engine het na 2, 10 en 30 minuten opnieuw. Alleen mailservers met een publiek IP-adres komen in aanmerking.

1. **Poort 25 moet uitgaand open staan.** Veel cloudproviders blokkeren die standaard. Bij Hetzner Cloud vraag je het deblokkeren aan via **Limits → Request change → Unblock ports** in de Console.
2. **Reverse DNS**: zet de PTR van het server-IP (IPv4 en IPv6) op een hostnaam, bijvoorbeeld `mail.miniengine.nl`. Bij Hetzner staat dat onder **IPs → Edit Reverse DNS**.
3. **DKIM-sleutel**: open in Coolify de terminal van de service `engine` en draai `mini-engine dkim`. De eerste keer maakt dat een sleutel in het datavolume (`/app/data/dkim.pem`); het commando toont het TXT-record dat erbij hoort. De geheime sleutel verlaat de server nooit.
4. **DNS-records**, bij Cloudflare zonder proxy:

   | Type | Naam | Waarde |
   | --- | --- | --- |
   | `A` en `AAAA` | `mail` | De IP-adressen van de server, dezelfde naam als in de reverse DNS |
   | `TXT` | `@` | `v=spf1 ip4:<IPv4> ip6:<IPv6-blok> ~all` |
   | `TXT` | `mini._domainkey` | Het record uit `mini-engine dkim` |
   | `TXT` | `_dmarc` | `v=DMARC1; p=none;`, na een paar weken `p=quarantine` |

5. Zet `MINI_ENGINE_SMTP_URL` op `direct://mail.miniengine.nl` en deploy opnieuw. In de log staat per mail `mail bezorgd` of de reden waarom niet.

Zet `direct://` pas aan als poort 25 open is. Anders blijft een mail ruim een half uur hangen en staat de link niet meer in de log. Bij het opstarten vergelijkt de engine zijn sleutel met het DKIM-record in de DNS; klopt dat niet, dan staat er een waarschuwing met het juiste record in de log.

Een nieuw mail-IP heeft nog geen reputatie, dus de eerste mails belanden soms in de spam. Markeer ze als "geen spam"; na een tijdje herkennen mailproviders je server.

### Via een SMTP-dienst

Liever een dienst als Postmark, Brevo, Mailgun, Resend of de SMTP van je eigen mailhosting? Voeg je domein daar toe en zet de DNS-records die de provider geeft (SPF, DKIM, eventueel een bounce-domein). Een domein heeft één SPF-record; heb je er al een, voeg de include dan toe. Zet daarna `MINI_ENGINE_SMTP_URL` op de SMTP-gegevens als één URL:

```text
smtps://GEBRUIKER:WACHTWOORD@smtp.provider.example:465
smtp://GEBRUIKER:WACHTWOORD@smtp.provider.example:587?tls=required
```

Tekens als `@`, `:` of `/` in de gebruikersnaam of het wachtwoord moet je URL-coderen; `@` wordt `%40`.

### Robotcheck met Cloudflare Turnstile

Om te voorkomen dat bots accounts aanmaken of je mail laten versturen, vragen registreren en het (opnieuw) versturen van een bevestigingsmail om een Turnstile-check zodra je beide sleutels zet. Maak in Cloudflare onder **Turnstile** een widget voor je domein en zet `MINI_ENGINE_TURNSTILE_SITE_KEY` en `MINI_ENGINE_TURNSTILE_SECRET`. De engine controleert elk token bij Cloudflare: één keer bruikbaar, met de juiste actie en voor je eigen domein. Zonder de sleutels werkt alles zoals eerder.

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
| `MINI_ENGINE_SMTP_URL` | `direct://mail.miniengine.nl` om zelf te versturen, of een SMTP-URL uit stap 2 (markeer die als secret). Leeg: links in de log. |
| `MINI_ENGINE_TURNSTILE_SITE_KEY`, `MINI_ENGINE_TURNSTILE_SECRET` | De sleutels van je Turnstile-widget; markeer het secret als secret en zet het op niet beschikbaar tijdens de build. |
| `MINI_ENGINE_MAIL_FROM` | `Mini Engine <noreply@miniengine.nl>` (standaard) |
| `MINI_ENGINE_PUBLIC_URL` | `https://miniengine.nl` (standaard). De basis voor links in mails. |
| `MINI_ENGINE_TRUST_PROXY` | `cloudflare` (standaard). Neemt het bezoekersadres uit `CF-Connecting-IP`, maar alleen als het verzoek echt via Cloudflare binnenkwam. Zonder Cloudflare werkt het als `x-forwarded-for`. |
| `MINI_ENGINE_ORIGINS` | Leeg, tenzij een ander adres de engine vanuit de browser moet aanroepen |
| `RUST_LOG` | `mini_engine=info,tower_http=warn` (standaard) |

Het compose-bestand zet de paden zelf: de database op `/app/data/mini-engine.sqlite`, de spellen in `/app/games` en de demo in `/app/web`. Ontbreekt een verplichte variabele, dan start de deploy niet.

`MINI_ENGINE_TRUST_PROXY` bepaalt van welk IP-adres een verzoek komt, en dus voor wie de [aanvraaglimieten](../api/limieten.md#aanvragen-per-ip-adres) tellen. Met `cloudflare` telt de engine `CF-Connecting-IP` alleen als het verzoek van een Cloudflare-adres kwam; wie de server rechtstreeks aanspreekt, wordt op zijn eigen adres geteld. Gebruik geen kale headernaam zoals `cf-connecting-ip`: die is te vervalsen zodra de server ook direct bereikbaar is.

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

3. Komt er geen mail aan, kijk dan bij **Logs** van de service. Bij `direct://` staat daar `mail bezorgd`, `mail geweigerd` met de reden van de ontvanger, of `mail nog niet bezorgd; later opnieuw`. Een SMTP-fout staat er als `bevestigingsmail niet verstuurd`. Zonder `MINI_ENGINE_SMTP_URL` schrijft de engine de bevestigingslink in de log. Als beheerder kun je een adres ook met de hand bevestigen met `me admin account verify <gebruikersnaam>`; zie [beheer](../publiceren/beheer.md#e-mailadres-met-de-hand-bevestigen).

## 5. Back-ups

Maak in Coolify onder **Scheduled Tasks** een taak voor de service `engine`, met als frequentie `0 3 * * *` (elke nacht om 03:00):

```sh
mini-engine backup /app/data/backups/mini-engine-$(date +%F).sqlite && ls -1t /app/data/backups/mini-engine-*.sqlite | tail -n +4 | xargs -r rm -f
```

`mini-engine backup <bestand>` maakt een consistente kopie van de database (`VACUUM INTO`), ook terwijl er gespeeld wordt. Het doelbestand mag nog niet bestaan; ontbrekende mappen maakt het commando zelf. Het tweede deel bewaart alleen de drie nieuwste kopieën, zodat de schijf niet volloopt. Het draait alleen als de nieuwe back-up gelukt is. Wil je er meer bewaren, verhoog dan de `4` in `tail -n +4` (aantal plus één).

`mini-engine backup` zet ook de DKIM-sleutel (`dkim.pem`) in de back-upmap. Bewaar die samen met de database: zonder die sleutel past het DKIM-record in je DNS niet meer na een herstel.

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
| `MINI_ENGINE_SMTP_URL` | leeg | `direct://<hostnaam>` of een SMTP-URL; leeg betekent links in de log |
| `MINI_ENGINE_DKIM_KEY_FILE` | `dkim.pem` naast de database | DKIM-sleutel voor `direct://` |
| `MINI_ENGINE_DKIM_SELECTOR` | `mini` | DKIM-selector |
| `MINI_ENGINE_TURNSTILE_SITE_KEY`, `_SECRET` | leeg | Cloudflare Turnstile voor registreren en bevestigingsmails |
| `MINI_ENGINE_MAIL_FROM` | `noreply@miniengine.nl` | Afzender, met de naam Mini Engine |
| `MINI_ENGINE_ADMIN_TOKEN` | verplicht | Beheer en dev-keys, minstens 32 tekens |
| `MINI_ENGINE_TRUST_PROXY` | `cloudflare` in Coolify | Waar het IP-adres van de bezoeker vandaan komt |
| `MINI_ENGINE_ORIGINS` | leeg | Extra toegestane browser-origins |
| `RUST_LOG` | `mini_engine=info,…` | Logniveau |

Voor een server op je eigen netwerk zonder Coolify, zie [de engine draaien](engine-draaien.md) en [draaien met Docker](docker.md).
