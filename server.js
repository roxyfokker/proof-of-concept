import express from 'express'
import { Liquid } from 'liquidjs';

const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))

const engine = new Liquid()

app.engine('liquid', engine.express())
app.set('views', './views')

const exhibitUrl       = 'https://fdnd-agency.directus.app/items/teylers_museum_exhibits'
const sectionsUrl      = 'https://fdnd-agency.directus.app/items/teylers_museum_exhibits_sections'
const personsUrl       = 'https://fdnd-agency.directus.app/items/teylers_museum_persons'
const sourcesUrl       = 'https://fdnd-agency.directus.app/items/teylers_museum_sources'
const quizQuestionsUrl = 'https://fdnd-agency.directus.app/items/teylers_museum_quiz_questions'
const quizAnswersUrl   = 'https://fdnd-agency.directus.app/items/teylers_museum_quiz_answers'
const quizAttemptsUrl  = 'https://fdnd-agency.directus.app/items/teylers_museum_quiz_attempts'

app.get('/', async function (request, response) {
  const exhibitFetchResponse = await fetch(exhibitUrl)
  const exhibitFetchResponseJSON = await exhibitFetchResponse.json()

  response.redirect(`/exhibit/${exhibitFetchResponseJSON.data[0].slug}`)
})

app.get('/exhibit/:slug', async function (request, response) {
 
  // exhibits ophalen
  const exhibitFetchResponse = await fetch(`${exhibitUrl}?filter[slug][_eq]=${request.params.slug}&fields=*,creators.teylers_museum_persons_id.*`)
  const exhibitFetchResponseJSON = await exhibitFetchResponse.json()
  const exhibit = exhibitFetchResponseJSON.data[0]

  // timeline sections ophalen gesorteerd op start year 
  const sectionsFetchResponse = await fetch(`${sectionsUrl}?filter[exhibit][_eq]=${exhibit.id}&sort=start_year`)
  const sectionsFetchResponseJSON = await sectionsFetchResponse.json()
  const sections = sectionsFetchResponseJSON.data

  // questions ophalen ophalen gesorteerd op exhibit section 
  const questionsFetchResponse = await fetch(`${quizQuestionsUrl}?filter[exhibit][_eq]=${exhibit.id}&fields=*&sort=exhibit_section`)
  const questionsFetchResponseJSON = await questionsFetchResponse.json()
  const questions = questionsFetchResponseJSON.data

  // attempts ophalen
  const attemptsFetchResponse = await fetch(`${quizAttemptsUrl}?filter[exhibit][_eq]=${exhibit.id}`)
  const attemptsFetchResponseJSON = await attemptsFetchResponse.json()
  const attempts = attemptsFetchResponseJSON.data

  // section en question - koppelen dit is niet van mij snap ik nog niet 100%
  const sectionsWithQuestions = sections.map(section => ({
    ...section,
    question: questions.find(linkedQuestion => linkedQuestion.exhibit_section === section.id) ?? null
  }))
  
  return response.render('exhibit-detail.liquid', { 
    exhibit,
    sectionsWithQuestions, 
    attempt_id: request.query.attempt_id,
    completed: request.query.completed,
    score: request.query.score,
    correct: request.query.correct
  })
})

app.post('/quiz-answer', async function (request, response) {
  let attemptId = request.body.attempt_id

  if (!attemptId) {
    const attemptFetchResponse = await fetch('https://fdnd-agency.directus.app/items/teylers_museum_quiz_attempts',{
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exhibit: request.body.exhibit_id,
        started_at: new Date()
      })
    })
    const attemptFetchResponseJSON = await attemptFetchResponse.json()
    attemptId = attemptFetchResponseJSON.data.id
  }
    
  const questionFetchResponse = await fetch(`${quizQuestionsUrl}/${request.body.question_id}?fields=*`)
  const questionFetchResponseJSON = await questionFetchResponse.json()
  const question = questionFetchResponseJSON.data

  const isCorrect = question.options.find(option => option.key === request.body.chosen_option)?.is_correct === true

  await fetch(quizAnswersUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attempt: attemptId,
      question: request.body.question_id,
      chosen_option: request.body.chosen_option,
      answered_at: new Date(),
      is_correct: isCorrect
    })
  })

  response.redirect(`/exhibit/${request.body.exhibit_slug}?attempt_id=${attemptId}&correct=${isCorrect}#${request.body.section_slug}`)
});

app.post('/quiz-submit', async function (request, response) {
  const answersFetchResponse = await fetch(`${quizAnswersUrl}?filter[attempt][_eq]=${request.body.attempt_id}`)
  const answersFetchResponseJSON = await answersFetchResponse.json()
  const answers = answersFetchResponseJSON.data

  const score = answers.filter(answer => answer.is_correct).length

  await fetch(`${quizAttemptsUrl}/${request.body.attempt_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      completed_at: new Date(),
      score: score,
      total_questions: answers.length
    })
  })
  response.redirect(`/exhibit/${request.body.exhibit_slug}?attempt_id=${request.body.attempt_id}&completed=true&score=${score}`)
})

app.get('/niet-beschikbaar', async function (request, response) {
  response.render('partials/niet-beschikbaar.liquid')
})

app.set('port', process.env.PORT || 8000)

app.listen(app.get('port'), function () {
  console.log(`Project draait via http://localhost:${app.get('port')}`)
})