import { cn } from '@/kit/lib/cn'
import type { WeeklyProgram } from '../data/types'
import { seatsSummary, slotLabel } from '../lib/program'

interface QualificationFlowProps {
  program: WeeklyProgram
  className?: string
}

/**
 * How the week leads to the final: one bar with a segment for every daily show, as wide as the seats it gives, against the room
 * the final has. Seats that are left stay open (for invitations or wild cards); seats above the room are marked as too many.
 */
export function QualificationFlow({ program, className }: QualificationFlowProps) {
  const { dailies, finals, seats, capacity, open } = seatsSummary(program)
  if (finals.length === 0) return <p className={cn('pg-flow-empty', className)}>Add a final to see how the daily shows lead to it.</p>
  const scale = Math.max(seats, capacity, 1)
  const over = seats > capacity
  const n = (x: number) => x.toLocaleString('en')
  return (
    <div className={cn('pg-flow', over && 'is-over', className)}>
      <div className="pg-flow-bar" role="img" aria-label={`${n(seats)} seats from the daily shows, ${n(capacity)} places in the final`}>
        {dailies.map((s, i) => (
          <i key={s.id} title={`${slotLabel(s)}: ${n(s.seats)} seats`} style={{ width: `${(s.seats / scale) * 100}%`, background: `var(--tile-${(i % 4) + 1})` }} />
        ))}
        {!over && open > 0 && <i className="is-open" style={{ width: `${(open / scale) * 100}%` }} />}
        {over && <b className="pg-flow-mark" style={{ left: `${(capacity / scale) * 100}%` }} aria-hidden="true" />}
      </div>
      <p className="pg-flow-sum">
        <strong>{n(seats)}</strong> seats from the daily shows, <strong>{n(capacity)}</strong> places in the final.{' '}
        {over ? <span className="pg-flow-warn">{n(seats - capacity)} too many.</span> : <span>{n(open)} stay open.</span>}
      </p>
      <ul className="pg-flow-list">
        {dailies.map((s, i) => (
          <li key={s.id}>
            <i style={{ background: `var(--tile-${(i % 4) + 1})` }} aria-hidden="true" />
            {slotLabel(s)} · {s.topic || 'no topic'} · {n(s.seats)}
          </li>
        ))}
      </ul>
    </div>
  )
}
