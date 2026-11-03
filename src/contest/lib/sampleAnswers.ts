import type { AnswerKey, AnswerValue, Question } from '../data/types'

/**
 * An example answer for a question: a right one or a wrong one, built from the key. Used to preview how a question looks
 * when answered, and to try the scoring. Returns null when there is nothing sensible to show (uploads, missing keys).
 */
export function sampleAnswer(q: Question, key: AnswerKey | null | undefined, right: boolean): AnswerValue | null {
  if (q.type === 'upload') return null
  if (q.type === 'long') return { type: 'text', text: 'Autumn, because the light is low and everything slows down.' }
  if (!key) return null
  switch (key.type) {
    case 'choice': {
      if (right) return { type: 'choice', selected: key.correct }
      const all = ('options' in q ? q.options : []).map((o) => o.id)
      const wrong = all.find((id) => !key.correct.includes(id))
      return { type: 'choice', selected: wrong ? [wrong] : [] }
    }
    case 'text': {
      const best = key.accepted.find((a) => a.text.trim())
      return { type: 'text', text: right ? best?.text ?? '' : 'Something else' }
    }
    case 'number': return { type: 'number', value: right ? key.value : key.value + key.tolerance * 3 + 1 }
    case 'ordering': return { type: 'ordering', order: right ? key.order : key.order.slice().reverse() }
    case 'matching': {
      const ids = Object.keys(key.pairs)
      const targets = Object.values(key.pairs)
      return { type: 'matching', pairs: Object.fromEntries(ids.map((id, i) => [id, right ? key.pairs[id] : targets[(i + 1) % targets.length]])) }
    }
    case 'manual': return null
  }
}
