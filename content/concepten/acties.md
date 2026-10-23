---
title: Acties en action-id's
description: Hoe spelers en spelleiders acties sturen, wat een action_id doet, waarom de SDK nooit automatisch opnieuw probeert, en hoe acties en realtime samengaan.
section: SDK
group: Concepten
order: 5
---

# Acties en action-id's

Een actie is iets wat een speler in het spel doet: gooien, buzzen, stemmen. Je stuurt een naam en JSON-data:

```js
await client.action('vote', { yes: true });
```

## Regels voor een actie

| Veld | Regel |
| --- | --- |
| `name` | 1 tot 64 tekens: letters, cijfers, `_`, `.` of `-` |
| `data` | JSON, maximaal 8 KiB. De ingebouwde spellen vragen een object. |
| `action_id` | Optioneel, 1 tot 64 tekens zonder controletekens |

Bij een eigen spel sturen alleen spelers acties, en verwerkt de host ze. Speelt de maker mee, dan stuurt die geen actie (`403 forbidden`): de hostpagina past de eigen zetten direct toe met `setState`. Het gedeelde scherm stuurt nooit acties.

## Bij een eigen spel

Bij een eigen spel met `runtime: "host"` krijgt de host elke actie als event:

```js
client.on('action', (action) => {
  // { type: 'action', player_id: '…', name: 'vote', data: { yes: true }, request_id: '7' }
});
```

De `player_id` komt van de server en is betrouwbaar. De `data` komt van de speler en is dat niet: controleer altijd de vorm, de spelfase en de spelregels voordat je de state wijzigt. De bevestiging aan de speler betekent alleen dat de actie in de wachtrij van de host staat. Pas de snapshot die daarna komt, laat zien wat de host ermee deed.

## Nooit automatisch opnieuw

De SDK herhaalt opdrachten nooit vanzelf, ook niet na een time-out of een herverbinding. Open opdrachten worden bij uitval afgewezen. Na een onzeker resultaat kijk je eerst naar de nieuwste snapshot en beslis je dan.

Een actie die een speler toch twee keer stuurt, krijgt de host ook twee keer: bij een eigen spel ontdubbelt de server niets. Schrijf je regels zo dat een herhaling geen kwaad doet, bijvoorbeeld door een stem te overschrijven in plaats van op te tellen, en door een actie te negeren die niet bij de huidige fase past.

## Action-id's bij de ingebouwde spellen

De SDK geeft elke actie een nieuwe, unieke id (`crypto.randomUUID()`). De ingebouwde spellen gebruiken die: de server onthoudt de laatste 256 action-id's per afzender en ronde, en een id die nog eens binnenkomt, heeft geen tweede effect. Een herhaalde worp levert dus geen tweede worp op, en een herhaald goed antwoord geen dubbele score. Wil je zo'n actie bewust opnieuw proberen, hergebruik dan dezelfde id:

```js
const actionId = crypto.randomUUID();
try {
  await client.action('buzz', {}, { actionId });
} catch (error) {
  // Kijk eerst naar de actuele snapshot. Is de buzz er niet, probeer dan met dezelfde id.
  await client.action('buzz', {}, { actionId });
}
```

## Acties en realtime

Een [realtime-event](realtime.md) lijkt op een actie, maar is het niet:

| | Actie | Realtime-event |
| --- | --- | --- |
| Verwerkt door | De spelregels in de host | Niemand; het gaat rechtstreeks naar de ontvangers |
| Opgeslagen | De uitkomst, zodra de host die met `setState` publiceert | Nee |
| Bevestiging | `ack`: de actie staat in de wachtrij van de host | Geen |
| Kan wegvallen | Alleen als de host wegvalt voordat hij de actie verwerkt | Ja, onder drukte |

Gebruik een actie voor alles wat telt. Gebruik realtime voor wat je meteen wilt laten zien. Ze gaan goed samen: in Jeopardy stuurt een speler bij het drukken een event `pressed` én de actie `buzz`. Host en scherm tonen het event direct, met het verschil in milliseconden; de actie beslist wie de vraag krijgt.

De acties van Common Dice en Jeopardy staan bij [de ingebouwde spellen](../game-bouwen/voorbeelden.md#de-acties).
