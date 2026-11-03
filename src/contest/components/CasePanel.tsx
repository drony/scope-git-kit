import type { ReactNode } from 'react'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { Button } from '@/kit/components/ui/Button'
import { Alert } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { Claim, Id, Report, ReportDecision, Violation } from '../data/types'
import { relativeTime } from '../lib/dates'
import { REASONS, ageDays, reporterRecord, suggestAction, strikesOf, type CasePriority, type ReportCase, type Signal, type Trust } from '../lib/moderation'
import { DecisionForm } from './DecisionForm'
import { RiskSignals } from './RiskSignals'
import { ViolationHistory } from './ViolationHistory'

const TRUST: Record<Trust, { label: string; tone: Tone }> = {
  new: { label: 'New reporter', tone: 'neutral' },
  reliable: { label: 'Usually right', tone: 'success' },
  mixed: { label: 'Mixed record', tone: 'warning' },
  unreliable: { label: 'Often wrong', tone: 'error' },
}

interface CasePanelProps {
  case: ReportCase
  /** The name of the player, or the text of the question. */
  targetName: string
  /** What the target looks like: for a question, the question and its key. */
  preview?: ReactNode
  priority: CasePriority
  signals: Signal[]
  /** Every report, open and handled: the record of each reporter is worked out from them. */
  reports: Report[]
  violations: Violation[]
  reporterName: (id: Id) => string
  claim?: Claim
  actor: string
  /** The clock, in milliseconds. */
  now: number
  /** Called when the person starts working on the case, or takes it over. */
  onClaim: () => void
  onRelease: () => void
  onResolve: (decision: ReportDecision) => void
  busy?: boolean
  className?: string
}

/**
 * One case for a moderator, top to bottom: who or what was reported and who is working on it, the reports with how reliable each
 * reporter has been, why the case has its priority and what the data shows, the record of the player, and the decision. The
 * decision is off while someone else holds the case; "Take over" moves it.
 */
export function CasePanel({ case: c, targetName, preview, priority, signals, reports, violations, reporterName, claim, actor, now, onClaim, onRelease, onResolve, busy, className }: CasePanelProps) {
  const mine = claim?.by === actor
  const other = claim && !mine ? claim : undefined
  const record = c.kind === 'player' ? strikesOf(c.targetId, violations) : []
  const suggestion = suggestAction(c, { violations, signals })
  return (
    <article className={cn('mq-panel', className)} aria-label="Case">
      <header>
        <div>
          <Tag tone="neutral">{c.kind === 'player' ? 'Player' : 'Question'}</Tag>
          <h2>{targetName}</h2>
          <p className="mq-sub">
            {c.reasons.map((r) => REASONS[r].label).join(', ')} · open for {ageDays(c.since, now) === 0 ? 'less than a day' : `${ageDays(c.since, now)} day${ageDays(c.since, now) === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="mq-claimbox">
          {claim ? <span>{mine ? 'You are working on it' : `${claim.by} is working on it`}</span> : <span>Nobody is working on it</span>}
          {mine ? (
            <Button size="sm" variant="plain" onClick={onRelease} disabled={busy}>
              Release
            </Button>
          ) : (
            <Button size="sm" variant={claim ? 'plain' : 'primary'} onClick={onClaim} disabled={busy}>
              {claim ? 'Take over' : 'Work on it'}
            </Button>
          )}
        </div>
      </header>

      {other && (
        <Alert tone="warning" title={`${other.by} is working on this case`}>
          Take it over to decide it yourself.
        </Alert>
      )}

      {preview}

      <section aria-label="Reports">
        <h3>
          {c.reports.length} report{c.reports.length === 1 ? '' : 's'}
        </h3>
        <ul className="mq-reports">
          {c.reports.map((r) => {
            const rec = reporterRecord(reports, r.reporterId)
            return (
              <li key={r.id}>
                <span className="mq-reporter">
                  <b>{reporterName(r.reporterId)}</b>
                  <Tag tone={TRUST[rec.trust].tone}>{TRUST[rec.trust].label}</Tag>
                  {rec.handled > 0 && (
                    <small>
                      {rec.upheld} of {rec.handled} earlier reports led to action
                    </small>
                  )}
                </span>
                <span className="mq-said">
                  <em>{REASONS[r.reason].label}</em> · {relativeTime(r.at, new Date(now))}
                </span>
                {r.comment && <q>{r.comment}</q>}
              </li>
            )
          })}
        </ul>
      </section>

      <RiskSignals priority={priority} signals={signals} />

      {c.kind === 'player' && (
        <section aria-label="Record">
          <h3>Record</h3>
          <ViolationHistory violations={record} now={now} />
        </section>
      )}

      <DecisionForm case={c} targetName={targetName} suggestion={suggestion} actor={actor} claim={claim} now={now} onSubmit={onResolve} busy={busy} />
    </article>
  )
}
