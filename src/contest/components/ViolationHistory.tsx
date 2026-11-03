import { cn } from '@/kit/lib/cn'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import type { Violation } from '../data/types'
import { REASONS, activeSuspension } from '../lib/moderation'
import { relativeTime } from '../lib/dates'

const LADDER = ['Warning', 'Short suspension', 'Long suspension', 'Disqualified']
const TONE: Record<Violation['action'], Tone> = { warn: 'warning', suspend: 'accent', disqualify: 'error' }
const WORD: Record<Violation['action'], string> = { warn: 'Warning', suspend: 'Suspension', disqualify: 'Disqualified' }

interface ViolationHistoryProps {
  /** The violations of one player. */
  violations: Violation[]
  /** The clock, in milliseconds. */
  now: number
  className?: string
}

/**
 * A player's record on the ladder: four steps (warning, short suspension, long suspension, disqualification), filled as far as
 * the number of violations, and the entries under it, newest first, each with who decided and why. A suspension that is still
 * running says until when.
 */
export function ViolationHistory({ violations, now, className }: ViolationHistoryProps) {
  const sorted = [...violations].sort((a, b) => b.at.localeCompare(a.at))
  const running = violations[0] ? activeSuspension(violations[0].participantId, violations, now) : undefined
  const step = Math.min(4, violations.length)
  return (
    <section className={cn('mq-record', className)} aria-label="Violations">
      <ol className="mq-ladder" aria-label={`${violations.length} violation${violations.length === 1 ? '' : 's'} on a ladder of four`}>
        {LADDER.map((name, i) => (
          <li key={name} className={cn(i < step && 'is-on', i === 3 && 'is-last')}>
            <i aria-hidden="true" />
            <span>{name}</span>
          </li>
        ))}
      </ol>
      {running && <p className="mq-running">Suspended until {new Date(running.endsAt!).toLocaleDateString('en', { month: 'short', day: 'numeric' })}.</p>}
      {sorted.length === 0 ? (
        <p className="mq-nodata">No violations on record.</p>
      ) : (
        <ul className="mq-entries">
          {sorted.map((v) => (
            <li key={v.id}>
              <Tag tone={TONE[v.action]}>{WORD[v.action]}</Tag>
              <span>
                <b>{REASONS[v.reason].label}.</b> {v.note}
                <small>
                  {v.by} · {relativeTime(v.at, new Date(now))}
                  {v.endsAt ? ` · ${Date.parse(v.endsAt) > now ? 'until' : 'ended'} ${new Date(v.endsAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : ''}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
