import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import { useSite } from '@/kit/context/ConfigContext'
import { useFormat } from '@/kit/lib/format'
import {
  addDays,
  addMonths,
  clampDate,
  isAfter,
  isBefore,
  isBetween,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfMonth,
  startOfWeek,
  toKey,
  today,
  type DateRange,
} from '@/kit/lib/date'

export type MarkTone = 'accent' | 'success' | 'warning' | 'error'
export type CalendarMarks = Record<string, MarkTone>

interface BaseProps {
  min?: Date
  max?: Date
  isDisabled?: (d: Date) => boolean
  /** Small colored dots under days, keyed by YYYY-MM-DD. */
  marks?: CalendarMarks
  /** Show two months side by side. */
  months?: 1 | 2
  /** Move keyboard focus onto the selected day when mounted (use inside popovers). */
  autoFocus?: boolean
  /** Month to show first when nothing is selected. Defaults to the current month. */
  defaultMonth?: Date
  /** Controlled visible month (first month when months = 2). */
  month?: Date
  onMonthChange?: (month: Date) => void
  className?: string
}

type SingleProps = BaseProps & { mode?: 'single'; value: Date | null; onChange: (d: Date) => void }
type RangeProps = BaseProps & { mode: 'range'; value: DateRange; onChange: (r: DateRange) => void }
export type CalendarProps = SingleProps | RangeProps

type View = 'days' | 'months' | 'years'

/* ---- Month and year grids (also used by MonthPicker) ----------------------- */

export function MonthGrid({
  year,
  selected,
  onSelect,
  min,
  max,
}: {
  year: number
  selected?: { year: number; month: number } | null
  onSelect: (month: number) => void
  min?: Date
  max?: Date
}) {
  const fmt = useFormat()
  const now = today()
  return (
    <div className="cal-grid3" role="group" aria-label={`Months of ${year}`}>
      {Array.from({ length: 12 }, (_, m) => {
        const first = new Date(year, m, 1)
        const last = new Date(year, m + 1, 0)
        const disabled = (min && isBefore(last, min)) || (max && isAfter(first, max))
        return (
          <button
            key={m}
            type="button"
            className={cn(
              'cal-cell',
              selected?.year === year && selected.month === m && 'is-selected',
              now.getFullYear() === year && now.getMonth() === m && 'is-today',
            )}
            disabled={Boolean(disabled)}
            aria-pressed={selected?.year === year && selected.month === m}
            onClick={() => onSelect(m)}
          >
            {fmt.monthName(m, 'short')}
          </button>
        )
      })}
    </div>
  )
}

export function YearGrid({
  base,
  selected,
  onSelect,
  min,
  max,
}: {
  /** First year of the 12-year block. */
  base: number
  selected?: number | null
  onSelect: (year: number) => void
  min?: Date
  max?: Date
}) {
  const now = new Date().getFullYear()
  return (
    <div className="cal-grid3" role="group" aria-label={`Years ${base} to ${base + 11}`}>
      {Array.from({ length: 12 }, (_, i) => {
        const y = base + i
        const disabled = (min && y < min.getFullYear()) || (max && y > max.getFullYear())
        return (
          <button
            key={y}
            type="button"
            className={cn('cal-cell', selected === y && 'is-selected', now === y && 'is-today')}
            disabled={Boolean(disabled)}
            aria-pressed={selected === y}
            onClick={() => onSelect(y)}
          >
            {y}
          </button>
        )
      })}
    </div>
  )
}

export function CalNav({
  label,
  onPrev,
  onNext,
  onTitle,
  prevDisabled,
  nextDisabled,
  titleLabel,
}: {
  label: string
  onPrev?: () => void
  onNext?: () => void
  onTitle?: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  titleLabel?: string
}) {
  return (
    <div className="cal-head">
      {onPrev ? (
        <button type="button" className="cal-nav" onClick={onPrev} disabled={prevDisabled} aria-label="Previous">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      ) : (
        <span className="cal-nav" aria-hidden="true" />
      )}
      {onTitle ? (
        <button type="button" className="cal-title" onClick={onTitle} aria-label={titleLabel}>
          {label}
        </button>
      ) : (
        <span className="cal-title" aria-live="polite">
          {label}
        </span>
      )}
      {onNext ? (
        <button type="button" className="cal-nav" onClick={onNext} disabled={nextDisabled} aria-label="Next">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      ) : (
        <span className="cal-nav" aria-hidden="true" />
      )}
    </div>
  )
}

/* ---- Calendar ------------------------------------------------------------------ */

export function Calendar(props: CalendarProps) {
  const { min, max, isDisabled, marks, months = 1, autoFocus, className } = props
  const { weekStartsOn } = useSite()
  const fmt = useFormat()

  const selectedDate = props.mode === 'range' ? props.value.from : props.value
  const [innerMonth, setInnerMonth] = useState(() => startOfMonth(props.month ?? selectedDate ?? props.defaultMonth ?? today()))
  const cursor = props.month ? startOfMonth(props.month) : innerMonth
  const setCursor = (d: Date) => {
    const first = startOfMonth(d)
    setInnerMonth(first)
    props.onMonthChange?.(first)
  }

  const [view, setView] = useState<View>('days')
  const [focus, setFocus] = useState<Date>(() => clampDate(selectedDate ?? props.defaultMonth ?? today(), min, max))
  const [hover, setHover] = useState<Date | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const shouldFocus = useRef(Boolean(autoFocus))

  const visible = useMemo(() => Array.from({ length: months }, (_, i) => addMonths(cursor, i)), [cursor, months])
  const isVisible = (d: Date) => visible.some((v) => isSameMonth(v, d))
  const tabbable = isVisible(focus) ? focus : cursor

  useEffect(() => {
    if (!shouldFocus.current || view !== 'days') return
    shouldFocus.current = false
    // preventScroll: inside a popover the grid is not positioned yet, and focusing it would scroll the page to (0, 0).
    gridRef.current?.querySelector<HTMLElement>(`[data-key="${toKey(tabbable)}"]`)?.focus({ preventScroll: true })
  }, [focus, cursor, view, tabbable])

  const disabledDay = (d: Date) => Boolean((min && isBefore(d, min)) || (max && isAfter(d, max)) || isDisabled?.(d))

  const select = (d: Date) => {
    setFocus(d)
    if (props.mode === 'range') {
      const { from, to } = props.value
      if (!from || to) props.onChange({ from: d, to: null })
      else if (isBefore(d, from)) props.onChange({ from: d, to: null })
      else props.onChange({ from, to: d })
    } else {
      props.onChange(d)
    }
  }

  const moveFocus = (next: Date) => {
    const target = clampDate(next, min, max)
    shouldFocus.current = true
    setFocus(target)
    if (!isVisible(target)) setCursor(isBefore(target, cursor) ? target : addMonths(target, -(months - 1)))
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const base = tabbable
    const keys: Record<string, Date> = {
      ArrowLeft: addDays(base, -1),
      ArrowRight: addDays(base, 1),
      ArrowUp: addDays(base, -7),
      ArrowDown: addDays(base, 7),
      Home: startOfWeek(base, weekStartsOn),
      End: addDays(startOfWeek(base, weekStartsOn), 6),
      PageUp: addMonths(base, e.shiftKey ? -12 : -1),
      PageDown: addMonths(base, e.shiftKey ? 12 : 1),
    }
    if (keys[e.key]) {
      e.preventDefault()
      moveFocus(keys[e.key])
    }
  }

  const rangeFrom = props.mode === 'range' ? props.value.from : null
  const rangeTo = props.mode === 'range' ? (props.value.to ?? (rangeFrom && hover && !isBefore(hover, rangeFrom) ? hover : null)) : null

  const dayClass = (d: Date) => {
    const isStart = rangeFrom ? isSameDay(d, rangeFrom) : false
    const isEnd = rangeTo ? isSameDay(d, rangeTo) : false
    const inRange = rangeFrom && rangeTo ? isBetween(d, rangeFrom, rangeTo) : false
    return cn(
      'cal-day',
      isSameDay(d, today()) && 'is-today',
      props.mode !== 'range' && isSameDay(d, props.value as Date | null) && 'is-selected',
      props.mode === 'range' && (isStart || isEnd) && 'is-selected',
      inRange && !isStart && !isEnd && 'is-range',
      inRange && isStart && !isEnd && 'is-range-start',
      inRange && isEnd && !isStart && 'is-range-end',
    )
  }

  const weekdayIndexes = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7)

  const lastVisible = visible[visible.length - 1]
  const prevDisabled = Boolean(min && isBefore(new Date(cursor.getFullYear(), cursor.getMonth(), 0), min))
  const nextDisabled = Boolean(max && isAfter(new Date(lastVisible.getFullYear(), lastVisible.getMonth() + 1, 1), max))

  if (view === 'years') {
    const base = Math.floor(cursor.getFullYear() / 12) * 12
    return (
      <div className={cn('cal', className)}>
        <CalNav
          label={`${base} – ${base + 11}`}
          onPrev={() => setCursor(new Date(cursor.getFullYear() - 12, cursor.getMonth(), 1))}
          onNext={() => setCursor(new Date(cursor.getFullYear() + 12, cursor.getMonth(), 1))}
        />
        <YearGrid
          base={base}
          selected={cursor.getFullYear()}
          min={min}
          max={max}
          onSelect={(y) => {
            setCursor(new Date(y, cursor.getMonth(), 1))
            setView('months')
          }}
        />
      </div>
    )
  }

  if (view === 'months') {
    return (
      <div className={cn('cal', className)}>
        <CalNav
          label={String(cursor.getFullYear())}
          titleLabel="Choose a year"
          onTitle={() => setView('years')}
          onPrev={() => setCursor(new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1))}
          onNext={() => setCursor(new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1))}
        />
        <MonthGrid
          year={cursor.getFullYear()}
          selected={{ year: cursor.getFullYear(), month: cursor.getMonth() }}
          min={min}
          max={max}
          onSelect={(m) => {
            setCursor(new Date(cursor.getFullYear(), m, 1))
            setView('days')
          }}
        />
      </div>
    )
  }

  return (
    <div className={cn('cal', className)}>
      <div className="cal-months" ref={gridRef} onKeyDown={onKeyDown}>
        {visible.map((month, mi) => (
          <div className="cal-month" key={toKey(month)}>
            <CalNav
              label={fmt.date(month, 'monthYear')}
              titleLabel="Choose month and year"
              onTitle={() => {
                setCursor(month)
                setView('months')
              }}
              onPrev={mi === 0 ? () => setCursor(addMonths(cursor, -1)) : undefined}
              onNext={mi === months - 1 ? () => setCursor(addMonths(cursor, 1)) : undefined}
              prevDisabled={prevDisabled}
              nextDisabled={nextDisabled}
            />
            <div role="grid" aria-label={fmt.date(month, 'monthYear')}>
              <div className="cal-weekdays" role="row">
                {weekdayIndexes.map((w) => (
                  <span key={w} role="columnheader" aria-label={fmt.weekdayName(w, 'long')}>
                    {fmt.weekdayName(w, 'short').slice(0, 2)}
                  </span>
                ))}
              </div>
              {monthGrid(month.getFullYear(), month.getMonth(), weekStartsOn).map((week, wi) => (
                <div className="cal-week" role="row" key={wi}>
                  {week.map((d, di) =>
                    d ? (
                      <button
                        key={di}
                        type="button"
                        role="gridcell"
                        data-key={toKey(d)}
                        className={dayClass(d)}
                        tabIndex={isSameDay(d, tabbable) ? 0 : -1}
                        disabled={disabledDay(d)}
                        aria-selected={
                          props.mode === 'range'
                            ? isSameDay(d, props.value.from) || isSameDay(d, props.value.to)
                            : isSameDay(d, props.value as Date | null)
                        }
                        aria-label={fmt.date(d, 'long')}
                        aria-current={isSameDay(d, today()) ? 'date' : undefined}
                        onClick={() => select(d)}
                        onMouseEnter={() => props.mode === 'range' && setHover(d)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setFocus(d)}
                      >
                        {d.getDate()}
                        {marks?.[toKey(d)] && <i className={cn('cal-mark', `is-${marks[toKey(d)]}`)} aria-hidden="true" />}
                      </button>
                    ) : (
                      <span key={di} role="gridcell" aria-hidden="true" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
