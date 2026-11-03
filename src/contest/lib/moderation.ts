/**
 * Reports and moderation as plain functions: which reports belong to one case, how urgent a case is and why, what the data
 * says about the reported player or question, what the next step on the ladder is, and what a decision does. Nothing here is
 * a hidden score: every point of priority comes with a sentence, and every signal says what was seen.
 */
import type { Claim, Id, Participant, Question, Report, ReportAction, ReportDecision, ReportKind, ReportReason, Submission, Violation } from '../data/types'

const DAY = 86_400_000

export const REASONS: Record<ReportReason, { label: string; kind: ReportKind; severity: 1 | 2 | 3; hint: string }> = {
  cheating: { label: 'Cheating', kind: 'player', severity: 3, hint: 'Help from others, tools, or several accounts.' },
  abuse: { label: 'Abuse', kind: 'player', severity: 3, hint: 'Insults, threats or hate in a name or a message.' },
  impersonation: { label: 'Impersonation', kind: 'player', severity: 2, hint: 'Pretends to be someone else, or the organisers.' },
  other: { label: 'Other rule', kind: 'player', severity: 1, hint: 'Another rule of the contest.' },
  'wrong-answer': { label: 'Wrong answer', kind: 'question', severity: 1, hint: 'The key says something that is not true.' },
  unclear: { label: 'Unclear', kind: 'question', severity: 1, hint: 'The question can be read in more than one way.' },
  offensive: { label: 'Offensive', kind: 'question', severity: 2, hint: 'The question or an option may hurt someone.' },
}

export const ACTIONS: Record<ReportAction, { label: string; past: string; kinds: ReportKind[]; hint: string }> = {
  dismiss: { label: 'Dismiss', past: 'Dismissed', kinds: ['player', 'question'], hint: 'No violation. The reports are closed.' },
  warn: { label: 'Warn', past: 'Warned', kinds: ['player'], hint: 'A warning on record. Nothing else changes.' },
  suspend: { label: 'Suspend', past: 'Suspended', kinds: ['player'], hint: 'Cannot join live shows for a number of days.' },
  disqualify: { label: 'Disqualify', past: 'Disqualified', kinds: ['player'], hint: 'Out of the ranking and of every announcement.' },
  withdraw: { label: 'Withdraw question', past: 'Withdrew the question', kinds: ['question'], hint: 'Back to review, with the reports as the reason.' },
}

export const actionsFor = (kind: ReportKind): ReportAction[] => (Object.keys(ACTIONS) as ReportAction[]).filter((a) => ACTIONS[a].kinds.includes(kind))

export const caseKey = (kind: ReportKind, targetId: Id) => `${kind}:${targetId}`

/* ---- Cases ------------------------------------------------------------------------------------------------------- */

/** The open reports about one target, worked as a single case. */
export interface ReportCase {
  key: string
  kind: ReportKind
  targetId: Id
  reports: Report[]
  /** The reasons given, the most common first. */
  reasons: ReportReason[]
  /** The oldest open report. */
  since: string
  /** The newest open report. */
  last: string
}

export const isOpen = (r: Report) => !r.resolution

/** Groups open reports by target. Handled reports are left out. */
export function groupReports(reports: Report[]): ReportCase[] {
  const map = new Map<string, Report[]>()
  for (const r of reports.filter(isOpen)) map.set(caseKey(r.kind, r.targetId), [...(map.get(caseKey(r.kind, r.targetId)) ?? []), r])
  return [...map.entries()].map(([key, list]) => {
    const sorted = [...list].sort((a, b) => a.at.localeCompare(b.at))
    const counts = new Map<ReportReason, number>()
    for (const r of list) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1)
    return { key, kind: list[0].kind, targetId: list[0].targetId, reports: sorted, reasons: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r), since: sorted[0].at, last: sorted[sorted.length - 1].at }
  })
}

export const ageDays = (iso: string, now: number) => Math.max(0, Math.floor((now - Date.parse(iso)) / DAY))

/* ---- Reporters ---------------------------------------------------------------------------------------------------- */

export type Trust = 'new' | 'reliable' | 'mixed' | 'unreliable'

export interface ReporterRecord {
  handled: number
  /** Reports that led to an action. */
  upheld: number
  dismissed: number
  open: number
  trust: Trust
}

/** How often a reporter was right: reports that led to an action against reports that were dismissed. */
export function reporterRecord(reports: Report[], reporterId: Id): ReporterRecord {
  const mine = reports.filter((r) => r.reporterId === reporterId)
  const handled = mine.filter((r) => r.resolution)
  const upheld = handled.filter((r) => r.resolution!.action !== 'dismiss').length
  const dismissed = handled.length - upheld
  const rate = handled.length ? upheld / handled.length : 0
  const trust: Trust = handled.length < 3 ? 'new' : rate >= 0.6 ? 'reliable' : rate <= 0.3 ? 'unreliable' : 'mixed'
  return { handled: handled.length, upheld, dismissed, open: mine.length - handled.length, trust }
}

/* ---- What the data says -------------------------------------------------------------------------------------------- */

export interface Signal {
  id: string
  label: string
  /** What was seen, in a sentence with the numbers. */
  detail: string
  strength: 1 | 2 | 3
}

const median = (list: number[]) => {
  if (!list.length) return 0
  const s = [...list].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

/** What the answers of a player show: answers that came faster than anyone can read, and unusual wrong answers shared with someone else. */
export function playerSignals(participantId: Id, submissions: Submission[], participants: Participant[] = []): Signal[] {
  const mine = submissions.find((s) => s.participantId === participantId)
  if (!mine) return []
  const out: Signal[] = []
  const times = mine.answers.map((a) => a.spentSec).filter((t): t is number => typeof t === 'number')
  if (times.length >= 3) {
    const fast = times.filter((t) => t <= 3).length
    const others = submissions.filter((s) => s.participantId !== participantId).flatMap((s) => s.answers.map((a) => a.spentSec).filter((t): t is number => typeof t === 'number'))
    if (fast / times.length >= 0.6) out.push({ id: 'fast', label: 'Very fast answers', detail: `${fast} of ${times.length} answers took 3 seconds or less. Other players took ${median(others)} seconds at the median.`, strength: fast / times.length >= 0.9 ? 3 : 2 })
  }
  const wrong = (s: Submission, qid: Id) => s.scores[qid] !== undefined && s.scores[qid].points === 0
  // a wrong answer that many people gave is not a fingerprint: only answers given by at most three people count
  const given = (qid: Id, value: unknown) => submissions.filter((s) => wrong(s, qid) && JSON.stringify(s.answers.find((x) => x.questionId === qid)?.value) === JSON.stringify(value)).length
  for (const other of submissions) {
    if (other.participantId === participantId) continue
    const shared = mine.answers.filter((a) => {
      const b = other.answers.find((x) => x.questionId === a.questionId)
      return b && wrong(mine, a.questionId) && wrong(other, a.questionId) && JSON.stringify(b.value) === JSON.stringify(a.value) && given(a.questionId, a.value) <= 3
    })
    if (shared.length >= 2) {
      const name = participants.find((p) => p.id === other.participantId)?.name ?? other.participantId
      out.push({ id: `same-${other.participantId}`, label: 'Same wrong answers', detail: `${shared.length} wrong answers that few others gave are identical to the ones of ${name}.`, strength: shared.length >= 4 ? 3 : 2 })
    }
  }
  return out
}

/** What the answers of a question show: how many people got it right, against the level it was written for. */
export function questionSignals(question: Question | undefined, submissions: Submission[]): Signal[] {
  if (!question) return []
  const graded = submissions.filter((s) => s.scores[question.id] && s.scores[question.id].max > 0)
  if (graded.length < 5) return []
  const right = graded.filter((s) => s.scores[question.id].points >= s.scores[question.id].max).length
  const share = right / graded.length
  if (share >= 0.25) return []
  const easy = (question.difficulty ?? 3) <= 2
  return [{ id: 'few-right', label: 'Few got it right', detail: `${right} of ${graded.length} people got it right${easy ? `, and it is written as ${question.difficulty === 1 ? 'Warm-up' : 'Easy'}` : ''}.`, strength: easy ? 3 : 2 }]
}

/* ---- Priority ----------------------------------------------------------------------------------------------------- */

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface PriorityFactor {
  label: string
  points: number
}

/** Days a case may wait for each priority before it counts as overdue. */
export const SLA_DAYS: Record<Priority, number> = { urgent: 1, high: 2, medium: 5, low: 10 }

export interface CasePriority {
  level: Priority
  score: number
  /** Every point of the score with the reason for it. */
  factors: PriorityFactor[]
  overdue: boolean
}

/** Strikes that count against a player: every warning, every suspension, every disqualification. */
export const strikesOf = (participantId: Id, violations: Violation[]) => violations.filter((v) => v.participantId === participantId)

/**
 * How urgent a case is, with the reasons. Points come from how serious the reasons are, how many different people reported, what
 * the data shows, earlier violations and how long the case has waited. Reporters who were often wrong take a point off.
 */
export function priorityOf(c: ReportCase, ctx: { reports: Report[]; violations: Violation[]; signals: Signal[]; now: number }): CasePriority {
  const factors: PriorityFactor[] = []
  const top = c.reasons.reduce((m, r) => Math.max(m, REASONS[r].severity), 1)
  const topReason = c.reasons.find((r) => REASONS[r].severity === top) ?? c.reasons[0]
  factors.push({ label: `${REASONS[topReason].label} is ${top === 3 ? 'serious' : top === 2 ? 'fairly serious' : 'minor'}`, points: top })
  const people = new Set(c.reports.map((r) => r.reporterId)).size
  if (people > 1) factors.push({ label: `${people} different people reported it`, points: Math.min(3, people - 1) })
  const evidence = Math.min(4, ctx.signals.reduce((n, s) => n + s.strength, 0))
  if (evidence > 0) factors.push({ label: `Evidence: ${ctx.signals.map((s) => s.label.toLowerCase()).join(' and ')}`, points: evidence })
  if (c.kind === 'player') {
    const strikes = strikesOf(c.targetId, ctx.violations).length
    if (strikes > 0) factors.push({ label: `${strikes} earlier violation${strikes === 1 ? '' : 's'}`, points: Math.min(2, strikes) })
  }
  const days = ageDays(c.since, ctx.now)
  if (days >= 2) factors.push({ label: `Waiting ${days} days`, points: days >= 7 ? 2 : 1 })
  const trusts = [...new Set(c.reports.map((r) => r.reporterId))].map((id) => reporterRecord(ctx.reports, id).trust)
  if (trusts.length > 0 && trusts.every((t) => t === 'unreliable')) factors.push({ label: 'The reporters were often wrong before', points: -1 })
  const score = factors.reduce((n, f) => n + f.points, 0)
  const level: Priority = score >= 9 ? 'urgent' : score >= 6 ? 'high' : score >= 4 ? 'medium' : 'low'
  return { level, score, factors, overdue: days > SLA_DAYS[level] }
}

const LEVEL_ORDER: Record<Priority, number> = { urgent: 3, high: 2, medium: 1, low: 0 }
export const byPriority = (a: { priority: CasePriority; case: ReportCase }, b: { priority: CasePriority; case: ReportCase }) =>
  LEVEL_ORDER[b.priority.level] - LEVEL_ORDER[a.priority.level] || b.priority.score - a.priority.score || a.case.since.localeCompare(b.case.since)

/* ---- Ladder and decisions ----------------------------------------------------------------------------------------- */

/** When a suspension of this person is still running. */
export function activeSuspension(participantId: Id, violations: Violation[], now: number): Violation | undefined {
  return violations.find((v) => v.participantId === participantId && v.action === 'suspend' && v.endsAt && Date.parse(v.endsAt) > now)
}

export interface Suggestion {
  action: ReportAction
  days?: number
  why: string
}

/**
 * The next step on the ladder, as a suggestion the moderator can change: a warning first, then a suspension of 3 days, then 7
 * days, then disqualification. Strong data moves it up one step. For a question, two or more reporters mean it should be looked at again.
 */
export function suggestAction(c: ReportCase, ctx: { violations: Violation[]; signals: Signal[] }): Suggestion {
  if (c.kind === 'question') {
    const people = new Set(c.reports.map((r) => r.reporterId)).size
    return people >= 2 || ctx.signals.some((s) => s.strength >= 3)
      ? { action: 'withdraw', why: `${people} people reported it${ctx.signals.length ? ' and the answers agree' : ''}. Take it back to review.` }
      : { action: 'dismiss', why: 'One report and nothing in the answers backs it up yet.' }
  }
  const strikes = strikesOf(c.targetId, ctx.violations).length
  const strong = ctx.signals.some((s) => s.strength >= 3)
  const step = Math.min(3, strikes + (strong ? 1 : 0))
  const ladder: Suggestion[] = [
    { action: 'warn', why: strikes === 0 ? 'No earlier violation: a warning first.' : 'A warning first.' },
    { action: 'suspend', days: 3, why: `${strikes > 0 ? `${strikes} earlier violation${strikes === 1 ? '' : 's'}` : 'Strong evidence'}: a short suspension.` },
    { action: 'suspend', days: 7, why: `${strikes} earlier violations: a long suspension.` },
    { action: 'disqualify', why: `${strikes} earlier violations and more evidence: out of the contest.` },
  ]
  return ladder[step]
}

export const DECISION_NOTE_MIN = 5
export const MAX_SUSPENSION_DAYS = 30

/** Why a decision cannot be saved, in words for the moderator, or null when it can. */
export function decisionProblem(c: ReportCase, decision: ReportDecision, ctx: { actor: string; claim?: Claim }): string | null {
  if (!ACTIONS[decision.action].kinds.includes(c.kind)) return `${ACTIONS[decision.action].label} does not apply to a ${c.kind}.`
  if (ctx.claim && ctx.claim.by !== ctx.actor) return `${ctx.claim.by} is working on this case.`
  if (decision.note.trim().length < DECISION_NOTE_MIN) return 'Write the reason, in a few words.'
  if (decision.action === 'suspend' && !(decision.days && decision.days >= 1 && decision.days <= MAX_SUSPENSION_DAYS)) return `A suspension lasts 1 to ${MAX_SUSPENSION_DAYS} days.`
  return null
}

/** What a decision does, in sentences: who is affected and how. */
export function consequences(c: ReportCase, decision: Pick<ReportDecision, 'action' | 'days'>, targetName: string, now: number): string[] {
  const n = c.reports.length
  const base = `${n} report${n === 1 ? '' : 's'} will be closed.`
  switch (decision.action) {
    case 'dismiss':
      return [base, 'Nothing is recorded against anyone. The reporters are counted as wrong.']
    case 'warn':
      return [base, `${targetName} gets a warning on record. It counts as a strike for the next decision.`]
    case 'suspend': {
      const until = new Date(now + (decision.days ?? 0) * DAY).toLocaleDateString('en', { month: 'short', day: 'numeric' })
      return [base, `${targetName} cannot join live shows until ${until}.`, 'It counts as a strike for the next decision.']
    }
    case 'disqualify':
      return [base, `${targetName} leaves the ranking and every announcement.`, 'This is the last step on the ladder.']
    case 'withdraw':
      return [base, 'The question goes back to review with the reports as the reason, and leaves the bank.', 'It cannot be withdrawn while a show that has not finished uses it.']
  }
}

/** The reports with the decision written on them, and the violation it creates for a player. Pure: the adapter stores the result. */
export function applyDecision(c: ReportCase, decision: ReportDecision, actor: string, now: number, violationId: Id): { reports: Report[]; violation?: Violation } {
  const at = new Date(now).toISOString()
  const resolution = { action: decision.action, by: actor, at, note: decision.note.trim(), ...(decision.action === 'suspend' ? { days: decision.days } : {}) }
  const reports = c.reports.map((r) => ({ ...r, resolution }))
  if (c.kind !== 'player' || decision.action === 'dismiss') return { reports }
  const action = decision.action as 'warn' | 'suspend' | 'disqualify'
  return {
    reports,
    violation: { id: violationId, participantId: c.targetId, action, reason: c.reasons[0], at, by: actor, note: resolution.note, endsAt: action === 'suspend' ? new Date(now + (decision.days ?? 0) * DAY).toISOString() : undefined, reportIds: c.reports.map((r) => r.id) },
  }
}
