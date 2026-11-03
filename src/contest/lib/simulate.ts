/**
 * Pretend players. A demo has no crowd, so bots answer instead: each bot has a skill, and the chance that it gets a question
 * right follows how hard the question is. The same code makes the history of past shows and plays a live show, and with a
 * fixed seed it gives the same crowd every time.
 */
import { mulberry32 } from '@/kit/lib/random'
import type { AnswerKey, AnswerValue, Difficulty, Episode, EpisodeResult, Id, Question, QuestionResult } from '../data/types'
import { limitSecAt, pointsAt, scoreLive, type LiveContext } from './live'
import { sampleAnswer } from './sampleAnswers'

export interface Bot {
  id: Id
  name: string
  /** 0.75 (weak) to 1.25 (strong): multiplies the chance of a right answer. */
  skill: number
}

const NAMES = ['Ayla', 'Bruno', 'Chen', 'Dalia', 'Emre', 'Farah', 'Goran', 'Hiro', 'Ines', 'Jonas', 'Kemal', 'Lena', 'Mateo', 'Nora', 'Omar', 'Petra', 'Quinn', 'Rosa', 'Sami', 'Tara', 'Umut', 'Vera', 'Wen', 'Xavi', 'Yara', 'Zeki', 'Alma', 'Boris', 'Cleo', 'Dino', 'Eda', 'Finn', 'Gina', 'Hugo', 'Isla', 'Jin', 'Kira', 'Leo', 'Mina', 'Nils']

export function makeBots(count: number, seed = 7): Bot[] {
  const rnd = mulberry32(seed)
  return Array.from({ length: count }, (_, i) => ({ id: `bot${i + 1}`, name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ''), skill: Math.round((0.75 + rnd() * 0.5) * 100) / 100 }))
}

/** The chance that an average player gets a question right, by its declared level. */
export const BASE_P: Record<Difficulty, number> = { 1: 0.92, 2: 0.8, 3: 0.62, 4: 0.42, 5: 0.25 }

/** A wrong answer picked at random, so wrong picks spread over the options like real ones do. */
function wrongAnswer(q: Question, key: AnswerKey | null | undefined, rnd: () => number): AnswerValue | null {
  if (key?.type === 'choice' && 'options' in q) {
    const wrong = q.options.filter((o) => !key.correct.includes(o.id))
    if (wrong.length) return { type: 'choice', selected: [wrong[Math.floor(rnd() * wrong.length)].id] }
  }
  return sampleAnswer(q, key, false)
}

export interface BotMove {
  value: AnswerValue | null
  /** How long the bot thinks, as a share of the time limit (0 to 1). */
  thinks: number
  right: boolean
}

/** What a bot does with a question. `p` replaces the chance an average player is right (to model a question that is easier or harder than it looks). */
export function botMove(q: Question, key: AnswerKey | null | undefined, bot: Bot, rnd: () => number, p?: number): BotMove {
  const chance = Math.min(0.98, Math.max(0.02, (p ?? BASE_P[q.difficulty ?? 3]) * bot.skill))
  const right = rnd() < chance
  return { value: right ? sampleAnswer(q, key, true) : wrongAnswer(q, key, rnd), thinks: 0.12 + rnd() * 0.7, right }
}

/** Plays a whole show without a clock and returns its record. Used to build the history of past shows. */
export function simulateResult(ctx: LiveContext, bots: Bot[], seed: number, pOverride: Record<Id, number> = {}): EpisodeResult {
  const rnd = mulberry32(seed)
  const scores: Record<Id, number> = Object.fromEntries(bots.map((b) => [b.id, 0]))
  const questions: QuestionResult[] = []
  ctx.episode.slots.forEach((slot, index) => {
    if (slot.kind !== 'question') return
    const q = ctx.questions.find((x) => x.id === slot.questionId)
    if (!q) return
    const key = ctx.keys[q.id]
    const limit = limitSecAt(ctx, index)
    const max = pointsAt(ctx, index)
    const counts: Record<Id, number> = {}
    const correctBy: Id[] = []
    let answered = 0
    let sec = 0
    for (const bot of bots) {
      if (rnd() < 0.06) continue // some players do not answer in time
      const move = botMove(q, key, bot, rnd, pOverride[q.id])
      if (!move.value) continue
      answered += 1
      sec += move.thinks * limit
      const r = scoreLive(q, key, move.value, 0, move.thinks * limit * 1000, limit, max)
      scores[bot.id] += r.points
      if (r.right) correctBy.push(bot.id)
      if (move.value.type === 'choice') for (const id of move.value.selected) counts[id] = (counts[id] ?? 0) + 1
    }
    questions.push({ questionId: q.id, answered, correct: correctBy.length, avgSec: answered ? Math.round((sec / answered) * 10) / 10 : 0, counts, correctBy })
  })
  return { participants: bots.length, questions, scores }
}

export const botsAsEpisodeNames = (bots: Bot[]): Record<Id, string> => Object.fromEntries(bots.map((b) => [b.id, b.name]))
export type { Episode }
