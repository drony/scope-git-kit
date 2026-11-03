/**
 * Fictional data for the question review: sixteen more questions at every stage of the way (drafts, waiting, pre-approved,
 * returned with a reason, in the trash, approved), and a review history for the questions that were already in the bank. Four
 * people write and review: Ada is the demo editor, so some questions wait for her and some she cannot touch because she wrote
 * them or pre-approved them. Plain data: nothing here renders anything.
 */
import type { AnswerKey, Question, QuestionReview, QuestionSource, ReviewEvent, ReviewStage } from '@/contest/data/types'
import { day } from './time'

const PEOPLE = ['Bo', 'Cleo', 'Dev'] as const
const checked = (title: string, kind: QuestionSource['kind'] = 'book'): QuestionSource => ({ kind, title, checkedBy: 'Cleo', checkedAt: day(-8) })
const unchecked = (title: string, kind: QuestionSource['kind'] = 'web'): QuestionSource => ({ kind, title })

interface Spec {
  id: string
  prompt: string
  /** The options, or "true / false" for a statement. */
  options: string[] | 'truefalse'
  right: number | boolean
  tags: string[]
  level: 1 | 2 | 3 | 4 | 5
  source?: QuestionSource
  stage: ReviewStage
  author: string
  /** Days ago it entered its stage. */
  ago: number
  preapprovedBy?: string
  note?: string
}

const SPECS: Spec[] = [
  { id: 'q31', prompt: 'Which ocean is the largest by area?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], right: 2, tags: ['geography'], level: 1, source: checked('National Geographic Atlas of the World'), stage: 'draft', author: 'Ada', ago: 1 },
  { id: 'q32', prompt: 'Who wrote the play Hamlet?', options: ['William Shakespeare'], right: 0, tags: ['arts'], level: 2, stage: 'draft', author: 'Ada', ago: 0 },
  { id: 'q33', prompt: 'Sound travels fastest through which of these?', options: ['Air', 'Water', 'Steel', 'A vacuum'], right: 2, tags: ['science'], level: 3, source: unchecked('Physics textbook, chapter 12', 'book'), stage: 'draft', author: 'Bo', ago: 2 },
  { id: 'q34', prompt: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], right: 1, tags: ['maths'], level: 1, source: checked('Oxford Dictionary of Mathematics'), stage: 'pending', author: 'Bo', ago: 1 },
  { id: 'q35', prompt: 'Which mountain is the highest above sea level?', options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'], right: 2, tags: ['geography'], level: 1, source: unchecked('Britannica: Mount Everest'), stage: 'pending', author: 'Bo', ago: 2 },
  { id: 'q36', prompt: 'What is the chemical symbol for sodium?', options: ['Na', 'So', 'Sd', 'S'], right: 0, tags: ['science'], level: 2, source: checked('CRC Handbook of Chemistry and Physics'), stage: 'pending', author: 'Cleo', ago: 6 },
  { id: 'q37', prompt: 'In which year did the Titanic sink?', options: ['1905', '1912', '1918', '1923'], right: 1, tags: ['history'], level: 2, source: checked('The Titanic Inquiry Report, 1912'), stage: 'pending', author: 'Dev', ago: 5 },
  { id: 'q38', prompt: 'What is the largest planet in the Solar System?', options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], right: 1, tags: ['space'], level: 1, source: checked('NASA Solar System Exploration'), stage: 'pending', author: 'Ada', ago: 0 },
  { id: 'q39', prompt: 'Which artist painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Botticelli'], right: 2, tags: ['arts'], level: 1, source: checked('Louvre Collections'), stage: 'preapproved', author: 'Bo', ago: 1, preapprovedBy: 'Cleo' },
  { id: 'q40', prompt: 'What is the longest river in Africa?', options: ['Congo', 'Niger', 'Nile', 'Zambezi'], right: 2, tags: ['geography'], level: 2, source: checked('The Times Atlas of the World'), stage: 'preapproved', author: 'Cleo', ago: 2, preapprovedBy: 'Ada' },
  { id: 'q41', prompt: 'How many bones are in the adult human body?', options: ['106', '206', '306', '406'], right: 1, tags: ['science'], level: 3, source: checked("Gray's Anatomy"), stage: 'preapproved', author: 'Dev', ago: 4, preapprovedBy: 'Bo' },
  { id: 'q42', prompt: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Mercury', 'Jupiter'], right: 1, tags: ['space'], level: 1, source: unchecked('Wikipedia: Mars'), stage: 'returned', author: 'Bo', ago: 3, note: 'Add a second source. This one is only Wikipedia.' },
  { id: 'q43', prompt: 'What is the capital city of Italy?', options: ['Rome', 'Roma', 'Milan', 'Naples'], right: 0, tags: ['geography'], level: 1, source: checked('The Times Atlas of the World'), stage: 'returned', author: 'Cleo', ago: 2, note: 'Two options are the same city ("Rome" and "Roma"). Replace one.' },
  { id: 'q44', prompt: 'What colour do you get by mixing blue and yellow paint?', options: ['Green', 'Orange', 'Purple', 'Brown'], right: 0, tags: ['arts'], level: 1, stage: 'trashed', author: 'Dev', ago: 9 },
  { id: 'q45', prompt: 'A tomato is, botanically, a fruit.', options: 'truefalse', right: true, tags: ['science', 'myths'], level: 2, stage: 'trashed', author: 'Bo', ago: 7 },
  { id: 'q46', prompt: 'What is the smallest prime number?', options: ['1', '2', '3', '5'], right: 1, tags: ['maths'], level: 1, source: checked('Oxford Dictionary of Mathematics'), stage: 'approved', author: 'Cleo', ago: 10, preapprovedBy: 'Bo' },
]

const POINTS = { 1: 10, 2: 10, 3: 15, 4: 20, 5: 25 } as const
const at = (ago: number, hour = 10) => day(-ago, hour)

/** The events that lead to a stage, spread over the days before `since`. */
function historyFor(stage: ReviewStage, author: string, preapprovedBy: string | undefined, since: number, note?: string): ReviewEvent[] {
  const e = (action: ReviewEvent['action'], actor: string, from: ReviewStage, to: ReviewStage, ago: number, n?: string): ReviewEvent => ({ at: at(ago), actor, action, from, to, ...(n ? { note: n } : {}) })
  const out: ReviewEvent[] = [e('create', author, 'draft', 'draft', since + 2)]
  if (stage === 'draft') return out.slice(0, 1)
  if (stage === 'trashed') return [...out, e('trash', author, 'draft', 'trashed', since)]
  const reviewer = preapprovedBy ?? 'Cleo'
  out.push(e('submit', author, 'draft', 'pending', stage === 'pending' ? since : since + 1))
  if (stage === 'pending') return out
  if (stage === 'returned') return [...out, e('return', reviewer, 'pending', 'returned', since, note)]
  out.push(e('preapprove', reviewer, 'pending', 'preapproved', stage === 'preapproved' ? since : since + 1))
  if (stage === 'preapproved') return out
  return [...out, e('approve', 'Ada', 'preapproved', 'approved', since)]
}

const make = (s: Spec): { question: Question; key: AnswerKey } => {
  const truefalse = s.options === 'truefalse'
  const options = truefalse ? [{ id: 't', label: 'True' }, { id: 'f', label: 'False' }] : (s.options as string[]).map((label, i) => ({ id: String.fromCharCode(97 + i), label }))
  const correct = truefalse ? (s.right ? 't' : 'f') : options[s.right as number].id
  const review: QuestionReview = { stage: s.stage, author: s.author, preapprovedBy: s.preapprovedBy, note: s.note, since: at(s.ago, 11), history: historyFor(s.stage, s.author, s.preapprovedBy, s.ago, s.note) }
  const status = s.stage === 'approved' ? 'published' : s.stage === 'pending' || s.stage === 'preapproved' ? 'ready' : 'draft'
  return {
    question: { id: s.id, type: truefalse ? 'truefalse' : 'single', prompt: s.prompt, mediaIds: [], points: POINTS[s.level], timeLimitSec: truefalse ? 15 : 20, tags: s.tags, status, updatedAt: review.since, difficulty: s.level, source: s.source, options, review } as Question,
    key: { type: 'choice', correct: s.id === 'q32' ? [] : [correct], partialCredit: false },
  }
}

const made = SPECS.map(make)

/** The extra questions, with their answer keys. The incomplete draft has an empty key, so it is not ready to send. */
export const REVIEW = {
  questions: made.map((m) => m.question),
  keys: Object.fromEntries(made.map((m) => [m.question.id, m.key])) as Record<string, AnswerKey>,
}

/** Gives the questions that were already in the bank a review history: written by one person, checked by two others. */
export function withReviews(questions: Question[]): Question[] {
  return questions.map((q, i) => {
    if (q.review) return q
    const author = PEOPLE[i % 3]
    const reviewer = PEOPLE[(i + 1) % 3]
    const since = 14 - (i % 9)
    if (q.status === 'ready') return { ...q, review: { stage: 'pending', author: 'Dev', since: at(3, 9), history: historyFor('pending', 'Dev', undefined, 3) } } as Question
    if (q.status !== 'published') return q
    return { ...q, review: { stage: 'approved', author, preapprovedBy: reviewer, since: at(since, 12), history: historyFor('approved', author, reviewer, since) } } as Question
  })
}
