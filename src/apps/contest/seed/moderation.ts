/**
 * Fictional data for moderation: reports about players and about questions, a few that were handled long ago, the violations
 * that came out of them, and a claim. Two players leave traces in their answers: one answers within a second or two, one gives
 * the same answers as another player (`applyEvidence`). Plain data: nothing here renders anything.
 */
import type { Answer, AnswerValue, Claim, Report, Violation } from '@/contest/data/types'
import { day } from './time'

const rep = (id: string, targetId: string, reporterId: string, reason: Report['reason'], ago: number, comment?: string, resolution?: Report['resolution']): Report => ({
  id,
  kind: targetId.startsWith('q') ? 'question' : 'player',
  reason,
  targetId,
  reporterId,
  at: day(-ago, 9 + (ago % 5)),
  comment,
  resolution,
})
const done = (action: NonNullable<Report['resolution']>['action'], by: string, ago: number, note: string, days?: number): Report['resolution'] => ({ action, by, at: day(-ago, 14), note, ...(days ? { days } : {}) })

export const REPORTS: Report[] = [
  // open: one player three people report, one who copied answers, a joke name, an insulting name, a wrong reporter
  rep('r1', 'p7', 'p2', 'cheating', 4, 'Finished the whole quiz in under a minute.'),
  rep('r2', 'p7', 'p5', 'cheating', 3, 'Nobody reads ten questions that fast.'),
  rep('r3', 'p7', 'p8', 'other', 1, 'I think the answers were shared in a team chat.'),
  rep('r4', 'p6', 'p4', 'cheating', 1, 'The same mistakes as another player.'),
  { ...rep('r5', 'p9', 'p2', 'other', 0, "The team name looks like a joke about the organisers."), at: day(0, 7) },
  rep('r6', 'p10', 'p1', 'abuse', 12, 'The display name is an insult.'),
  rep('r7', 'p4', 'p8', 'impersonation', 20, "Uses the organisers' name in the profile."),
  // open: about questions
  rep('r8', 'q8', 'p2', 'unclear', 2, 'It is not clear whether to match by country or by city.'),
  rep('r9', 'q8', 'p4', 'unclear', 1, 'I was not sure how to match them either.'),
  rep('r10', 'q2', 'p5', 'wrong-answer', 5, 'I think 1 is a prime number.'),
  // handled: p8 reported three times and was dismissed three times; p1 reported three times and was right
  rep('h1', 'p3', 'p8', 'abuse', 90, undefined, done('dismiss', 'Cleo', 89, 'The message was a joke between friends.')),
  rep('h2', 'p4', 'p8', 'other', 80, undefined, done('dismiss', 'Bo', 79, 'Nothing breaks a rule.')),
  rep('h3', 'p5', 'p8', 'cheating', 70, undefined, done('dismiss', 'Cleo', 69, 'The answers and the times look normal.')),
  rep('h4', 'p10', 'p1', 'abuse', 60, 'Rude messages in the team chat.', done('warn', 'Cleo', 58, 'First time. A warning.')),
  rep('h5', 'p12', 'p1', 'cheating', 55, 'Two accounts on one phone.', done('suspend', 'Bo', 54, 'Two accounts confirmed. Three days.', 3)),
  rep('h6', 'p12', 'p1', 'abuse', 50, 'Insults after the suspension.', done('warn', 'Cleo', 48, 'Second case. A warning, then a suspension next time.')),
]

export const VIOLATIONS: Violation[] = [
  { id: 'v1', participantId: 'p10', action: 'warn', reason: 'abuse', at: day(-58, 14), by: 'Cleo', note: 'First time. A warning.', reportIds: ['h4'] },
  { id: 'v2', participantId: 'p12', action: 'suspend', reason: 'cheating', at: day(-54, 14), by: 'Bo', note: 'Two accounts confirmed. Three days.', endsAt: day(-51, 14), reportIds: ['h5'] },
  { id: 'v3', participantId: 'p12', action: 'warn', reason: 'abuse', at: day(-48, 14), by: 'Cleo', note: 'Second case. A warning, then a suspension next time.', reportIds: ['h6'] },
]

/** One case is already being worked on, by someone else than the demo editor. */
export const CLAIMS: Record<string, Claim> = { 'question:q8': { by: 'Bo', at: day(0, 8) } }

/** Wrong answers that hardly anyone else would give: a typo, an odd number, a scrambled order. */
const ODD: Record<string, AnswerValue> = {
  q5: { type: 'text', text: 'Camberra' },
  q6: { type: 'number', value: 31415 },
  q7: { type: 'ordering', order: ['horse', 'cat', 'elephant', 'mouse'] },
  q8: { type: 'matching', pairs: { jp: 'nairobi', ke: 'lima', pe: 'tokyo' } },
}

/**
 * Leaves the traces that make two reports believable: p7 answers every question within one or two seconds, and p6 gives the
 * same answers as p3, including four unusual wrong ones. Everyone else keeps the answers they had.
 */
export function applyEvidence(answersBy: Record<string, Answer[]>): Record<string, Answer[]> {
  const out = { ...answersBy }
  if (out.p7) out.p7 = out.p7.map((a, i) => ({ ...a, spentSec: 1 + (i % 2) }))
  if (out.p3 && out.p6) {
    out.p3 = out.p3.map((a) => (ODD[a.questionId] ? { ...a, value: ODD[a.questionId] } : a))
    out.p6 = out.p3.map((a, i) => ({ ...a, spentSec: 22 + ((i * 7) % 15) }))
  }
  return out
}
