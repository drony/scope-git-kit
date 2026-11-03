/**
 * The live show as a pure state machine. The server's clock is the only clock: every time in a `LiveState` is a server time,
 * and what is left on a countdown is always worked out from `phaseStartedAt`, never from a counter on someone's screen. So a
 * page that reloads, or a phone that joins late, shows the same second as everyone else.
 *
 * A question goes through: reading (a short countdown so everyone can read it) → open (answers count) → locked (time is up, or
 * the host locked it) → revealed (the answer and the points). A person who arrives while a question is open waits for the
 * next one. A person who answered cannot change the answer.
 */
import type { AnswerKey, Episode, Id, LiveEvent, LiveState, Participant, Question, QuestionResult, EpisodeResult } from '../data/types'
import { scoreAnswer } from './scoring'

export const READING_MS = 3000

export interface LiveContext {
  episode: Episode
  questions: Question[]
  keys: Record<Id, AnswerKey>
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export const slotAt = (ctx: LiveContext, index: number) => ctx.episode.slots[index]

export function questionAt(ctx: LiveContext, index: number): Question | undefined {
  const slot = slotAt(ctx, index)
  return slot?.kind === 'question' ? ctx.questions.find((q) => q.id === slot.questionId) : undefined
}

/** Seconds the question on a slot is open: the slot's own time, else the question's, else 20. */
export function limitSecAt(ctx: LiveContext, index: number): number {
  const slot = slotAt(ctx, index)
  if (slot?.kind !== 'question') return 0
  return slot.timeSec ?? questionAt(ctx, index)?.timeLimitSec ?? 20
}

export function pointsAt(ctx: LiveContext, index: number): number {
  const slot = slotAt(ctx, index)
  return slot?.kind === 'question' ? (slot.points ?? questionAt(ctx, index)?.points ?? 0) : 0
}

export function openLobby(episodeId: Id, at: number): LiveState {
  return { episodeId, phase: 'lobby', index: 0, phaseStartedAt: at, opened: {}, joined: [], waiting: [], answers: {}, scores: {}, streaks: {}, gained: {} }
}

/**
 * Points for one answer: the question's points × the share that is right × a speed factor. The factor goes from 1 (answered
 * at once) down to 0.5 (answered at the last moment), so being quick helps but never beats being right.
 */
export function scoreLive(question: Question, key: AnswerKey | null | undefined, value: Parameters<typeof scoreAnswer>[2], openedAt: number, at: number, limitSec: number, maxPoints: number): { points: number; right: boolean } {
  const r = scoreAnswer({ points: maxPoints, type: question.type }, key, value)
  const fraction = r.max > 0 ? r.points / r.max : 0
  const speed = 1 - 0.5 * clamp((at - openedAt) / Math.max(1, limitSec * 1000), 0, 1)
  return { points: Math.round(maxPoints * fraction * speed), right: fraction >= 1 }
}

function enterSlot(state: LiveState, index: number, at: number, ctx: LiveContext): LiveState {
  if (index >= ctx.episode.slots.length) return { ...state, phase: 'finished', index: ctx.episode.slots.length, phaseStartedAt: at, pausedAt: undefined }
  const isQuestion = slotAt(ctx, index).kind === 'question'
  return { ...state, index, phase: isQuestion ? 'reading' : 'break', phaseStartedAt: at, openedAt: undefined, pausedAt: undefined, waiting: [], gained: {} }
}

/** Adds the points of the question on stage and moves to "revealed". */
function reveal(state: LiveState, at: number, ctx: LiveContext): LiveState {
  const q = questionAt(ctx, state.index)
  if (!q) return { ...state, phase: 'revealed', phaseStartedAt: at }
  const answers = state.answers[q.id] ?? {}
  const openedAt = state.openedAt ?? state.phaseStartedAt
  const limit = limitSecAt(ctx, state.index)
  const max = pointsAt(ctx, state.index)
  const scores = { ...state.scores }
  const streaks = { ...state.streaks }
  const gained: Record<Id, number> = {}
  for (const id of state.joined) {
    const a = answers[id]
    const r = a ? scoreLive(q, ctx.keys[q.id], a.value, openedAt, a.at, limit, max) : { points: 0, right: false }
    gained[id] = r.points
    scores[id] = (scores[id] ?? 0) + r.points
    streaks[id] = r.right ? (streaks[id] ?? 0) + 1 : 0
  }
  return { ...state, phase: 'revealed', phaseStartedAt: at, scores, streaks, gained }
}

/** Applies one event. Events that do not fit the phase (an answer after time is up, a second answer) are ignored. */
export function liveReduce(state: LiveState, event: LiveEvent, ctx: LiveContext): LiveState {
  const at = event.at
  switch (event.type) {
    case 'join': {
      if (state.phase === 'finished' || state.joined.includes(event.participantId)) return state
      const waits = state.phase === 'open' || state.phase === 'locked'
      return { ...state, joined: [...state.joined, event.participantId], waiting: waits ? [...state.waiting, event.participantId] : state.waiting }
    }
    case 'start':
      return state.phase === 'lobby' ? enterSlot(state, 0, at, ctx) : state
    case 'next':
      return state.phase === 'revealed' || state.phase === 'break' ? enterSlot(state, state.index + 1, at, ctx) : state
    case 'lock':
      return state.phase === 'open' && !state.pausedAt ? { ...state, phase: 'locked', phaseStartedAt: at } : state
    case 'reveal':
      return (state.phase === 'open' || state.phase === 'locked') && !state.pausedAt ? reveal(state, at, ctx) : state
    case 'pause':
      return (state.phase === 'reading' || state.phase === 'open') && !state.pausedAt ? { ...state, pausedAt: at } : state
    case 'resume': {
      if (!state.pausedAt) return state
      const gap = at - state.pausedAt
      return { ...state, pausedAt: undefined, phaseStartedAt: state.phaseStartedAt + gap, openedAt: state.openedAt === undefined ? undefined : state.openedAt + gap, opened: Object.fromEntries(Object.entries(state.opened).map(([id, t]) => [id, id === questionAt(ctx, state.index)?.id ? t + gap : t])) }
    }
    case 'finish':
      return { ...state, phase: 'finished', phaseStartedAt: at, pausedAt: undefined }
    case 'answer': {
      const q = questionAt(ctx, state.index)
      if (!q || state.phase !== 'open' || state.pausedAt || state.openedAt === undefined) return state
      if (!state.joined.includes(event.participantId) || state.waiting.includes(event.participantId)) return state
      if (at > state.openedAt + limitSecAt(ctx, state.index) * 1000) return state
      const existing = state.answers[q.id] ?? {}
      if (existing[event.participantId]) return state
      return { ...state, answers: { ...state.answers, [q.id]: { ...existing, [event.participantId]: { value: event.value, at } } } }
    }
    case 'open-lobby':
    case 'close':
      return state
  }
}

/** Moves the clock forward: reading becomes open, and open becomes locked when time runs out. Call it before reading a state. */
export function tick(state: LiveState, now: number, ctx: LiveContext): LiveState {
  if (state.pausedAt) return state
  let s = state
  if (s.phase === 'reading' && now - s.phaseStartedAt >= READING_MS) {
    const openedAt = s.phaseStartedAt + READING_MS
    const q = questionAt(ctx, s.index)
    s = { ...s, phase: 'open', phaseStartedAt: openedAt, openedAt, opened: q ? { ...s.opened, [q.id]: openedAt } : s.opened }
  }
  if (s.phase === 'open' && s.openedAt !== undefined) {
    const end = s.openedAt + limitSecAt(ctx, s.index) * 1000
    if (now >= end) s = { ...s, phase: 'locked', phaseStartedAt: end }
  }
  return s
}

/** Milliseconds left in the current countdown (reading or open), 0 otherwise. */
export function remainingMs(state: LiveState, now: number, ctx: LiveContext): number {
  const t = state.pausedAt ?? now
  if (state.phase === 'reading') return Math.max(0, READING_MS - (t - state.phaseStartedAt))
  if (state.phase === 'open' && state.openedAt !== undefined) return Math.max(0, limitSecAt(ctx, state.index) * 1000 - (t - state.openedAt))
  return 0
}

export interface LiveRow {
  id: Id
  name: string
  points: number
  rank: number
  gained: number
  streak: number
}

/** The scoreboard: everyone who joined, best first; ties share a place (1, 2, 2, 4). */
export function liveRanking(state: LiveState, nameOf: (id: Id) => string): LiveRow[] {
  const rows = state.joined
    .map((id) => ({ id, name: nameOf(id), points: state.scores[id] ?? 0, gained: state.gained[id] ?? 0, streak: state.streaks[id] ?? 0 }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  const out: LiveRow[] = []
  rows.forEach((r, i) => out.push({ ...r, rank: i > 0 && rows[i - 1].points === r.points ? out[i - 1].rank : i + 1 }))
  return out
}

/** How many people picked each option, for the question on stage. */
export function optionCounts(state: LiveState, questionId: Id): Record<Id, number> {
  const counts: Record<Id, number> = {}
  for (const a of Object.values(state.answers[questionId] ?? {})) if (a.value.type === 'choice') for (const id of a.value.selected) counts[id] = (counts[id] ?? 0) + 1
  return counts
}

/** The record of a finished show: what to keep for the statistics. */
export function episodeResultOf(state: LiveState, ctx: LiveContext): EpisodeResult {
  const questions: QuestionResult[] = []
  ctx.episode.slots.forEach((slot, index) => {
    if (slot.kind !== 'question') return
    const q = ctx.questions.find((x) => x.id === slot.questionId)
    if (!q) return
    const answers = state.answers[q.id] ?? {}
    const openedAt = state.opened[q.id] ?? 0
    const limit = limitSecAt(ctx, index)
    const max = pointsAt(ctx, index)
    const entries = Object.entries(answers)
    const right = entries.filter(([, a]) => scoreLive(q, ctx.keys[q.id], a.value, openedAt, a.at, limit, max).right)
    questions.push({
      questionId: q.id,
      answered: entries.length,
      correct: right.length,
      avgSec: entries.length ? Math.round((entries.reduce((n, [, a]) => n + (a.at - openedAt), 0) / entries.length / 1000) * 10) / 10 : 0,
      counts: optionCounts(state, q.id),
      correctBy: right.map(([id]) => id),
    })
  })
  return { participants: state.joined.length, questions, scores: { ...state.scores } }
}

/** A readable name for someone on the scoreboard: a participant's name, else the id. */
export const nameFinder = (participants: Participant[], extra: Record<Id, string> = {}) => (id: Id) => participants.find((p) => p.id === id)?.name ?? extra[id] ?? id
