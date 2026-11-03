/**
 * Scoring: how an answer is compared with its key. Pure functions, no React, so the same code scores a real submission,
 * the "try an answer" box in the answer key editor, and the dry run.
 */
import type { AcceptedText, Answer, AnswerKey, AnswerValue, Question, Score } from '../data/types'

/** Why an answer got the points it got, in words a reviewer can read. */
export interface ScoreResult extends Score {
  reason: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

export interface TextRules {
  caseSensitive: boolean
  ignoreAccents: boolean
  ignorePunctuation: boolean
}

/** Lowercases, strips accents and punctuation and collapses spaces, as far as the rules ask for it. */
export function normalizeText(text: string, rules: TextRules): string {
  let t = text.normalize('NFC').trim()
  if (rules.ignoreAccents) t = t.normalize('NFD').replace(/\p{M}+/gu, '')
  if (!rules.caseSensitive) t = t.toLocaleLowerCase('en-US')
  if (rules.ignorePunctuation) t = t.replace(/[\p{P}\p{S}]+/gu, ' ')
  return t.replace(/\s+/g, ' ').trim()
}

/** The accepted wording a text answer matches, or null. */
export function matchAccepted(text: string, accepted: AcceptedText[], rules: TextRules): AcceptedText | null {
  const given = normalizeText(text, rules)
  if (!given) return null
  return accepted.find((a) => normalizeText(a.text, rules) === given) ?? null
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/**
 * Scores one answer. `max` is the question's points. Answers that need a person (uploads, long answers) get 0 points and
 * `auto: false` until someone scores them.
 */
export function scoreAnswer(question: Pick<Question, 'points' | 'type'>, key: AnswerKey | null | undefined, answer: AnswerValue | null | undefined): ScoreResult {
  const max = question.points
  const none = (reason: string): ScoreResult => ({ points: 0, max, auto: true, reason })

  if (!key) return { points: 0, max, auto: false, reason: 'There is no answer key for this question yet.' }
  if (key.type === 'manual') return { points: 0, max, auto: false, reason: 'A reviewer scores this answer.' }
  if (!answer) return none('No answer was given.')

  switch (key.type) {
    case 'choice': {
      if (answer.type !== 'choice') return none('The answer has the wrong shape for this question.')
      if (answer.selected.length === 0) return none('Nothing was selected.')
      if (sameSet(answer.selected, key.correct)) return { points: max, max, auto: true, reason: 'Every correct option, and only those, was selected.' }
      if (key.partialCredit && key.correct.length > 1) {
        const right = answer.selected.filter((s) => key.correct.includes(s)).length
        const wrong = answer.selected.length - right
        const share = Math.max(0, (right - wrong) / key.correct.length)
        return { points: round2(max * share), max, auto: true, reason: `${right} of ${key.correct.length} correct options, ${wrong} wrong.` }
      }
      return none('The selection does not match the key.')
    }
    case 'text': {
      if (answer.type !== 'text') return none('The answer has the wrong shape for this question.')
      const hit = matchAccepted(answer.text, key.accepted, key)
      if (!hit) return none(answer.text.trim() ? 'The text matches no accepted wording.' : 'The answer is empty.')
      return { points: round2(max * hit.credit), max, auto: true, reason: `Matches "${hit.text}"${hit.credit < 1 ? ` for ${Math.round(hit.credit * 100)}% credit` : ''}.` }
    }
    case 'number': {
      if (answer.type !== 'number' || answer.value === null || Number.isNaN(answer.value)) return none('No number was given.')
      const off = Math.abs(answer.value - key.value)
      return off <= key.tolerance
        ? { points: max, max, auto: true, reason: off === 0 ? 'Exactly right.' : `Within the tolerance of ${key.tolerance} (off by ${round2(off)}).` }
        : none(`Off by ${round2(off)}; the tolerance is ${key.tolerance}.`)
    }
    case 'ordering': {
      if (answer.type !== 'ordering') return none('The answer has the wrong shape for this question.')
      const inPlace = answer.order.filter((id, i) => key.order[i] === id).length
      if (inPlace === key.order.length && answer.order.length === key.order.length) return { points: max, max, auto: true, reason: 'The order is exactly right.' }
      return { points: 0, max, auto: true, reason: `${inPlace} of ${key.order.length} items are in the right place; ordering is all or nothing.` }
    }
    case 'matching': {
      if (answer.type !== 'matching') return none('The answer has the wrong shape for this question.')
      const total = Object.keys(key.pairs).length
      const right = Object.entries(key.pairs).filter(([l, r]) => answer.pairs[l] === r).length
      return { points: total ? round2((max * right) / total) : 0, max, auto: true, reason: `${right} of ${total} pairs are right.` }
    }
  }
}

/** Scores every answer of a submission against the keys. Questions without an answer score 0. */
export function scoreSubmission(questions: Question[], keys: Record<string, AnswerKey>, answers: Answer[]): Record<string, ScoreResult> {
  const out: Record<string, ScoreResult> = {}
  for (const q of questions) {
    const given = answers.find((a) => a.questionId === q.id)
    out[q.id] = scoreAnswer(q, keys[q.id], given?.value)
  }
  return out
}

export const totalPoints = (scores: Record<string, Score>): number => round2(Object.values(scores).reduce((sum, s) => sum + s.points, 0))
export const totalMax = (questions: Pick<Question, 'points'>[]): number => questions.reduce((sum, q) => sum + q.points, 0)
