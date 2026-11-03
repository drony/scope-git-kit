/**
 * Planning a weekly show: how long each question should run, the running order with clock times, the checks that say what is
 * wrong with a line-up before it goes on air, and a suggestion that fills a line-up from the question bank.
 */
import type { AnswerKey, Difficulty, Episode, EpisodeSlot, Id, Question, QuestionType } from '../data/types'
import { LEVELS, observedLevel } from './difficulty'
import { keyProblems } from './questionTypes'
import { isWikipediaOnly, sourceState } from './sources'
import type { QuestionStat } from './stats'

export const READING_SEC = 3
export const REVEAL_SEC = 8
export const LOBBY_MIN = 10
export const INTRO_SEC = 60
export const WRAP_SEC = 60
export const POLL_SEC = 30
export const TIME_PRESETS = [10, 15, 20, 30, 45, 60, 90]

const BASE_TIME: Record<QuestionType, number> = { truefalse: 15, single: 20, 'image-choice': 20, multiple: 30, short: 30, number: 40, ordering: 45, matching: 60, long: 120, upload: 180 }

/** A sensible time for a question: by its type, a little more for harder ones. True or false needs about 15 seconds, a hard multiple choice more. */
export function suggestTimeSec(q: Pick<Question, 'type' | 'difficulty'>): number {
  const extra = Math.max(0, (q.difficulty ?? 3) - 3) * 5
  return BASE_TIME[q.type] + extra
}

export const questionSlots = (episode: Episode) => episode.slots.filter((s): s is Extract<EpisodeSlot, { kind: 'question' }> => s.kind === 'question')

/** Seconds a slot takes on air, from the moment it starts. */
export function slotSeconds(slot: EpisodeSlot, questions: Question[]): number {
  if (slot.kind === 'break') return slot.sec
  if (slot.kind === 'poll') return POLL_SEC
  const q = questions.find((x) => x.id === slot.questionId)
  return READING_SEC + (slot.timeSec ?? q?.timeLimitSec ?? 20) + REVEAL_SEC
}

export const episodeSeconds = (episode: Episode, questions: Question[]): number => INTRO_SEC + WRAP_SEC + episode.slots.reduce((n, s) => n + slotSeconds(s, questions), 0)

export interface ShowItem {
  id: string
  kind: 'lobby' | 'intro' | 'question' | 'break' | 'poll' | 'wrap'
  label: string
  /** Clock time the item starts, as an ISO date-time. */
  at: string
  seconds: number
  slotId?: Id
}

/** The running order with clock times: the lobby opens before the start, then the show runs item by item. */
export function runOfShow(episode: Episode, questions: Question[]): ShowItem[] {
  const start = new Date(episode.startsAt).getTime()
  const items: ShowItem[] = [{ id: 'lobby', kind: 'lobby', label: 'Lobby opens', at: new Date(start - LOBBY_MIN * 60_000).toISOString(), seconds: LOBBY_MIN * 60 }]
  let t = start
  const push = (item: Omit<ShowItem, 'at'>) => {
    items.push({ ...item, at: new Date(t).toISOString() })
    t += item.seconds * 1000
  }
  push({ id: 'intro', kind: 'intro', label: 'Welcome', seconds: INTRO_SEC })
  let n = 0
  for (const slot of episode.slots) {
    if (slot.kind === 'question') {
      n += 1
      const q = questions.find((x) => x.id === slot.questionId)
      push({ id: slot.id, slotId: slot.id, kind: 'question', label: `Q${n}${q ? `: ${q.prompt}` : ''}`, seconds: slotSeconds(slot, questions) })
    } else push({ id: slot.id, slotId: slot.id, kind: slot.kind, label: slot.kind === 'break' ? 'Break' : 'Poll', seconds: slotSeconds(slot, questions) })
  }
  push({ id: 'wrap', kind: 'wrap', label: 'Wrap-up and results', seconds: WRAP_SEC })
  return items
}

export interface ShowCheck {
  id: string
  level: 'error' | 'warn' | 'info'
  message: string
  slotId?: Id
}

/**
 * What is wrong with a line-up before it goes on air. Errors block; warnings are worth a second look. With the pack in force, a
 * question that is approved but not in it is a warning: the shows are served from the pack.
 */
export function episodeChecks(episode: Episode, questions: Question[], keys: Record<Id, AnswerKey>, pack?: { ids: ReadonlySet<Id>; revision: number }): ShowCheck[] {
  const out: ShowCheck[] = []
  const slots = questionSlots(episode)
  if (slots.length === 0) return [{ id: 'empty', level: 'error', message: 'Add at least one question.' }]

  const levels: number[] = []
  let previousTag: string | undefined
  slots.forEach((slot, i) => {
    const q = questions.find((x) => x.id === slot.questionId)
    const label = `Q${i + 1}`
    if (!q) return void out.push({ id: `gone-${slot.id}`, level: 'error', message: `${label} is a question that no longer exists.`, slotId: slot.id })
    if (q.status === 'draft') out.push({ id: `draft-${slot.id}`, level: 'error', message: `${label} is still a draft.`, slotId: slot.id })
    if (pack && q.status === 'published' && !pack.ids.has(q.id)) out.push({ id: `pack-${slot.id}`, level: 'warn', message: `${label} is approved but not in the pack in force (revision ${pack.revision}). Publish a new pack first.`, slotId: slot.id })
    const problem = keyProblems(q, keys[q.id])[0]
    if (problem) out.push({ id: `key-${slot.id}`, level: 'error', message: `${label}: ${problem}`, slotId: slot.id })
    else if (keys[q.id]?.type === 'manual') out.push({ id: `manual-${slot.id}`, level: 'error', message: `${label} needs a person to score it, so it cannot run live.`, slotId: slot.id })
    const state = sourceState(q.source)
    if (state === 'missing') out.push({ id: `src-${slot.id}`, level: 'warn', message: `${label} has no source.`, slotId: slot.id })
    else if (isWikipediaOnly(q.source)) out.push({ id: `src-${slot.id}`, level: 'warn', message: `${label} cites only Wikipedia. Find a second source.`, slotId: slot.id })
    else if (state === 'unchecked') out.push({ id: `src-${slot.id}`, level: 'info', message: `${label}: the source is not checked yet.`, slotId: slot.id })
    if (!q.difficulty) out.push({ id: `lvl-${slot.id}`, level: 'warn', message: `${label} has no difficulty level.`, slotId: slot.id })
    else levels.push(q.difficulty)
    const seconds = slot.timeSec ?? q.timeLimitSec ?? 20
    const min = Math.round(suggestTimeSec(q) * 0.6)
    if (seconds < min) out.push({ id: `time-${slot.id}`, level: 'warn', message: `${label} gives ${seconds} s; a ${q.type} question usually needs about ${suggestTimeSec(q)} s.`, slotId: slot.id })
    const tag = q.tags[0]
    if (tag && tag === previousTag) out.push({ id: `tag-${slot.id}`, level: 'info', message: `${label} and the question before it are both about "${tag}".`, slotId: slot.id })
    previousTag = tag
  })

  if (levels.length >= 3) {
    if (Math.max(...levels) - Math.min(...levels) <= 1) out.push({ id: 'flat', level: 'warn', message: 'The difficulty curve is flat. Start with a warm-up and build to a hard question.' })
    const hard = levels.filter((l) => l >= 4).length
    if (hard / levels.length > 0.4) out.push({ id: 'hard', level: 'warn', message: 'More than 40% of the questions are hard. Too many hard questions frustrate players.' })
    if (levels[levels.length - 1] < Math.max(...levels)) out.push({ id: 'finale', level: 'info', message: 'The last question is not the hardest one. A finale usually is.' })
  }
  const used = episodeSeconds(episode, questions)
  if (used > episode.slotMin * 60) out.push({ id: 'over', level: 'error', message: `The show runs ${Math.ceil((used - episode.slotMin * 60) / 60)} min over its ${episode.slotMin} min slot.` })
  return out
}

export interface SuggestRules {
  /** Wanted levels in order. The default builds up: 1, 2, 2, 3, 3, 4, 5. */
  ramp?: Difficulty[]
  /** Skip questions used within this many days. */
  freshDays?: number
  /** Put a break after this many questions. 0 for none. */
  breakAfter?: number
  breakSec?: number
  now?: Date
}

export const DEFAULT_RAMP: Difficulty[] = [1, 2, 2, 3, 3, 4, 5]

/**
 * Fills a line-up from the bank: one question per step of the ramp, each at the level people really found it (when there is
 * enough data), not used lately, with a checked source first and a different topic from the one before.
 */
export function suggestEpisode(bank: Question[], keys: Record<Id, AnswerKey>, stats: Record<Id, QuestionStat>, rules: SuggestRules = {}): EpisodeSlot[] {
  const { ramp = DEFAULT_RAMP, freshDays = 56, breakAfter = 4, breakSec = 30, now = new Date() } = rules
  const taken = new Set<Id>()
  const slots: EpisodeSlot[] = []
  let previousTag: string | undefined
  const eligible = bank.filter((q) => q.status !== 'draft' && q.difficulty && keys[q.id] && keys[q.id].type !== 'manual' && keyProblems(q, keys[q.id]).length === 0)
  const levelOf = (q: Question): number => (stats[q.id]?.reliable && stats[q.id].p !== null ? observedLevel(stats[q.id].p!) : (q.difficulty as number))
  const daysSince = (q: Question) => (stats[q.id]?.lastUsed ? (now.getTime() - new Date(stats[q.id].lastUsed!).getTime()) / 86_400_000 : Infinity)

  ramp.forEach((want, i) => {
    const rank = (q: Question) => {
      const state = sourceState(q.source)
      return Math.abs(levelOf(q) - want) * 100 + (daysSince(q) < freshDays ? 40 : 0) + (state === 'verified' || state === 'original' ? 0 : state === 'unchecked' ? 8 : 20) + (q.tags[0] && q.tags[0] === previousTag ? 12 : 0) - Math.min(20, daysSince(q) === Infinity ? 20 : daysSince(q) / 10)
    }
    const pick = eligible.filter((q) => !taken.has(q.id)).sort((a, b) => rank(a) - rank(b))[0]
    if (!pick) return
    taken.add(pick.id)
    previousTag = pick.tags[0]
    slots.push({ id: `s-${pick.id}`, kind: 'question', questionId: pick.id })
    if (breakAfter > 0 && slots.filter((s) => s.kind === 'question').length === breakAfter && i < ramp.length - 1) slots.push({ id: 's-break', kind: 'break', sec: breakSec })
  })
  return slots
}

export const LEVEL_COUNT = LEVELS.length
