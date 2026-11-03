import { cn } from '@/kit/lib/cn'
import type { DayActivity } from '../lib/audit'

interface AuditActivityProps {
  /** One entry per day, oldest first. See `activityByDay`. */
  days: DayActivity[]
  /** The day that is chosen, "YYYY-MM-DD". */
  selected?: string
  /** Called with the day that was pressed, or undefined when the chosen day was pressed again. */
  onSelect?: (date: string | undefined) => void
  className?: string
}

/**
 * How many changes were made on each day, as bars. The part of a bar that is sensitive (a deletion, a revert, a change to the
 * gate or the pack, a serious decision) is drawn in red, so a day with something to look at stands out. Press a day to see only its
 * changes; press it again to see all.
 */
export function AuditActivity({ days, selected, onSelect, className }: AuditActivityProps) {
  const max = Math.max(1, ...days.map((d) => d.count))
  return (
    <ol className={cn('au-activity', className)} aria-label="Changes per day">
      {days.map((d, i) => {
        const body = (
          <>
            <span className="au-bar" aria-hidden="true">
              <i className="is-all" style={{ height: `${(d.count / max) * 100}%` }}>
                <b style={{ height: d.count ? `${(d.sensitive / d.count) * 100}%` : 0 }} />
              </i>
            </span>
            <small>{i === 0 || i === days.length - 1 || i % 4 === 0 ? d.label : ''}</small>
          </>
        )
        const text = `${d.label}: ${d.count} change${d.count === 1 ? '' : 's'}${d.sensitive ? `, ${d.sensitive} sensitive` : ''}`
        return (
          <li key={d.date}>
            {onSelect ? (
              <button type="button" className={cn('au-day', selected === d.date && 'is-on')} aria-pressed={selected === d.date} aria-label={text} title={text} onClick={() => onSelect(selected === d.date ? undefined : d.date)}>
                {body}
              </button>
            ) : (
              <div className="au-day" role="img" aria-label={text} title={text}>
                {body}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
