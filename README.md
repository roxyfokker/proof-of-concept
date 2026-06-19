# Teylers museum - Interactieve tijdlijn & quiz

## Inhoudsopgave

  * [Beschrijving](#beschrijving)
  * [Gebruik](#gebruik)
  * [Kenmerken](#kenmerken)
  * [Installatie](#installatie)
  * [Licentie](#licentie)

## Beschrijving

Voor Teylers Museum is een proof of concept gebouwd: een interactieve detailpagina die het verhaal van de Grote Elektriseermachine op een toegankelijke en educatieve manier vertelt aan kinderen uit de bovenbouw van de basisschool. De pagina combineert een chronologische tijdlijn met een interactieve quiz, waarbij elk tijdlijnblok direct gevolgd wordt door de bijbehorende quizvraag. Zo worden kinderen gestimuleerd om de tekst écht te lezen in plaats van de vragen te gokken.

De pagina is opgebouwd als een herbruikbaar concept: de routes en templates werken voor elke exhibit in de database op basis van een slug, zodat het systeem in de toekomst eenvoudig uitgebreid kan worden met meerdere objecten.

https://proof-of-concept-ktw1.onrender.com/exhibit/grote-elektriseermachine-met-leidse-flessen

<img width="200" height="215" alt="image" src="https://github.com/user-attachments/assets/a7e871d4-879f-4ca5-ad19-34f5bb978a01" />
<img width="450" height="12252" alt="image" src="https://github.com/user-attachments/assets/066c4efe-1bbf-46c5-b8aa-f51c7fb34649" />
<img width="1920" height="6944" alt="image" src="https://github.com/user-attachments/assets/62dce68c-d687-4dec-96f7-11f5b9c70318" />

## Gebruik

### Tijdlijn

De tijdlijn toont de geschiedenis van het object chronologisch. Elk blok bestaat uit een titel, samenvatting, afbeelding en jaartal. Als er aan een tijdlijnblok een of meerdere quizvragen gekoppeld zijn in de database, verschijnt er direct onder dat blok een quizcard

Onder de antwoordopties staat een hintknop die je direct naar het bijbehorende tekstblok linkt. Uit de gebruikerstest bleek dat zonder deze hint bezoekers te ver terugscrolden om het antwoord te zoeken. Op desktop wordt dit in de toekomst nog waardevoller doordat de tijdlijn en quiz naast elkaar komen te staan.

<img width="494" height="558" alt="image" src="https://github.com/user-attachments/assets/5eca6c70-c337-46c1-a76f-fd16f8fb4cb2" />

### Quiz — antwoord controleren
 
Elke quizcard bevat een formulier met een `<fieldset>` en `<legend>` voor de vraag, en een reeks radioknoppen voor de antwoordopties. De eerste optie in de lijst heeft een `required` attribuut, waardoor er altijd een keuze gemaakt moet worden voor verzending. De verzendknop is uitgeschakeld zolang er geen optie is geselecteerd — dit wordt afgehandeld via CSS zonder JavaScript:

Na het controleren van het antwoord krijgt de gebruiker directe feedback: de kaart toont of het antwoord goed of fout was, inclusief een uitlegtekst waarom. Dit werkt ook zonder JavaScript — de server verwerkt het formulier en stuurt de pagina terug met de bijgewerkte staat. De browser scrollt via de anchor in de redirect automatisch terug naar het juiste quizblok.

Met JavaScript wordt de paginaverversing onderschept. De knop toont een laadstaat ("Antwoord controleren…") terwijl het antwoord wordt verwerkt, en alleen de quizcard zelf wordt vervangen zonder dat de rest van de pagina herlaadt. Het `attempt_id` dat bij het eerste antwoord wordt aangemaakt, wordt daarna meteen in alle andere formulieren op de pagina gezet zodat alles bij dezelfde poging hoort.

<img width="2644" height="753" alt="image" src="https://github.com/user-attachments/assets/f187ba26-63d6-4ae9-91dc-462c5e21f644" />

#### Server — quiz-answer
 
Bij het eerste antwoord van een gebruiker bestaat er nog geen `attempt_id`. De server maakt dan eerst een nieuwe poging aan in de database en gebruikt het teruggegeven id voor de rest van de sessie. Daarna worden de vraagopties opgehaald om te controleren of het gekozen antwoord correct is:
 
```javascript
const isCorrect = question.options
  .find(option => option.key === request.body.chosen_option)
  ?.is_correct === true
```
 
Vervolgens wordt gecheckt of deze vraag al eerder is beantwoord in deze poging, zodat een antwoord niet opnieuw ingediend kan worden. Dit is een bewuste keuze: als je alle antwoorden opnieuw kan invullen totdat ze goed zijn, is een eindscore niet meer zinvol.
 
```javascript
const existingAnswerFetchResponse = await fetch(
  `${quizAnswersUrl}?filter[attempt][_eq]=${attemptId}&filter[question][_eq]=${request.body.question_id}`
)
const existingAnswer = existingAnswerFetchResponseJSON.data[0]
 
if (!existingAnswer) {
  // antwoord opslaan
}
```
 
Als de `Accept`-header `application/json` bevat (JavaScript is actief), stuurt de server JSON terug. Anders volgt een redirect met anchor naar het juiste quizblok.


### Quiz — resultaten
 
Onderaan de pagina staat een formulier met de knop "Bekijk je resultaten". Deze is uitgeschakeld totdat alle vragen zijn beantwoord. De score wordt berekend op de server:
 
```javascript
const score = answers.filter(answer => answer.is_correct).length
```
 
De resultaten worden getoond als percentage én als `x van y vragen goed`, via een `<meter>` element met `low`, `high` en `optimum` waarden. Afhankelijk van de score verschijnt er een passende motivatietekst:
 
```liquid
{% assign percentageCorrect = totalCorrect | times: 100.0 | divided_by: answeredCount | round %}
<meter
  id="score-percentage"
  min="0" max="100"
  low="33" high="67" optimum="100"
  value="{{ percentageCorrect }}"
></meter>
 
{% if percentageCorrect < 34 %}
  <p>🌱 Goed geprobeerd! Je bent al lekker aan het oefenen.</p>
{% elsif percentageCorrect < 66 %}
  <p>😊 Lekker bezig! Je snapt al best veel.</p>
{% elsif percentageCorrect < 84 %}
  <p>🎉 Goed gedaan! Je hebt bijna alles goed, echt goed bezig.</p>
{% else %}
  <p>🏆 Fantastisch! Jij weet echt alles over {{ exhibit.title }}</p>
{% endif %}
```
Met JavaScript wordt ook de resultatenweergave client-side afgehandeld: de knop toont "Score berekenen…" als laadstaat, en na de server-response wordt alleen het resultatenblok op de pagina vervangen zonder refresh.

<img width="1738" height="406" alt="image" src="https://github.com/user-attachments/assets/ce71d147-5368-4cdd-8d95-2ec8cd0e464e" />

#### Server — quiz-submit
 
De server haalt alle antwoorden van de huidige poging op, berekent de score en slaat deze op:
 
```javascript
const score = answers.filter(answer => answer.is_correct).length
 
await fetch(`${quizAttemptsUrl}/${request.body.attempt_id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    completed_at: new Date(),
    score: score,
    total_questions: answers.length
  })
})
```

### Databankstructuur (Directus)
 
De pagina koppelt secties aan vragen via een `Array.map()` met `Array.filter()` op de server, zodat elke sectie zijn eigen vragen meegeeft aan de template:
 
```javascript
const sectionsWithQuestions = sections.map(section => ({
  ...section,
  questions: questions.filter(
    linkedQuestion => linkedQuestion.exhibit_section === section.id
  )
}))
```


### Progressive enhancement
 
De website werkt op drie lagen:
 
**HTML** — de basislaag. Alle formulieren werken als standaard HTML-formulieren met POST en redirect. De tijdlijn, quizcards en resultaten zijn volledig bruikbaar zonder CSS of JavaScript.
 
**CSS** — de huisstijl van Teylers Museum is toegepast bovenop de robuuste HTML-basis. Button states en feedbackkleuren worden volledig in CSS afgehandeld.
 
**JavaScript** — de enhanced laag onderschept formulierverzendingen, voorkomt paginaherladingen, toont laadstaten op knoppen en zorgt dat het `attempt_id` consistent door de pagina wordt doorgezet via `sessionStorage`.
 

## Kenmerken

| Technologie | Gebruik |
|---|---|
| Node.js + Express | Server en routing |
| Liquid | Templates en server-side rendering |
| Directus API | Database — exhibit, secties, vragen, antwoorden, pogingen |
| Client-side JavaScript | Formulieren onderschepen, laadstaten, DOM-updates |

### Routes
 
| Method | Route | Beschrijving |
|---|---|---|
| GET | `/` | Redirect naar de eerste exhibit* |
| GET | `/exhibit/:slug` | Detailpagina van een exhibit |
| POST | `/quiz-answer` | Antwoord op een quizvraag verwerken |
| POST | `/quiz-submit` | Quiz afsluiten en score opslaan |

(Dit heb ik gedaan zodat dit in de toekomst een overzichtpagina kan worden met de exhibits die vervolgens naar de detailpagina van die exhibit stuurt

## Installatie

1. Ga naar [nodejs.org](https://nodejs.org) en installeer **Node.js 24.13.0 LTS** (Long Term Support).
2. Fork de repository en open het project in VSCodium.
3. Open de terminal in VSCodium en voer het volgende commando uit:
```bash
npm install
```
 
4. Start het project met:

```bash
npm run dev
```

Dit start tegelijkertijd de server via `nodemon` (herstart automatisch bij wijzigingen in `server.js`) en luistert naar wijzigingen in `.js`, `.liquid` en `.css` bestanden en herlaadt de browser automatisch. Het project is bereikbaar op **http://localhost:3000**.

5. Wanneer je klaar bent, stop je de server met **Control + C** in de terminal.

### Code conventies


## Licentie

This project is licensed under the terms of the [MIT license](./LICENSE).
