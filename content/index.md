---
title: Mini Engine
nav_title: Welkom
description: Mini Engine is een kleine Rust-engine voor gezelschapsspellen met vrienden. Eén kamer, iedereen op zijn eigen telefoon, optioneel een gedeeld tv-scherm.
section: Start
order: 1
layout: home
toc: false
---

# Spelavonden met je eigen spellen

Mini Engine is een kleine Rust-engine voor gezelschapsspellen met vrienden. Eén kamer, iedereen op zijn eigen telefoon, en als je wilt een gedeeld tv-scherm. De engine regelt kamers, apparaten, verbindingen en opgeslagen spelstand. Jij bouwt het spel.

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
  <li><div><strong>Iemand maakt een kamer</strong>Op een laptop of telefoon kies je een spel en stel je de kamer in. Je krijgt een code van zes letters.</div></li>
  <li><div><strong>De rest doet mee op de eigen telefoon</strong>Iedereen opent de demopagina, vult de code en een naam in en krijgt een eigen plek aan tafel. De tv toont het gedeelde scherm.</div></li>
  <li><div><strong>Iedereen zet zich klaar, het spel begint</strong>Als alle spelers klaarstaan, start de ronde. Elke telefoon ziet direct dezelfde worp, vraag of score.</div></li>
</ol>

Spelen kan zonder account. Wie er wel een maakt, ziet de resultaten van afgeronde rondes terug in een profiel dat voor alle spellen op dezelfde engine geldt.

## Voor wie is dit?

Mini Engine is gemaakt voor een vriendengroep die eigen spellen wil spelen en bouwen. Je hebt een computer nodig die de engine draait, en telefoons op hetzelfde netwerk. Er zitten twee spellen in: **Common Dice**, gedeelde 3D-dobbelstenen, en **Jeopardy**, een quiz met teams en een buzzer. Een eigen spel is een map met HTML, JavaScript en een `manifest.json`.

## Waar wil je beginnen?

<ul class="routes">
  <li><a href="aan-de-slag/engine-draaien.md"><strong>De engine draaien</strong><span>Start Mini Engine op je computer en speel met telefoons op je wifi.</span></a></li>
  <li><a href="game-bouwen/eerste-game.md"><strong>Een game bouwen</strong><span>Maak met de scaffolder in vijf minuten een speelbaar stemspel en pas het aan.</span></a></li>
  <li><a href="concepten/kamers-en-rollen.md"><strong>De concepten</strong><span>Kamers, rollen, spelleidermodi, state en acties: hoe de onderdelen samenwerken.</span></a></li>
  <li><a href="api/overzicht.md"><strong>De HTTP- en websocket-API</strong><span>Alle routes, berichten, foutcodes en limieten van versie 0.2.</span></a></li>
</ul>
