import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import { SLA_DAYS, type CasePriority, type Priority, type Signal } from '../lib/moderation'

const TONE: Record<Priority, Tone> = { urgent: 'error', high: 'warning', medium: 'accent', low: 'neutral' }

interface RiskSignalsProps {
  priority: CasePriority
  /** What the data shows about the target. See `playerSignals` and `questionSignals`. */
  signals: Signal[]
  className?: string
}

/**
 * Why a case has the priority it has. No hidden score: every point has a sentence ("Cheating is serious +3", "3 different people
 * reported it +2"), and under them what the data shows, with how strong each sign is. An overdue case says by how long it should
 * have been done.
 */
export function RiskSignals({ priority, signals, className }: RiskSignalsProps) {
  return (
    <section className={cn('mq-why', className)} aria-label="Why this priority">
      <header>
        <Tag tone={TONE[priority.level]}>{priority.level} priority</Tag>
        <b>{priority.score} points</b>
        {priority.overdue && <span className="mq-sla">Overdue: should be done in {SLA_DAYS[priority.level]} d</span>}
      </header>
      <ul className="mq-factors">
        {priority.factors.map((f) => (
          <li key={f.label}>
            <b className={cn(f.points < 0 && 'is-minus')}>
              {f.points > 0 ? '+' : ''}
              {f.points}
            </b>
            {f.label}
          </li>
        ))}
      </ul>
      <h4>What the data shows</h4>
      {signals.length === 0 ? (
        <p className="mq-nodata">Nothing unusual, or not enough data to say.</p>
      ) : (
        <ul className="mq-signals">
          {signals.map((s) => (
            <li key={s.id}>
              <span className="mq-strength" role="img" aria-label={`Strength ${s.strength} of 3`}>
                {[1, 2, 3].map((n) => (
                  <i key={n} className={cn(n <= s.strength && 'is-on')} />
                ))}
              </span>
              <span>
                <b>{s.label}.</b> {s.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
