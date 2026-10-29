import { useMemo } from 'react'
import { cn } from '@/kit/lib/cn'
import { useSite } from '@/kit/context/ConfigContext'
import { useFormat } from '@/kit/lib/format'
import { fullMonthGrid, isSameDay, isSameMonth, toKey, today } from '@/kit/lib/date'
import type { MarkTone } from './Calendar'

export interface CalendarEvent {
  id: string
  date: Date
  title: string
  tone: MarkTone
}

interface EventCalendarProps {
  month: Date
  events: CalendarEvent[]
  selected: Date | null
  onSelect: (date: Date) => void
}

/** Full-width month grid that lists events inside each day. */
export function EventCalendar({ month, events, selected, onSelect }: EventCalendarProps) {
  const { weekStartsOn } = useSite()
  const fmt = useFormat()
  const weeks = useMemo(() => fullMonthGrid(month.getFullYear(), month.getMonth(), weekStartsOn), [month, weekStartsOn])
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) map.set(toKey(e.date), [...(map.get(toKey(e.date)) ?? []), e])
    return map
  }, [events])

  return (
    <div className="evcal" role="grid" aria-label={fmt.date(month, 'monthYear')}>
      <div className="evcal-weekdays" role="row">
        {weeks[0].map((d) => (
          <span key={d.getDay()} role="columnheader">
            {fmt.weekdayName(d.getDay(), 'short')}
          </span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div className="evcal-week" role="row" key={wi}>
          {week.map((d) => {
            const list = byDay.get(toKey(d)) ?? []
            return (
              <button
                key={toKey(d)}
                type="button"
                role="gridcell"
                className={cn(
                  'evcal-day',
                  !isSameMonth(d, month) && 'is-outside',
                  isSameDay(d, today()) && 'is-today',
                  isSameDay(d, selected) && 'is-selected',
                )}
                aria-selected={isSameDay(d, selected)}
                aria-label={`${fmt.date(d, 'long')}${list.length ? `, ${list.length} events` : ''}`}
                onClick={() => onSelect(d)}
              >
                <span className="evcal-num">{d.getDate()}</span>
                <span className="evcal-events">
                  {list.slice(0, 2).map((e) => (
                    <span key={e.id} className={cn('evcal-event', `is-${e.tone}`)}>
                      {e.title}
                    </span>
                  ))}
                  {list.length > 2 && <span className="evcal-more">+{list.length - 2} more</span>}
                </span>
                {list.length > 0 && (
                  <span className="evcal-dots" aria-hidden="true">
                    {list.slice(0, 3).map((e) => (
                      <i key={e.id} className={`is-${e.tone}`} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
