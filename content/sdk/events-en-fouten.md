---
title: Events en fouten
description: De events van de MiniEngine-client, de verbindingsstatussen, MiniEngineError en de foutcodes die de SDK zelf maakt.
section: SDK-referentie
order: 4
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
| `server_shutdown` | tijdelijk | De engine stopt of herstart |

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
  await client.action('buzz');
} catch (error) {
  if (error.code === 'buzzer_closed') showMessage('Een ander team was eerder.');
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

De foutcodes van de server staan bij [HTTP API: foutcodes](../api/overzicht.md#foutcodes).
