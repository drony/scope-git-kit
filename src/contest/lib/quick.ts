/**
 * Helpers for fast question entry: what a question still needs before it can go live, and a reader for a pasted list of
 * questions so a writer can type or paste many at once.
 */
import type { AnswerKey, ChoiceOption, Difficulty, Question } from '../data/types'
import { LEVELS } from './difficulty'
import { suggestTimeSec } from './episode'
import { blankKey, keyProblems, newQuestion } from './questionTypes'

export const POINTS_BY_LEVEL: Record<Difficulty, number> = { 1: 10, 2: 10, 3: 15, 4: 20, 5: 25 }

/** Points and time that go with a level and a question type, unless the writer chose their own. */
export const defaultsFor = (q: Pick<Question, 'type'>, level: Difficulty) => ({ points: POINTS_BY_LEVEL[level], timeLimitSec: suggestTimeSec({ type: q.type, difficulty: level }) })

/** What is still missing before a question can be published, in plain words. An empty list means it is ready. */
export function readiness(q: Question, key: AnswerKey | null | undefined): string[] {
  const out: string[] = []
  if (!q.prompt.trim()) out.push('Write the question.')
  const filled = (list: ChoiceOption[]) => list.filter((o) => o.label.trim())
  if ('options' in q) {
    if (q.type !== 'truefalse' && filled(q.options).length < 2) out.push('Add at least two options.')
    if (key?.type === 'choice' && key.correct.length === 0) out.push(q.type === 'multiple' ? 'Mark the right answers.' : 'Mark the right answer.')
  }
  if (q.type === 'ordering' && filled(q.items).length < 2) out.push('Add at least two items.')
  if (q.type === 'matching' && (filled(q.left).length < 2 || q.left.some((l, i) => !l.label.trim() || !q.right[i]?.label.trim()))) out.push('Fill in every pair.')
  if (key?.type === 'text' && !key.accepted.some((a) => a.text.trim())) out.push('Type the right answer.')
  if (key?.type === 'number' && Number.isNaN(key.value)) out.push('Type the right number.')
  if (out.length === 0) out.push(...keyProblems(q, key).filter((p) => !/no correct option|accepted wording/i.test(p)))
  return out
}

export interface ParsedQuestion {
  question: Question
  key: AnswerKey
  problems: string[]
}

const MARK = /^\s*(?:\*|✓|✔|\[x\])\s*/i
const BULLET = /^\s*(?:[a-hA-H][).]|\d+[).]|[-•])\s+/

const levelOf = (text: string): Difficulty | undefined => {
  const n = Number(text)
  if (n >= 1 && n <= 5) return n as Difficulty
  return LEVELS.find((l) => l.name.toLowerCase() === text.trim().toLowerCase())?.level
}

/**
 * Reads a pasted list of questions. Blocks are separated by a blank line. The first line is the question; the lines under it
 * are the options. Mark the right option with `*` (or ✓), or add a line `Answer: B` / `Answer: Mercury`. A block with no options
 * but an answer is a short answer, or a number when the answer is one. Two options "True" and "False" make a true-or-false.
 * Optional lines: `Tags: space, planets` and `Level: 3` (a number, or Warm-up, Easy, Medium, Hard, Finale).
 */
export function parseQuestions(text: string, idPrefix = 'n'): ParsedQuestion[] {
  const out: ParsedQuestion[] = []
  for (const block of text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    const prompt = lines.shift()!.replace(/^\d+[).]\s*/, '').replace(/^(q|question)\s*:\s*/i, '')
    let answer = ''
    let tags: string[] = []
    let level: Difficulty | undefined
    const options: Array<{ label: string; right: boolean }> = []
    for (const line of lines) {
      const meta = line.match(/^(answer|tags?|level|difficulty)\s*:\s*(.+)$/i)
      if (meta) {
        const k = meta[1].toLowerCase()
        if (k === 'answer') answer = meta[2].trim()
        else if (k.startsWith('tag')) tags = meta[2].split(/[,#]/).map((t) => t.trim()).filter(Boolean)
        else level = levelOf(meta[2])
        continue
      }
      const right = MARK.test(line)
      options.push({ label: line.replace(MARK, '').replace(BULLET, '').trim(), right })
    }
    const id = `${idPrefix}${out.length + 1}`
    const letter = answer.match(/^[a-h]$/i)?.[0].toLowerCase()
    options.forEach((o, i) => {
      if (answer && (letter ? String.fromCharCode(97 + i) === letter : o.label.toLowerCase() === answer.toLowerCase())) o.right = true
    })
    const level3 = level ?? 3
    const base = { prompt, tags, difficulty: level3, ...defaultsFor({ type: 'single' }, level3) }
    let question: Question
    let key: AnswerKey
    const isTF = options.length === 2 && options.every((o) => /^(true|false)$/i.test(o.label))
    if (isTF) {
      question = { ...newQuestion('truefalse', id), ...base }
      const rightId = options.find((o) => o.right)?.label.toLowerCase() === 'true' ? 't' : 'f'
      key = { type: 'choice', correct: options.some((o) => o.right) ? [rightId] : [], partialCredit: false }
    } else if (options.length >= 2) {
      const multiple = options.filter((o) => o.right).length > 1
      const q = newQuestion(multiple ? 'multiple' : 'single', id)
      const opts: ChoiceOption[] = options.map((o, i) => ({ id: `o${i + 1}`, label: o.label }))
      question = { ...q, ...base, options: opts } as Question
      key = { type: 'choice', correct: options.flatMap((o, i) => (o.right ? [`o${i + 1}`] : [])), partialCredit: multiple }
    } else if (answer && !Number.isNaN(Number(answer.replace(',', '.')))) {
      question = { ...newQuestion('number', id), ...base }
      key = { type: 'number', value: Number(answer.replace(',', '.')), tolerance: 0 }
    } else {
      question = { ...newQuestion('short', id), ...base }
      key = { ...blankKey(question), type: 'text', accepted: [{ id: 'k1', text: answer, credit: 1 }], caseSensitive: false, ignoreAccents: true, ignorePunctuation: true }
    }
    out.push({ question, key, problems: readiness(question, key) })
  }
  return out
}

/** Drops empty option rows (keeping at least two) and keeps the answer key in step. Used when a question is finished. */
export function tidy(q: Question, key: AnswerKey): { question: Question; key: AnswerKey } {
  const filled = (list: ChoiceOption[]) => {
    const kept = list.filter((o) => o.label.trim())
    return kept.length >= 2 ? kept : list
  }
  if ('options' in q && q.type !== 'truefalse') {
    const options = filled(q.options)
    return { question: { ...q, options }, key: key.type === 'choice' ? { ...key, correct: key.correct.filter((id) => options.some((o) => o.id === id)) } : key }
  }
  if (q.type === 'ordering') {
    const items = filled(q.items)
    return { question: { ...q, items }, key: { type: 'ordering', order: items.map((i) => i.id) } }
  }
  return { question: q, key }
}
