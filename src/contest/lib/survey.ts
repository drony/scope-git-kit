/** Surveys: the NPS score, answer distributions, a check for common wording and length mistakes, and ready-made templates. */
import type { ChoiceOption, Survey, SurveyAnswer, SurveyQuestion } from '../data/types'

/** The standard NPS wording. Keep it as it is, so scores stay comparable from one show to the next. */
export const NPS_PROMPT = 'How likely are you to recommend this contest to a friend or colleague?'

export interface NpsResult {
  n: number
  /** −100 to 100: the share of promoters (9–10) minus the share of detractors (0–6). */
  score: number | null
  promoters: number
  passives: number
  detractors: number
}

export function npsScore(values: number[]): NpsResult {
  const n = values.length
  const promoters = values.filter((v) => v >= 9).length
  const detractors = values.filter((v) => v <= 6).length
  return { n, promoters, passives: n - promoters - detractors, detractors, score: n ? Math.round(((promoters - detractors) / n) * 100) : null }
}

/** How many times each value or option appears. `keys` fixes the order and shows zeros. */
export function distribution(values: Array<string | number>, keys: Array<string | number>): Array<{ key: string | number; count: number; share: number }> {
  return keys.map((key) => {
    const count = values.filter((v) => v === key).length
    return { key, count, share: values.length ? count / values.length : 0 }
  })
}

/** The numbers an answer list holds, for nps, rating and likert questions. */
export const numbersOf = (answers: Array<SurveyAnswer | undefined>): number[] => answers.filter((a): a is number => typeof a === 'number')

const LEADING = /\b(great|amazing|awesome|love|loved|best|excellent|fantastic|terrible|awful|worst|how much did you enjoy|don't you agree|wouldn't you)\b/i
export const MAX_QUESTIONS = 5

/** Wording and length mistakes that make survey answers less honest. An empty list means nothing stands out. */
export function surveyProblems(survey: Pick<Survey, 'questions' | 'opensAt' | 'closesAt'>): string[] {
  const out: string[] = []
  const qs = survey.questions
  if (qs.length === 0) out.push('Add at least one question.')
  if (qs.length > MAX_QUESTIONS) out.push(`${qs.length} questions is a lot. Keep it to ${MAX_QUESTIONS} or fewer; short surveys get more answers.`)
  const required = qs.filter((q) => !q.optional).length
  if (required > 2) out.push('Make most questions optional, so nobody is forced to answer.')
  qs.forEach((q, i) => {
    const n = `Question ${i + 1}`
    if (!q.prompt.trim()) out.push(`${n} has no text.`)
    else if (LEADING.test(q.prompt)) out.push(`${n} leans toward an answer. Use neutral wording.`)
    if (q.type === 'nps' && q.prompt.trim() !== NPS_PROMPT) out.push(`${n} changes the standard NPS wording, so the score no longer compares with earlier ones.`)
    if ((q.type === 'choice' || q.type === 'multiple') && q.options.filter((o) => o.label.trim()).length < 2) out.push(`${n} needs at least two options.`)
  })
  if (survey.opensAt && survey.closesAt && survey.closesAt <= survey.opensAt) out.push('It closes before it opens.')
  return out
}

const opts = (labels: string[]): ChoiceOption[] => labels.map((label, i) => ({ id: `o${i + 1}`, label }))

export interface SurveyTemplate {
  id: string
  name: string
  description: string
  build: (id: string) => Survey
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'pulse',
    name: 'After the show',
    description: 'The standard NPS question, what people liked, and one open question. All optional.',
    build: (id) => ({
      id,
      title: 'After the show',
      kind: 'pulse',
      anonymous: true,
      questions: [
        { id: 'q1', type: 'nps', prompt: NPS_PROMPT, optional: true },
        { id: 'q2', type: 'choice', prompt: 'What did you like most tonight?', options: opts(['The questions', 'The pace', 'The scoreboard', 'The host']), optional: true },
        { id: 'q3', type: 'text', prompt: 'What would make next week better?', optional: true, maxLength: 280 },
      ],
    }),
  },
  {
    id: 'poll',
    name: 'Quick poll',
    description: 'One question with a few options, for the break during the show.',
    build: (id) => ({ id, title: 'Quick poll', kind: 'custom', anonymous: true, questions: [{ id: 'q1', type: 'choice', prompt: 'Which topic should we do next week?', options: opts(['Science', 'History', 'Music', 'Sport']), optional: false }] }),
  },
  {
    id: 'difficulty',
    name: 'Was it too hard?',
    description: 'A seven-point scale on difficulty, to tune the next show.',
    build: (id) => ({ id, title: 'Difficulty check', kind: 'custom', anonymous: true, questions: [{ id: 'q1', type: 'likert', prompt: 'How was the difficulty tonight?', points: 7, low: 'Far too easy', high: 'Far too hard', optional: true }] }),
  },
]

export const blankQuestion = (type: SurveyQuestion['type'], id: string): SurveyQuestion => {
  switch (type) {
    case 'nps':
      return { id, type, prompt: NPS_PROMPT, optional: true }
    case 'rating':
      return { id, type, prompt: 'How would you rate tonight?', optional: true }
    case 'likert':
      return { id, type, prompt: '', points: 5, low: 'Strongly disagree', high: 'Strongly agree', optional: true }
    case 'choice':
    case 'multiple':
      return { id, type, prompt: '', options: opts(['', '']), optional: true }
    case 'text':
      return { id, type, prompt: '', optional: true, maxLength: 280 }
  }
}
