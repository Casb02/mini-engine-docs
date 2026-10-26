---
title: Events en fouten
description: De events van de websocketclient, de verbindingsstatussen, sluitredenen, MiniEngineError en alle foutcodes die je in een spel tegenkomt.
section: SDK
group: Referentie
order: 3
---

# Events en fouten

## Events

```ts
const off = client.on('snapshot', (room) => render(room));
client.once('closed', (reason) => showClosed(reason));
off(); // afmelden
```

`on` en `once` geven een functie terug waarmee je je afmeldt. Een fout in je eigen handler breekt de client niet; die wordt gelogd.

| Event | Waarde | Wanneer |
| --- | --- | --- |
| `snapshot` | `Snapshot` | Elke nieuwe projectie van de kamer voor jouw rol |
| `action` | `ActionEnvelope` | Alleen bij de host van een eigen spel: een doorgestuurde speleractie |
| `status` | `ConnectionStatus` | De verbinding verandert |
| `error` | `Error` | Een fout van de server of de verbinding |
| `closed` | `string` | De verbinding is definitief gesloten, met de reden |
| `achievement` | `{ player_id, achievement: { id, title, description } }` | Sinds 0.5. Iemand in de kamer verdiende een [achievement](../concepten/achievements.md#vieren-in-het-spel) voor het eerst |
| `throttled` | `{ dropped }` | Sinds 0.5. Er vielen realtimeberichten van jou weg omdat je te veel stuurde; hoogstens eens per 5 seconden |

Realtime-events en -waarden hebben hun eigen handlers: `client.realtime.on` en `client.realtime.onValue`. Zie [realtime](realtime-client.md#realtime).

```ts
client.on('achievement', ({ player_id, achievement }) => celebrate(player_id, achievement.title));
client.on('throttled', ({ dropped }) => console.warn(`${dropped} realtimeberichten niet verstuurd`));
```

### Verbindingsstatus

| Status | Betekenis |
| --- | --- |
| `connecting` | Eerste verbinding wordt opgezet |
| `connected` | Geauthenticeerd en eerste snapshot ontvangen |
| `reconnecting` | Verbinding weggevallen, nieuwe poging volgt |
| `disconnected` | Gestopt na `close()` of een definitieve sluiting |

### Sluitredenen

| Reden | Soort | Wat er gebeurde |
| --- | --- | --- |
| `session_revoked` | definitief | De sleutel is ingetrokken: speler verwijderd of vertrokken, scherm uitgezet |
| `room_deleted` | definitief | De host heeft de kamer gesloten |
| `room_expired` | definitief | Twaalf uur geen activiteit |
| `session_replaced` | definitief | Dezelfde sleutel heeft ergens anders verbonden |
| `host_lagged` | tijdelijk | De host liep te ver achter op de events |
| `heartbeat_timeout` | tijdelijk | 45 seconden niets van de client gehoord |
| `rate_limit` | tijdelijk | Te veel berichten per seconde |
| `server_shutdown` | tijdelijk | De server stopt of herstart |

Bij een tijdelijke reden verbindt de SDK vanzelf opnieuw. Na `session_replaced` blijft de sleutel bewaard, zodat je bewust kunt hervatten met `client.resume()`.

## MiniEngineError

```ts
class MiniEngineError extends Error {
  code: string;
  status?: number;
}
```

Fouten uit `ApiClient`, `http` en de opdrachten van `MiniEngine` zijn `MiniEngineError`s. `code` is de foutcode van de server, of een van de codes hieronder. `status` is de HTTP-status, alleen bij HTTP-fouten.

```ts
try {
  await client.action('roll', { held: [0, 2] });
} catch (error) {
  if (error.code === 'game_not_running') showMessage('Wacht tot het spel begint.');
  else showError(error.message);
}
```

Handel fouten af op de belofte die je terugkrijgt. Het event `error` vangt een afgewezen belofte niet af.

### Codes van de SDK zelf

| Code | Betekenis |
| --- | --- |
| `not_connected` | Opdracht gestuurd voordat de client verbonden is |
| `disconnected` | De verbinding viel weg voordat er een bevestiging kwam |
| `request_timeout` | Geen bevestiging binnen `requestTimeout` |
| `snapshot_timeout` | `waitForSnapshot` kreeg geen passende snapshot op tijd |
| `closed` | `close()` is aangeroepen |
| `invalid_action_id` | Een `actionId` die leeg is of langer dan 64 tekens |
| `missing_base_url` | Buiten de browser zonder `baseUrl` |
| `http_error` | Een HTTP-fout zonder foutbody van de server |
| `client_error` | Standaardcode als niets anders van toepassing is |

## Foutcodes van de server

Elke fout van de server heeft een vaste `code` voor je code en een Nederlandse `message` voor mensen. De SDK zet beide in de `MiniEngineError`. Dit zijn de codes die je in een spel kunt tegenkomen:

| Status | Code | Betekenis |
| --- | --- | --- |
| 400 | `invalid_request` | Ongeldige invoer: naam, instellingen, config, actiedata, de inhoud van een set, een realtimebericht, of een speler in `player_states` die niet (meer) in de kamer zit |
| 400 | `invalid_token` | Bevestigingslink onbekend, verlopen, al gebruikt of voor een ander account |
| 400, 413, 415, 422 | `invalid_json` | Geen geldige JSON, onbekende velden of een te grote body |
| 401 | `unauthorized` | Geen, een ongeldige of een verlopen sleutel; ook een mislukte login |
| 401 | `auth_timeout` | De websocket meldde zich niet binnen vijf seconden aan |
| 403 | `forbidden` | Niet toegestaan voor jouw rol, of bij dit soort spel. Bijvoorbeeld een actie vanaf de hostsleutel, of `setState` door een speler |
| 403 | `origin_forbidden` | Een browserverzoek van een andere origin |
| 403 | `not_eligible` | Achievement toekennen: de speler is een gast, de kamer is zonder account gemaakt, of het is het account van de host op een andere plek dan die van de meespelende maker |
| 404 | `not_found` | Onbekend adres |
| 404 | `room_not_found` | De kamer bestaat niet of is verlopen |
| 404 | `game_not_found` | Het spel bestaat niet of staat uit |
| 404 | `game_page_not_found` | Het spel heeft geen pagina voor deze rol |
| 404 | `asset_not_found` | Geen publiek bestand op dit pad |
| 404 | `player_not_found` | Onbekende speler |
| 404 | `set_not_found` | De set bestaat niet, of hoort bij een ander account |
| 404 | `achievement_unknown` | De versie van het spel die de kamer speelt, kent dit achievement-id niet |
| 409 | `version_conflict` | `expected_version` is verouderd; lees de snapshot opnieuw |
| 409 | `room_started` | Alleen mogelijk in de lobby, of later aansluiten staat uit |
| 409 | `room_full` | De kamer zit vol |
| 409 | `name_taken` | Die naam is al bezet in deze kamer |
| 409 | `already_joined` | Dit account heeft al een plek in deze kamer |
| 409 | `players_not_ready` | Niet iedereen staat klaar |
| 409 | `invalid_transition` | Overgang buiten `lobby → running → finished → lobby` |
| 409 | `host_offline` | De host is niet verbonden; een speleractie kan nu niet aankomen |
| 409 | `game_not_running` | Achievement toekennen terwijl de kamer nog in de lobby staat |
| 409 | `username_taken` | Gebruikersnaam bestaat al |
| 409 | `email_taken` | Dit e-mailadres is al bevestigd door een ander account |
| 409 | `email_already_verified` | Dit adres is al bevestigd voor jouw account |
| 409 | `quota_sets` | Het account heeft al 50 sets |
| 409 | `release_changed` | Kamer maken met een eigen set terwijl het spel net een nieuwe versie kreeg; probeer het opnieuw |
| 413 | `state_too_large` | De gepubliceerde state is groter dan 64 KiB |
| 413 | `set_too_large` | De inhoud van een set is groter dan 64 KiB |
| 429 | `rate_limit` | Te veel verzoeken, berichten, mails, setwijzigingen of toegekende achievements |
| 500 | `internal_error` | Opslaan mislukt; de oude state blijft staan |
| 503 | `room_limit` | De server heeft het maximale aantal kamers |
| 503 | `connection_limit` | De server heeft het maximale aantal verbindingen |

Foutcodes die je bij het publiceren tegenkomt, staan bij [de me-CLI](../publiceren/cli.md#foutmeldingen-van-de-server). Per route staan de mogelijke fouten in de [API-sectie](../api/overzicht.md#foutcodes).
