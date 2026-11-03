import { AlignLeft, ArrowDownUp, CircleDot, Hash, Image as ImageIcon, Link2, ListChecks, TextCursorInput, ToggleLeft, Upload, type LucideIcon } from 'lucide-react'
import { mulberry32 } from '@/kit/lib/random'
import type { AnswerKey, AnswerValue, ChoiceOption, Id, Question, QuestionType } from '../data/types'

export interface QuestionTypeInfo {
  type: QuestionType
  label: string
  description: string
  icon: LucideIcon
  /** Which kind of answer key scores it. */
  key: AnswerKey['type']
}

export const QUESTION_TYPES: QuestionTypeInfo[] = [
  { type: 'single', label: 'Single choice', description: 'Pick one option.', icon: CircleDot, key: 'choice' },
  { type: 'multiple', label: 'Multiple choice', description: 'Pick every option that applies.', icon: ListChecks, key: 'choice' },
  { type: 'truefalse', label: 'True or false', description: 'A statement to judge.', icon: ToggleLeft, key: 'choice' },
  { type: 'image-choice', label: 'Picture choice', description: 'Pick one picture.', icon: ImageIcon, key: 'choice' },
  { type: 'short', label: 'Short answer', description: 'A word or a phrase, checked against accepted wordings.', icon: TextCursorInput, key: 'text' },
  { type: 'long', label: 'Long answer', description: 'Free writing that a person scores.', icon: AlignLeft, key: 'manual' },
  { type: 'number', label: 'Number', description: 'A number, with a tolerance.', icon: Hash, key: 'number' },
  { type: 'ordering', label: 'Ordering', description: 'Put the items in order.', icon: ArrowDownUp, key: 'ordering' },
  { type: 'matching', label: 'Matching', description: 'Pair each item on the left with one on the right.', icon: Link2, key: 'matching' },
  { type: 'upload', label: 'File upload', description: 'A photo or file that a person scores.', icon: Upload, key: 'manual' },
]

export const typeInfo = (type: QuestionType): QuestionTypeInfo => QUESTION_TYPES.find((t) => t.type === type)!

const opts = (labels: string[], prefix = 'o'): ChoiceOption[] => labels.map((label, i) => ({ id: `${prefix}${i + 1}`, label }))

/** A new, empty question of a type, ready to be filled in. */
export function newQuestion(type: QuestionType, id: Id): Question {
  const base = { id, prompt: '', mediaIds: [], points: 10, tags: [], status: 'draft' as const, updatedAt: new Date().toISOString() }
  switch (type) {
    case 'single': case 'multiple': return { ...base, type, options: opts(['Option A', 'Option B', 'Option C', 'Option D']) }
    case 'truefalse': return { ...base, type, options: [{ id: 't', label: 'True' }, { id: 'f', label: 'False' }] }
    case 'image-choice': return { ...base, type, options: opts(['Picture A', 'Picture B', 'Picture C']) }
    case 'short': return { ...base, type, maxLength: 60 }
    case 'long': return { ...base, type, maxLength: 500 }
    case 'number': return { ...base, type }
    case 'ordering': return { ...base, type, items: opts(['First', 'Second', 'Third'], 'i') }
    case 'matching': return { ...base, type, left: opts(['Left 1', 'Left 2'], 'l'), right: opts(['Right 1', 'Right 2'], 'r') }
    case 'upload': return { ...base, type, accept: 'image/*', maxMb: 5, maxFiles: 1 }
  }
}

/** An answer key that fits the question and awards nothing yet. */
export function blankKey(q: Question): AnswerKey {
  switch (typeInfo(q.type).key) {
    case 'choice': return { type: 'choice', correct: [], partialCredit: false }
    case 'text': return { type: 'text', accepted: [{ id: 'k1', text: '', credit: 1 }], caseSensitive: false, ignoreAccents: true, ignorePunctuation: true }
    case 'number': return { type: 'number', value: 0, tolerance: 0 }
    case 'ordering': return { type: 'ordering', order: q.type === 'ordering' ? q.items.map((i) => i.id) : [] }
    case 'matching': return { type: 'matching', pairs: {} }
    default: return { type: 'manual', rubric: [{ id: 'r1', label: 'Overall', maxPoints: q.points }] }
  }
}

/** Does the key still fit the question? A key goes stale when options are removed or the type changes. */
export function keyProblems(q: Question, key: AnswerKey | null | undefined): string[] {
  if (!key) return ['There is no answer key yet.']
  const wanted = typeInfo(q.type).key
  if (key.type !== wanted) return [`A ${typeInfo(q.type).label.toLowerCase()} question needs a ${wanted} key, but the key is a ${key.type} key.`]
  const problems: string[] = []
  if (key.type === 'choice' && 'options' in q) {
    if (key.correct.length === 0) problems.push('No correct option is marked.')
    if (key.correct.some((id) => !q.options.some((o) => o.id === id))) problems.push('The key marks an option that no longer exists.')
    if (q.type !== 'multiple' && key.correct.length > 1) problems.push('Only one option can be right for this type.')
  }
  if (key.type === 'text' && !key.accepted.some((a) => a.text.trim())) problems.push('Add at least one accepted wording.')
  if (key.type === 'matching' && q.type === 'matching') {
    const missing = q.left.filter((l) => !key.pairs[l.id])
    if (missing.length) problems.push(`${missing.length} item${missing.length > 1 ? 's' : ''} on the left ${missing.length > 1 ? 'have' : 'has'} no match in the key.`)
  }
  if (key.type === 'manual' && key.rubric.reduce((s, r) => s + r.maxPoints, 0) !== q.points) problems.push(`The rubric adds up to ${key.rubric.reduce((s, r) => s + r.maxPoints, 0)} points, but the question is worth ${q.points}.`)
  return problems
}

export function isAnswered(v: AnswerValue | null | undefined): boolean {
  if (!v) return false
  switch (v.type) {
    case 'choice': return v.selected.length > 0
    case 'text': return v.text.trim().length > 0
    case 'number': return v.value !== null && !Number.isNaN(v.value)
    case 'ordering': return v.order.length > 0
    case 'matching': return Object.keys(v.pairs).length > 0
    case 'upload': return v.mediaIds.length > 0
  }
}

/** A stable shuffle: the same question shows the same order every time, so nothing hints at the right one. */
export function shuffled<T extends { id: string }>(items: T[], seed: string): T[] {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const rnd = mulberry32(h >>> 0)
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The options of a question, whichever kind it is. */
export const optionsOf = (q: Question): ChoiceOption[] => ('options' in q ? q.options : 'items' in q ? q.items : [])

/**
 * Turns a question into another type. The shared fields (prompt, media, points, time, hint, explanation, tags, status)
 * come along; options come along between the choice types. The answer key must be made again.
 */
export function convertQuestion(q: Question, type: QuestionType): Question {
  if (q.type === type) return q
  const fresh = newQuestion(type, q.id)
  const merged = { ...fresh, prompt: q.prompt, mediaIds: q.mediaIds, points: q.points, timeLimitSec: q.timeLimitSec, hint: q.hint, explanation: q.explanation, tags: q.tags, status: q.status } as Question
  const carry = ['single', 'multiple', 'image-choice']
  if ('options' in q && carry.includes(q.type) && carry.includes(type) && 'options' in merged) merged.options = q.options
  return merged
}

/** The answer key as one sentence a reviewer can read: "Right: Jupiter", "Accepted: Canberra, Canbera (50%)". */
export function describeKey(q: Question, key: AnswerKey | null | undefined): string {
  if (!key) return 'There is no answer key.'
  const label = (list: ChoiceOption[], id: Id) => list.find((o) => o.id === id)?.label ?? id
  switch (key.type) {
    case 'choice':
      return `Right: ${key.correct.map((id) => label(optionsOf(q), id)).join(', ') || 'nothing is marked'}`
    case 'text':
      return `Accepted: ${key.accepted.filter((a) => a.text.trim()).map((a) => (a.credit < 1 ? `${a.text} (${Math.round(a.credit * 100)}%)` : a.text)).join(', ') || 'nothing yet'}`
    case 'number':
      return `Right: ${key.value}${q.type === 'number' && q.unit ? ` ${q.unit}` : ''}${key.tolerance ? `, ±${key.tolerance} counts` : ''}`
    case 'ordering':
      return `Right order: ${q.type === 'ordering' ? key.order.map((id) => label(q.items, id)).join(' → ') : ''}`
    case 'matching':
      return q.type === 'matching' ? `Right pairs: ${Object.entries(key.pairs).map(([l, r]) => `${label(q.left, l)} → ${label(q.right, r)}`).join('; ')}` : ''
    case 'manual':
      return `A person scores it: ${key.rubric.map((r) => `${r.label} (${r.maxPoints})`).join(', ')}`
  }
}
