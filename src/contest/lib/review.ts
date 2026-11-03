/**
 * The review of questions as plain functions: where a question is, what can be done to it by a given person, and what a bulk
 * action would and would not do. The rules follow the four-eyes principle: nobody approves their own question, and the final
 * approval comes from someone other than the first reviewer.
 */
import type { AnswerKey, Id, Question, QuestionReview, QuestionStatus, ReviewAction, ReviewEvent, ReviewStage } from '../data/types'
import { readiness } from './quick'
import { sourceState } from './sources'

export interface ReviewPolicy {
  /** Two reviewers: a pre-approval, then a final approval by someone else. With `false`, one reviewer approves. */
  twoStep: boolean
  /** A question that has waited this many days for a reviewer is stale. */
  staleDays: number
}

export const DEFAULT_POLICY: ReviewPolicy = { twoStep: true, staleDays: 3 }

export const STAGES: { id: ReviewStage; label: string; hint: string }[] = [
  { id: 'draft', label: 'Drafts', hint: 'Still being written.' },
  { id: 'pending', label: 'Waiting for review', hint: 'Sent by the writer. Nobody has looked at it yet.' },
  { id: 'preapproved', label: 'Pre-approved', hint: 'One reviewer is happy. A second one has to approve it.' },
  { id: 'approved', label: 'Approved', hint: 'In the bank. It can be used in a show.' },
  { id: 'returned', label: 'Returned', hint: 'A reviewer sent it back with a reason.' },
  { id: 'trashed', label: 'Trash', hint: 'Removed from the work. It can be restored.' },
]

export const stageName = (stage: ReviewStage) => STAGES.find((s) => s.id === stage)!.label

/** How a stage reads in a sentence: "It is pre-approved". */
const STAGE_NOUN: Record<ReviewStage, string> = { draft: 'a draft', pending: 'waiting for review', preapproved: 'pre-approved', approved: 'approved', returned: 'returned', trashed: 'in the trash' }

const DAY = 86_400_000

/** The stage of a question. Without a review record it follows the status. */
export const stageOf = (q: Question): ReviewStage => q.review?.stage ?? (q.status === 'published' ? 'approved' : q.status === 'ready' ? 'pending' : 'draft')

/** The status that goes with a stage: only an approved question is published. */
export const statusFor = (stage: ReviewStage): QuestionStatus => (stage === 'approved' ? 'published' : stage === 'pending' || stage === 'preapproved' ? 'ready' : 'draft')

/** The review record of a question, with sensible values when it has none. */
export function reviewOf(q: Question): QuestionReview {
  return q.review ?? { stage: stageOf(q), author: 'Unknown', since: q.updatedAt, history: [] }
}

/** Whole days a question has been in its stage. */
export const waitingDays = (q: Question, now: number) => Math.max(0, Math.floor((now - Date.parse(reviewOf(q).since)) / DAY))

export const isWaiting = (q: Question) => ['pending', 'preapproved'].includes(stageOf(q))
export const isStale = (q: Question, now: number, policy: ReviewPolicy = DEFAULT_POLICY) => isWaiting(q) && waitingDays(q, now) >= policy.staleDays

export const ACTIONS: Record<ReviewAction, { label: string; past: string; needsNote: boolean; to: ReviewStage }> = {
  submit: { label: 'Send for review', past: 'Sent for review', needsNote: false, to: 'pending' },
  preapprove: { label: 'Pre-approve', past: 'Pre-approved', needsNote: false, to: 'preapproved' },
  approve: { label: 'Approve', past: 'Approved', needsNote: false, to: 'approved' },
  return: { label: 'Return', past: 'Returned', needsNote: true, to: 'returned' },
  withdraw: { label: 'Withdraw', past: 'Withdrawn', needsNote: true, to: 'returned' },
  trash: { label: 'Move to trash', past: 'Moved to trash', needsNote: false, to: 'trashed' },
  restore: { label: 'Restore', past: 'Restored', needsNote: false, to: 'draft' },
}

export interface ActionState {
  action: ReviewAction
  label: string
  enabled: boolean
  /** Why it is not available, in words for the person who asked. */
  why?: string
  needsNote: boolean
  /** The step forward from this stage. Show it as the main button. */
  primary: boolean
}

export interface ReviewContext {
  /** Who is acting. */
  actor: string
  policy?: ReviewPolicy
}

/** What the actor can do to a question now, in the order the buttons should appear. */
export function reviewActions(q: Question, key: AnswerKey | null | undefined, ctx: ReviewContext): ActionState[] {
  const { actor, policy = DEFAULT_POLICY } = ctx
  const review = reviewOf(q)
  const stage = stageOf(q)
  const own = review.author === actor
  const state = (action: ReviewAction, enabled = true, why?: string, primary = false): ActionState => ({ action, label: ACTIONS[action].label, enabled, why: enabled ? undefined : why, needsNote: ACTIONS[action].needsNote, primary })
  const trash = state('trash')

  switch (stage) {
    case 'draft':
    case 'returned': {
      const problems = readiness(q, key)
      return [state('submit', problems.length === 0, `Not ready: ${problems[0]}`, true), trash]
    }
    case 'pending':
      return [
        policy.twoStep
          ? state('preapprove', !own, 'You wrote this question. Someone else has to pre-approve it.', true)
          : state('approve', !own, 'You wrote this question. Someone else has to approve it.', true),
        state('return'),
        trash,
      ]
    case 'preapproved': {
      const first = review.preapprovedBy === actor
      return [state('approve', !own && !first, own ? 'You wrote this question. Someone else has to approve it.' : 'You pre-approved it. A second reviewer has to approve it.', true), state('return'), trash]
    }
    case 'approved':
      return [state('withdraw')]
    case 'trashed':
      return [state('restore', true, undefined, true)]
  }
}

/** The question after the action. Throws a sentence a person can read when the action is not allowed. */
export function applyReview(q: Question, action: ReviewAction, ctx: ReviewContext, now: number, key: AnswerKey | null | undefined, note?: string): Question {
  const found = reviewActions(q, key, ctx).find((a) => a.action === action)
  if (!found) throw new Error(`${ACTIONS[action].label} is not possible for a question that is ${stageName(stageOf(q)).toLowerCase()}.`)
  if (!found.enabled) throw new Error(found.why ?? 'Not allowed.')
  const text = note?.trim()
  if (found.needsNote && (!text || text.length < 5)) throw new Error('Say why, in a few words.')
  const before = reviewOf(q)
  const from = stageOf(q)
  const to = ACTIONS[action].to
  const at = new Date(now).toISOString()
  const event: ReviewEvent = { at, actor: ctx.actor, action, from, to, ...(found.needsNote ? { note: text } : {}) }
  const review: QuestionReview = {
    stage: to,
    author: before.author,
    preapprovedBy: action === 'preapprove' ? ctx.actor : action === 'approve' ? before.preapprovedBy : undefined,
    note: found.needsNote ? text : undefined,
    since: at,
    history: [...before.history, event],
  }
  return { ...q, review, status: statusFor(to), updatedAt: at } as Question
}

export interface BulkPlan {
  /** Questions the action can be done to. */
  ok: Question[]
  /** Questions it cannot be done to, each with the reason. */
  skipped: { question: Question; why: string }[]
}

/** A dry run of an action on many questions: what would change, and what would be left out and why. */
export function bulkPlan(questions: Question[], action: ReviewAction, keys: Record<Id, AnswerKey | null | undefined>, ctx: ReviewContext): BulkPlan {
  const out: BulkPlan = { ok: [], skipped: [] }
  for (const q of questions) {
    const found = reviewActions(q, keys[q.id], ctx).find((a) => a.action === action)
    if (found?.enabled) out.ok.push(q)
    else out.skipped.push({ question: q, why: found?.why ?? `It is ${STAGE_NOUN[stageOf(q)]}, so this step does not apply.` })
  }
  return out
}

export type ReviewView = ReviewStage | 'all' | 'mine' | 'stale'

/** Whether the actor can take the next step on it: the questions that wait for this person. */
export function waitsForMe(q: Question, ctx: ReviewContext): boolean {
  const { actor, policy = DEFAULT_POLICY } = ctx
  const review = reviewOf(q)
  const stage = stageOf(q)
  if (review.author === actor) return false
  if (stage === 'pending') return true
  return stage === 'preapproved' && policy.twoStep && review.preapprovedBy !== actor
}

export function inView(q: Question, view: ReviewView, ctx: ReviewContext & { now: number }): boolean {
  if (view === 'all') return stageOf(q) !== 'trashed'
  if (view === 'mine') return waitsForMe(q, ctx)
  if (view === 'stale') return isStale(q, ctx.now, ctx.policy)
  return stageOf(q) === view
}

export const VIEWS: ReviewView[] = ['mine', 'all', 'draft', 'pending', 'preapproved', 'approved', 'returned', 'trashed', 'stale']

export function reviewCounts(questions: Question[], ctx: ReviewContext & { now: number }): Record<ReviewView, number> {
  const out = Object.fromEntries(VIEWS.map((v) => [v, 0])) as Record<ReviewView, number>
  for (const q of questions) for (const v of VIEWS) if (inView(q, v, ctx)) out[v] += 1
  return out
}

/** The question after `currentId` in a list, or the one before it at the end, or the first. */
export function neighbour(list: Question[], currentId: Id | null | undefined): Question | undefined {
  const i = list.findIndex((q) => q.id === currentId)
  return i < 0 ? list[0] : (list[i + 1] ?? list[i - 1])
}

/** What a reviewer should look at before approving: what is missing, and how far the source can be trusted. */
export function reviewFlags(q: Question, key: AnswerKey | null | undefined): string[] {
  const out = readiness(q, key)
  const source = sourceState(q.source)
  if (source === 'missing') out.push('There is no source.')
  else if (source === 'weak') out.push('The source is only Wikipedia.')
  else if (source === 'unchecked') out.push('The source has not been checked.')
  if (!q.difficulty) out.push('There is no difficulty level.')
  return out
}
