---
title: Mini Engine
nav_title: Welkom
description: Bouw je eigen gezelschapsspel voor Mini Engine met de SDK, zet het online met de CLI en gebruik het merk. Mini Engine is de plek om met vrienden te spelen, op miniengine.nl.
section: Start
order: 1
layout: home
toc: false
---

# Bouw je eigen spel voor Mini Engine

Mini Engine is de plek om gezelschapsspellen te spelen met vrienden, op [miniengine.nl](https://miniengine.nl). Eén kamer, iedereen op zijn eigen telefoon, en als je wilt een gedeeld tv-scherm.

Deze documentatie is voor wie er zelf een spel voor maakt. Je bouwt het spel met de **SDK**, test het op je eigen computer en zet het online met de **CLI**. Onder **Branding** staan het logo, de kleuren en de lettertypes.

<div class="tv" role="img" aria-label="Voorbeeld van het gedeelde tv-scherm: kamercode HWKRTZ, vier spelers aan tafel, drie staan klaar.">
  <div class="tv-top">
    <img src="{{root}}brand/woordmerk-donker.svg" alt="" width="104" height="18">
    <span>Common Dice</span>
  </div>
  <p class="tv-label">Doe mee met code</p>
  <p class="tv-code">HWKRTZ</p>
  <ul class="tv-seats">
    <li class="klaar">Dani</li>
    <li class="klaar">Sander</li>
    <li class="klaar">Kevin</li>
    <li>Jelmer</li>
  </ul>
</div>
<p class="tv-caption">Zo ziet de tafel eruit op de tv: één code, en iedereen die klaarstaat.</p>

## Zo werkt een avond

<ol class="steps">
  <li><div><strong>Iemand maakt een kamer</strong>Op miniengine.nl kies je een spel en stel je de kamer in. Je krijgt een code van zes letters.</div></li>
  <li><div><strong>De rest doet mee op de eigen telefoon</strong>Iedereen vult de code en een naam in, of scant de QR-code, en krijgt een eigen plek aan tafel. De tv toont het gedeelde scherm.</div></li>
  <li><div><strong>Iedereen zet zich klaar, het spel begint</strong>Als alle spelers klaarstaan, start de ronde. Elke telefoon ziet direct dezelfde worp, vraag of score.</div></li>
</ol>

Spelen kan zonder account. Wie er wel een maakt, ziet resultaten en achievements terug in een profiel dat voor alle spellen geldt, en kan eigen inhoud bewaren, zoals een eigen vragenlijst voor een quiz.

## Wat je bouwt

Een spel is een map met een `manifest.json`, een pagina voor de spelleider, een voor de spelers en eventueel een voor het gedeelde scherm, plus je eigen JavaScript en CSS. Mini Engine regelt de kamers, de telefoons, de verbindingen en de opgeslagen spelstand. Jouw spel bepaalt de regels: die draaien in het tabblad van wie de kamer maakte.

Je hebt Node.js 22 of nieuwer nodig. Om je spel online te zetten heb je daarnaast een dev-key nodig van wie de Mini Engine-server beheert waar je naar publiceert.

## Waar wil je beginnen?

<ul class="routes">
  <li><a href="game-bouwen/eerste-game.md"><strong>Je eerste game</strong><span>Maak in vijf minuten een speelbaar stemspel en speel het meteen op je eigen computer.</span></a></li>
  <li><a href="concepten/kamers-en-rollen.md"><strong>De concepten</strong><span>Kamers, rollen, state, acties, realtime, achievements en eigen sets: hoe de onderdelen samenwerken.</span></a></li>
  <li><a href="publiceren/overzicht.md"><strong>Publiceren met de CLI</strong><span>Zet je spel online met een dev-key en het commando me, met versies en terugrollen.</span></a></li>
  <li><a href="upgraden.md"><strong>Upgraden</strong><span>Heb je al een spel? Wat je doet bij de overstap naar Mini Engine 0.5, 0.6 en 0.7.</span></a></li>
  <li><a href="branding.md"><strong>Branding</strong><span>Het brandbook en de logobestanden, met naam, kleuren en lettertypes.</span></a></li>
</ul>
