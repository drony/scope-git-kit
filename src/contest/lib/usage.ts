import type { ChoiceOption, Id, Question } from '../data/types'

const optionLists = (q: Question): ChoiceOption[] => ('options' in q ? q.options : 'items' in q ? q.items : 'left' in q ? [...q.left, ...q.right] : [])

/** Every media id a question uses: attached to the prompt, or on one of its options. Each id once. */
export function mediaIdsOf(q: Question): Id[] {
  return [...new Set([...q.mediaIds, ...optionLists(q).flatMap((o) => (o.mediaId ? [o.mediaId] : []))])]
}

/** How many questions use each media file, by id. Files no question uses are left out. */
export function mediaUsage(questions: Question[]): Record<Id, number> {
  const out: Record<Id, number> = {}
  for (const q of questions) for (const id of mediaIdsOf(q)) out[id] = (out[id] ?? 0) + 1
  return out
}
