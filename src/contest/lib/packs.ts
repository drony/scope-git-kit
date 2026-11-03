/**
 * Content packs as plain functions: which approved questions can go into a pack, what a pack would contain, how the bank has moved
 * since the pack in force was made, how many shows each topic can still feed, and what is wrong with a pack before it is
 * published. A pack is a snapshot: it pins every question to the version it had, so editing the bank never changes what is served.
 */
import type { AnswerKey, ContentPack, Difficulty, Id, PackItem, Question, Topic, WeeklyProgram } from '../data/types'
import { readiness } from './quick'
import { stageOf } from './review'

/** Questions in a daily show, for working out how long a topic lasts. */
export const QUESTIONS_PER_SHOW = 6
/** A topic with less than this many shows of supply is thin. */
export const THIN_WEEKS = 4

/** The topic of a question: the first of its tags that is a topic. */
export function topicOf(q: Pick<Question, 'tags'>, topics: Topic[]): Topic | undefined {
  for (const tag of q.tags) {
    const t = topics.find((x) => x.id === tag)
    if (t) return t
  }
  return undefined
}

/** A question can go into a pack when it is approved, has a topic that is not archived, and has nothing left to fix. */
export function isPackable(q: Question, topics: Topic[], key: AnswerKey | null | undefined): boolean {
  const t = topicOf(q, topics)
  return stageOf(q) === 'approved' && Boolean(t) && !t!.archived && readiness(q, key).length === 0
}

export const activePack = (packs: ContentPack[]): ContentPack | undefined => [...packs].filter((p) => !p.retiredAt).sort((a, b) => b.revision - a.revision)[0]

/** What a pack made now from these topics would hold: every packable question of the topics, pinned to its current version. */
export function itemsFor(topicIds: string[], bank: Question[], keys: Record<Id, AnswerKey>, topics: Topic[]): PackItem[] {
  const out: PackItem[] = []
  for (const q of bank) {
    const t = topicOf(q, topics)
    if (t && topicIds.includes(t.id) && isPackable(q, topics, keys[q.id])) out.push({ questionId: q.id, topic: t.id, version: q.updatedAt, difficulty: q.difficulty })
  }
  return out.sort((a, b) => a.questionId.localeCompare(b.questionId, undefined, { numeric: true }))
}

export interface PackDiff {
  /** Packable questions of the pack's topics that are not in the pack. */
  added: Question[]
  /** In the pack, still approved, but edited since. The pack serves the old version. */
  changed: Question[]
  /** In the pack, but no longer approved or gone. The pack still serves them. */
  withdrawn: { item: PackItem; question?: Question }[]
  /** In the pack, in a topic that is archived now. */
  archived: Question[]
  unchanged: number
}

/** How the bank has moved since a pack was made. */
export function diffPack(pack: ContentPack, bank: Question[], keys: Record<Id, AnswerKey>, topics: Topic[]): PackDiff {
  const byId = new Map(bank.map((q) => [q.id, q]))
  const inPack = new Set(pack.items.map((i) => i.questionId))
  const out: PackDiff = { added: [], changed: [], withdrawn: [], archived: [], unchanged: 0 }
  for (const item of pack.items) {
    const q = byId.get(item.questionId)
    if (!q || stageOf(q) !== 'approved') out.withdrawn.push({ item, question: q })
    else if (topics.find((t) => t.id === item.topic)?.archived) out.archived.push(q)
    else if (q.updatedAt !== item.version) out.changed.push(q)
    else out.unchanged += 1
  }
  for (const q of bank) if (!inPack.has(q.id) && pack.topics.includes(topicOf(q, topics)?.id ?? '') && isPackable(q, topics, keys[q.id])) out.added.push(q)
  return out
}

export const driftCount = (d: PackDiff) => d.added.length + d.changed.length + d.withdrawn.length + d.archived.length

/* ---- Coverage ---------------------------------------------------------------------------------------------------- */

export type CoverageState = 'ready' | 'thin' | 'missing' | 'archived'

export interface TopicCoverage {
  topic: Topic
  /** Packable questions in the bank now. */
  available: number
  /** Questions of this topic in the pack in force. */
  served: number
  /** How many of them are of each level 1 to 5; index 0 is "no level". */
  levels: number[]
  /** Daily shows of the program on this topic each week. */
  showsPerWeek: number
  /** How many weeks of those shows the served questions last, or null when no show uses the topic. */
  weeks: number | null
  state: CoverageState
}

const levelOf = (d?: Difficulty) => d ?? 0

/** Per topic: what the bank could give, what the pack serves, the levels, and how long it lasts for the daily shows. */
export function coverage(topics: Topic[], bank: Question[], keys: Record<Id, AnswerKey>, pack: ContentPack | undefined, program: WeeklyProgram): TopicCoverage[] {
  return topics.map((topic) => {
    const available = bank.filter((q) => topicOf(q, topics)?.id === topic.id && isPackable(q, topics, keys[q.id]))
    const served = pack ? pack.items.filter((i) => i.topic === topic.id) : []
    const levels = [0, 0, 0, 0, 0, 0]
    for (const i of served) levels[levelOf(i.difficulty)] += 1
    const showsPerWeek = program.slots.filter((s) => s.kind === 'daily' && s.topic === topic.id).length
    const weeks = showsPerWeek > 0 ? Math.floor(served.length / (QUESTIONS_PER_SHOW * showsPerWeek)) : null
    const state: CoverageState = topic.archived ? 'archived' : !pack || !pack.topics.includes(topic.id) || served.length === 0 ? 'missing' : weeks !== null && weeks < THIN_WEEKS ? 'thin' : 'ready'
    return { topic, available: available.length, served: served.length, levels, showsPerWeek, weeks, state }
  })
}

/* ---- Before publishing ------------------------------------------------------------------------------------------- */

export interface PackProblem {
  level: 'error' | 'warning'
  topic?: string
  text: string
}

/** What is wrong with publishing these topics now. An error stops it; a warning is shown and can be published over. */
export function packProblems(topicIds: string[], bank: Question[], keys: Record<Id, AnswerKey>, topics: Topic[], program: WeeklyProgram, active?: ContentPack): PackProblem[] {
  const out: PackProblem[] = []
  if (topicIds.length === 0) return [{ level: 'error', text: 'Choose at least one topic.' }]
  const items = itemsFor(topicIds, bank, keys, topics)
  for (const id of topicIds) {
    const t = topics.find((x) => x.id === id)
    if (!t) out.push({ level: 'error', topic: id, text: `${id} is not a topic.` })
    else if (t.archived) out.push({ level: 'error', topic: id, text: `${t.name} is archived. Bring it back before it goes into a pack.` })
    else {
      const mine = items.filter((i) => i.topic === id)
      if (mine.length === 0) out.push({ level: 'error', topic: id, text: `${t.name} has no approved question. A show on it would have nothing to ask.` })
      else {
        const shows = program.slots.filter((s) => s.kind === 'daily' && s.topic === id).length
        const weeks = shows > 0 ? Math.floor(mine.length / (QUESTIONS_PER_SHOW * shows)) : null
        if (weeks === 0) out.push({ level: 'warning', topic: id, text: `${t.name} has ${mine.length} question${mine.length === 1 ? '' : 's'}: less than one week of its daily show.` })
        else if (weeks !== null && weeks < THIN_WEEKS) out.push({ level: 'warning', topic: id, text: `${t.name} lasts ${weeks} week${weeks === 1 ? '' : 's'} of its daily show.` })
        if (!mine.some((i) => (i.difficulty ?? 0) >= 4)) out.push({ level: 'warning', topic: id, text: `${t.name} has no question of level 4 or 5: a show on it has a flat curve.` })
      }
    }
  }
  const loose = bank.filter((q) => stageOf(q) === 'approved' && !topicOf(q, topics))
  if (loose.length > 0) out.push({ level: 'warning', text: `${loose.length} approved question${loose.length === 1 ? ' has' : 's have'} no topic and stay${loose.length === 1 ? 's' : ''} out of every pack.` })
  const broken = bank.filter((q) => stageOf(q) === 'approved' && topicOf(q, topics) && readiness(q, keys[q.id]).length > 0)
  if (broken.length > 0) out.push({ level: 'warning', text: `${broken.length} approved question${broken.length === 1 ? ' is' : 's are'} not ready (${readiness(broken[0], keys[broken[0].id])[0]}) and stay${broken.length === 1 ? 's' : ''} out.` })
  if (active && items.length === active.items.length && items.every((i) => active.items.some((a) => a.questionId === i.questionId && a.version === i.version)) && topicIds.slice().sort().join() === active.topics.slice().sort().join()) out.push({ level: 'error', text: `Nothing changed since revision ${active.revision}.` })
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

/** A new pack from the bank as it is now. The caller gives the id, the revision and the time. */
export function buildPack(topicIds: string[], bank: Question[], keys: Record<Id, AnswerKey>, topics: Topic[], meta: { id: Id; revision: number; at: string; by: string; note: string }): ContentPack {
  return { id: meta.id, revision: meta.revision, createdAt: meta.at, createdBy: meta.by, note: meta.note.trim(), topics: [...topicIds], items: itemsFor(topicIds, bank, keys, topics) }
}

/**
 * A new pack that restores an older one: the same topics and the same pinned versions, except for questions that are no longer
 * approved, which stay out (a rollback never serves a question that was withdrawn). `dropped` says how many were left out.
 */
export function restoreItems(old: ContentPack, bank: Question[]): { items: PackItem[]; dropped: number } {
  const byId = new Map(bank.map((q) => [q.id, q]))
  const items = old.items.filter((i) => {
    const q = byId.get(i.questionId)
    return q && stageOf(q) === 'approved'
  })
  return { items, dropped: old.items.length - items.length }
}

/** Packs of a topic over time, newest first: how many questions it held in each. */
export const countsByPack = (packs: ContentPack[], topicId: string) => [...packs].sort((a, b) => b.revision - a.revision).map((p) => ({ revision: p.revision, count: p.items.filter((i) => i.topic === topicId).length }))
