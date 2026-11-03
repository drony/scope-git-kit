/**
 * Fictional data for the weekly live contest: more questions with a difficulty, a time and a source, three past shows with
 * results (some questions turned out easier or harder than their level says), the next show, a draft with problems, and the
 * surveys with their answers. Plain data: nothing here renders anything.
 */
import type { AnswerKey, Episode, EpisodeSlot, Question, QuestionSource, Survey, SurveyResponse } from '@/contest/data/types'
import { simulateResult, makeBots } from '@/contest/lib/simulate'
import { DEFAULT_REMINDERS } from '@/contest/lib/reminders'
import { SURVEY_TEMPLATES } from '@/contest/lib/survey'
import { mulberry32 } from '@/kit/lib/random'
import { day } from './time'

const opt = (id: string, label: string) => ({ id, label })
const checked = (kind: QuestionSource['kind'], title: string, url?: string): QuestionSource => ({ kind, title, url, checkedBy: 'Ada', checkedAt: day(-12) })
const unchecked = (kind: QuestionSource['kind'], title: string, url?: string): QuestionSource => ({ kind, title, url })
const POINTS = { 1: 10, 2: 10, 3: 15, 4: 20, 5: 25 } as const

type Spec = { id: string; prompt: string; d: 1 | 2 | 3 | 4 | 5; tags: string[]; time?: number; source?: QuestionSource } & (
  | { kind: 'choice'; options: string[]; right: number }
  | { kind: 'truefalse'; right: boolean }
  | { kind: 'number'; value: number; tolerance?: number; unit?: string }
  | { kind: 'short'; accepted: string[] }
  | { kind: 'ordering'; items: string[] }
)

const SPECS: Spec[] = [
  { id: 'q11', d: 1, tags: ['science'], prompt: 'Which gas do plants take in from the air for photosynthesis?', kind: 'choice', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], right: 1, source: checked('book', 'Campbell Biology, chapter 10') },
  { id: 'q12', d: 1, tags: ['geography', 'myths'], prompt: 'The Great Wall of China can be seen from the Moon with the naked eye.', kind: 'truefalse', right: false, source: checked('web', 'NASA: Great Wall of China', 'https://www.nasa.gov/') },
  { id: 'q13', d: 2, tags: ['geography'], prompt: 'Which river flows through the city of Baghdad?', kind: 'choice', options: ['Nile', 'Tigris', 'Danube', 'Indus'], right: 1, source: checked('book', 'The Times Atlas of the World') },
  { id: 'q14', d: 2, tags: ['science'], prompt: 'What is the chemical symbol for gold?', kind: 'choice', options: ['Ag', 'Gd', 'Au', 'Go'], right: 2, source: checked('book', 'CRC Handbook of Chemistry and Physics') },
  { id: 'q15', d: 2, tags: ['arts'], prompt: 'Who painted "The Starry Night"?', kind: 'choice', options: ['Claude Monet', 'Vincent van Gogh', 'Paul Cézanne', 'Edvard Munch'], right: 1, source: checked('article', 'Museum of Modern Art, collection entry', 'https://www.moma.org/') },
  { id: 'q16', d: 3, tags: ['history'], prompt: 'In which year did the Berlin Wall fall?', kind: 'choice', options: ['1987', '1989', '1991', '1993'], right: 1, source: checked('book', 'A Concise History of Germany') },
  { id: 'q17', d: 3, tags: ['science'], time: 30, prompt: 'How many bones are in an adult human body?', kind: 'number', value: 206, tolerance: 0, source: checked('article', 'Gray\'s Anatomy, 42nd edition') },
  { id: 'q18', d: 3, tags: ['space'], prompt: 'Which planet has a storm called the Great Red Spot?', kind: 'choice', options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'], right: 2, source: checked('article', 'NASA Jupiter fact sheet', 'https://nssdc.gsfc.nasa.gov/') },
  { id: 'q19', d: 3, tags: ['geography'], prompt: 'Which is the smallest country in the world by area?', kind: 'choice', options: ['Monaco', 'San Marino', 'Vatican City', 'Liechtenstein'], right: 2, source: checked('dataset', 'CIA World Factbook, country comparison: area') },
  { id: 'q20', d: 3, tags: ['history', 'tech'], time: 45, prompt: 'Put these events in order, earliest first.', kind: 'ordering', items: ['The Moon landing (1969)', 'The Berlin Wall falls (1989)', 'The first iPhone (2007)', 'A pandemic is declared (2020)'], source: unchecked('article', 'Encyclopaedia Britannica timelines') },
  { id: 'q21', d: 4, tags: ['science'], prompt: 'Which element has the atomic number 26?', kind: 'choice', options: ['Iron', 'Nickel', 'Cobalt', 'Copper'], right: 0, source: checked('dataset', 'IUPAC periodic table') },
  { id: 'q22', d: 4, tags: ['music', 'arts'], prompt: 'Which composer wrote the opera "The Magic Flute"?', kind: 'choice', options: ['Beethoven', 'Mozart', 'Verdi', 'Wagner'], right: 1, source: checked('book', 'The New Grove Dictionary of Opera') },
  { id: 'q23', d: 4, tags: ['geography'], prompt: 'What is the capital city of Burkina Faso?', kind: 'choice', options: ['Bamako', 'Niamey', 'Ouagadougou', 'Accra'], right: 2, source: unchecked('web', 'Burkina Faso, Wikipedia', 'https://en.wikipedia.org/wiki/Burkina_Faso') },
  { id: 'q24', d: 4, tags: ['language'], prompt: 'Which language has the most native speakers in the world?', kind: 'choice', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], right: 2, source: unchecked('article', 'Ethnologue, most spoken languages') },
  { id: 'q25', d: 5, tags: ['history'], time: 30, prompt: 'In which year were the first Nobel Prizes awarded?', kind: 'number', value: 1901, tolerance: 0, source: checked('web', 'NobelPrize.org: facts', 'https://www.nobelprize.org/') },
  { id: 'q26', d: 5, tags: ['science', 'history'], prompt: 'Which scientist proposed the theory of continental drift in 1912?', kind: 'choice', options: ['Charles Lyell', 'Alfred Wegener', 'James Hutton', 'Harry Hess'], right: 1, source: checked('book', 'Wegener, The Origin of Continents and Oceans') },
  { id: 'q27', d: 5, tags: ['geography'], time: 30, prompt: 'What is the longest river in Europe?', kind: 'short', accepted: ['Volga'] },
  { id: 'q28', d: 2, tags: ['sport'], prompt: 'Which sport uses the terms "birdie" and "eagle"?', kind: 'choice', options: ['Golf', 'Cricket', 'Tennis', 'Rowing'], right: 0, source: checked('web', 'R&A Rules of Golf: glossary', 'https://www.randa.org/') },
]

const keys: Record<string, AnswerKey> = {}
const questions: Question[] = SPECS.map((s) => {
  const base = { id: s.id, prompt: s.prompt, mediaIds: [] as string[], points: POINTS[s.d], timeLimitSec: s.time ?? (s.kind === 'truefalse' ? 15 : s.kind === 'choice' ? 20 : 30), tags: s.tags, status: 'published' as const, updatedAt: day(-5), difficulty: s.d, source: s.source }
  if (s.kind === 'choice') {
    const options = s.options.map((label, i) => opt(String.fromCharCode(97 + i), label))
    keys[s.id] = { type: 'choice', correct: [options[s.right].id], partialCredit: false }
    return { ...base, type: 'single', options }
  }
  if (s.kind === 'truefalse') {
    keys[s.id] = { type: 'choice', correct: [s.right ? 't' : 'f'], partialCredit: false }
    return { ...base, type: 'truefalse', options: [opt('t', 'True'), opt('f', 'False')] }
  }
  if (s.kind === 'number') {
    keys[s.id] = { type: 'number', value: s.value, tolerance: s.tolerance ?? 0 }
    return { ...base, type: 'number', unit: s.unit }
  }
  if (s.kind === 'short') {
    keys[s.id] = { type: 'text', accepted: s.accepted.map((text, i) => ({ id: `k${i + 1}`, text, credit: 1 })), caseSensitive: false, ignoreAccents: true, ignorePunctuation: true }
    return { ...base, type: 'short', maxLength: 40 }
  }
  const items = s.items.map((label, i) => opt(String.fromCharCode(97 + i), label))
  keys[s.id] = { type: 'ordering', order: items.map((i) => i.id) }
  return { ...base, type: 'ordering', items }
})

/** Difficulty and a source for the ten questions the first seed already had. */
export const DETAILS: Record<string, Pick<Question, 'difficulty' | 'source'>> = {
  q1: { difficulty: 2, source: checked('article', 'NASA planetary fact sheets', 'https://nssdc.gsfc.nasa.gov/') },
  q2: { difficulty: 3, source: { kind: 'original', title: 'Written by the team' } },
  q3: { difficulty: 1, source: checked('web', 'National Weather Service: lightning myths', 'https://www.weather.gov/') },
  q4: { difficulty: 2, source: { kind: 'original', title: 'Written by the team' } },
  q5: { difficulty: 2, source: checked('book', 'The Times Atlas of the World') },
  q6: { difficulty: 4, source: checked('dataset', 'NASA Earth fact sheet', 'https://nssdc.gsfc.nasa.gov/') },
  q7: { difficulty: 3, source: unchecked('article', 'Encyclopaedia Britannica: animal weights') },
  q8: { difficulty: 3, source: checked('book', 'The Times Atlas of the World') },
  q9: { difficulty: 3, source: { kind: 'original', title: 'Written by the team' } },
  q10: { difficulty: 3, source: { kind: 'original', title: 'Written by the team' } },
}

const slot = (ep: string, qs: string[], breakAfter = 3): EpisodeSlot[] => {
  const out: EpisodeSlot[] = []
  qs.forEach((q, i) => {
    out.push({ id: `${ep}-${q}`, kind: 'question', questionId: q })
    if (breakAfter && i + 1 === breakAfter && i < qs.length - 1) out.push({ id: `${ep}-break`, kind: 'break', sec: 30 })
  })
  return out
}

const reminders = (ep: string, sent: boolean) => DEFAULT_REMINDERS.map((r, i) => ({ ...r, id: `${ep}-r${i + 1}`, ...(sent ? { sentAt: day(-30) } : {}) }))
const baseEpisode = (n: number, startsDay: number, qs: string[], status: Episode['status'], extra: Partial<Episode> = {}): Episode => ({
  id: `ep${n}`,
  number: n,
  title: `Weekly Live #${n}`,
  startsAt: day(startsDay, 19),
  slotMin: 20,
  status,
  slots: slot(`ep${n}`, qs),
  reminders: reminders(`ep${n}`, status === 'finished'),
  surveyId: 'sv-pulse',
  ...extra,
})

const bots = makeBots(40)
// How people really answered, where it differs from the level on the question.
const TRUE_P: Record<string, number> = { q16: 0.93, q26: 0.58, q21: 0.1, q24: 0.74, q23: 0.3, q19: 0.5 }
const pastShells = [baseEpisode(1, -21, ['q11', 'q14', 'q13', 'q16', 'q21', 'q25'], 'finished'), baseEpisode(2, -14, ['q12', 'q15', 'q19', 'q18', 'q22', 'q26'], 'finished'), baseEpisode(3, -7, ['q28', 'q1', 'q17', 'q23', 'q24', 'q27'], 'finished')]

export function weeklyEpisodes(base: Question[]): Episode[] {
  const all = [...base, ...questions].map((q) => ({ ...q, ...(DETAILS[q.id] ?? {}) }))
  return [
    ...pastShells.map((ep, i) => ({ ...ep, result: simulateResult({ episode: ep, questions: all, keys: keyCache }, bots, 100 + i, TRUE_P) })),
    baseEpisode(4, 3, ['q3', 'q5', 'q4', 'q7', 'q20', 'q6'], 'scheduled', { slots: [...slot('ep4', ['q3', 'q5', 'q4', 'q7', 'q20', 'q6'], 3).slice(0, 5), { id: 'ep4-poll', kind: 'poll', surveyId: 'sv-poll' }, ...slot('ep4', ['q3', 'q5', 'q4', 'q7', 'q20', 'q6'], 3).slice(5)] }),
    baseEpisode(5, 10, ['q23', 'q9', 'q24', 'q27'], 'draft', { reminders: [] }),
  ]
}

let keyCache: Record<string, AnswerKey> = {}
/** Registers the answer keys of the first seed, so the past shows can be played back with every key. */
export function registerKeys(existing: Record<string, AnswerKey>) {
  keyCache = { ...existing, ...keys }
}

export const WEEKLY = { questions, keys }

const rnd = mulberry32(31)
const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)]
const TEXT = ['More time on the hard ones, please.', 'Loved the pace. A bit more music, please.', 'The finale was too easy this week.', 'Fewer geography questions.', 'Great host, clear questions.', 'The break was a bit long.']

export const SURVEYS: Survey[] = [SURVEY_TEMPLATES[0].build('sv-pulse'), SURVEY_TEMPLATES[1].build('sv-poll')]

export function surveyResponses(): SurveyResponse[] {
  const out: SurveyResponse[] = []
  const means = [6.4, 7.3, 8.0]
  means.forEach((mean, e) => {
    for (let i = 0; i < 28 + e * 4; i++) {
      const nps = Math.max(0, Math.min(10, Math.round(mean + (rnd() - 0.5) * 5)))
      out.push({ id: `sr-${e + 1}-${i + 1}`, surveyId: 'sv-pulse', episodeId: `ep${e + 1}`, at: day(-21 + e * 7, 20), answers: { q1: nps, q2: pick(['o1', 'o2', 'o3', 'o4']), ...(rnd() < 0.35 ? { q3: pick(TEXT) } : {}) } })
    }
  })
  return out
}
