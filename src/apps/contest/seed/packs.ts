/**
 * Fictional data for the content packs: the topics the questions are sorted into and three packs, the last one in force. The
 * pack in force has drifted from the bank, as a real one does: questions were approved after it was made, two were edited, one
 * was returned to review and one belongs to a topic that has been archived since. Plain data: nothing here renders anything.
 */
import type { AnswerKey, ContentPack, Id, PackItem, Question, Topic } from '@/contest/data/types'
import { itemsFor } from '@/contest/lib/packs'
import { day } from './time'

export const TOPICS: Topic[] = [
  { id: 'science', name: 'Science', archived: false },
  { id: 'geography', name: 'Geography', archived: false },
  { id: 'history', name: 'History', archived: false },
  { id: 'space', name: 'Space', archived: false },
  { id: 'maths', name: 'Maths', archived: false },
  { id: 'arts', name: 'Arts', archived: false },
  { id: 'music', name: 'Music', archived: false },
  { id: 'tech', name: 'Tech', archived: false },
  { id: 'language', name: 'Language', archived: false },
  { id: 'sport', name: 'Sport', archived: true },
]

const ACTIVE = TOPICS.filter((t) => !t.archived).map((t) => t.id)

export function seedPacks(bank: Question[], keys: Record<Id, AnswerKey>): ContentPack[] {
  const all = itemsFor(ACTIVE, bank, keys, TOPICS)

  const r1: ContentPack = { id: 'pack-r1', revision: 1, createdAt: day(-40, 10), createdBy: 'Cleo', note: 'First pack: science and geography only.', topics: ['science', 'geography'], items: all.filter((i) => ['science', 'geography'].includes(i.topic)).slice(0, 8), retiredAt: day(-20, 10) }
  const r2: ContentPack = { id: 'pack-r2', revision: 2, createdAt: day(-20, 10), createdBy: 'Bo', note: 'The six daily topics.', topics: ['science', 'geography', 'history', 'space', 'maths', 'arts'], items: all.filter((i) => ['science', 'geography', 'history', 'space', 'maths', 'arts'].includes(i.topic)).filter((_, i) => i % 3 !== 2), retiredAt: day(-6, 10) }

  // the pack in force: everything packable then, but three questions were approved after it, two were edited, one was returned, one topic was archived
  const later = all.slice(-3).map((i) => i.questionId)
  const before = all.filter((i) => !later.includes(i.questionId))
  const edited = before.slice(1, 3).map((i) => i.questionId)
  const items: PackItem[] = before.map((i) => (edited.includes(i.questionId) ? { ...i, version: day(-30, 9) } : i))
  const returned = bank.find((q) => q.id === 'q43')
  if (returned) items.push({ questionId: returned.id, topic: 'geography', version: day(-9, 9), difficulty: returned.difficulty })
  const archived = bank.find((q) => q.id === 'q28')
  if (archived) items.push({ questionId: archived.id, topic: 'sport', version: archived.updatedAt, difficulty: archived.difficulty })
  const r3: ContentPack = { id: 'pack-r3', revision: 3, createdAt: day(-6, 10), createdBy: 'Ada', note: 'All topics, after the question review of last week.', topics: [...ACTIVE, 'sport'], items }

  return [r1, r2, r3]
}
