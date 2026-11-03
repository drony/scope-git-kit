/**
 * What past shows say about each question: the share of right answers, the average time, and whether strong players did
 * better than weak ones (discrimination). A question that everyone, or nobody, gets right tells you little; one that the
 * best players get right and the others miss separates them. Discrimination below 0.25 is worth a second look.
 */
import type { Episode, Id, IsoDate, Question } from '../data/types'
import { MIN_ANSWERS } from './difficulty'

export interface QuestionStat {
  questionId: Id
  answered: number
  correct: number
  /** Share of right answers, 0 to 1. Null when nobody has answered. */
  p: number | null
  avgSec: number | null
  /** Right in the top group minus right in the bottom group, −1 to 1. Null without enough data. */
  discrimination: number | null
  /** True once there are enough answers to trust `p`. */
  reliable: boolean
  /** In how many shows it was used (finished or planned). */
  uses: number
  lastUsed?: IsoDate
}

/** The share of players that counts as the top and the bottom group. */
const GROUP = 0.27

export function questionStats(questions: Question[], episodes: Episode[]): Record<Id, QuestionStat> {
  const acc = new Map<Id, { answered: number; correct: number; sec: number; topRight: number; topN: number; botRight: number; botN: number; uses: number; lastUsed?: IsoDate }>()
  const entry = (id: Id) => {
    if (!acc.has(id)) acc.set(id, { answered: 0, correct: 0, sec: 0, topRight: 0, topN: 0, botRight: 0, botN: 0, uses: 0 })
    return acc.get(id)!
  }

  for (const ep of episodes) {
    if (ep.status === 'draft') continue
    for (const slot of ep.slots) {
      if (slot.kind !== 'question') continue
      const e = entry(slot.questionId)
      e.uses += 1
      if (!e.lastUsed || ep.startsAt > e.lastUsed) e.lastUsed = ep.startsAt
    }
    const result = ep.result
    if (!result) continue
    const ranked = Object.entries(result.scores).sort((a, b) => b[1] - a[1]).map(([id]) => id)
    const n = Math.max(1, Math.round(ranked.length * GROUP))
    const top = new Set(ranked.slice(0, n))
    const bottom = new Set(ranked.slice(-n))
    for (const r of result.questions) {
      const e = entry(r.questionId)
      e.answered += r.answered
      e.correct += r.correct
      e.sec += r.avgSec * r.answered
      const right = new Set(r.correctBy)
      e.topN += top.size
      e.botN += bottom.size
      e.topRight += [...top].filter((id) => right.has(id)).length
      e.botRight += [...bottom].filter((id) => right.has(id)).length
    }
  }

  return Object.fromEntries(
    questions.map((q) => {
      const e = acc.get(q.id)
      const stat: QuestionStat = {
        questionId: q.id,
        answered: e?.answered ?? 0,
        correct: e?.correct ?? 0,
        p: e && e.answered > 0 ? e.correct / e.answered : null,
        avgSec: e && e.answered > 0 ? Math.round((e.sec / e.answered) * 10) / 10 : null,
        discrimination: e && e.answered >= MIN_ANSWERS && e.topN > 0 && e.botN > 0 ? Math.round((e.topRight / e.topN - e.botRight / e.botN) * 100) / 100 : null,
        reliable: (e?.answered ?? 0) >= MIN_ANSWERS,
        uses: e?.uses ?? 0,
        lastUsed: e?.lastUsed,
      }
      return [q.id, stat]
    }),
  )
}
