import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFormat } from '@/lib/format'
import { isSameDay, rangePresets, today, type DateRange } from '@/lib/date'
import { useMedia } from '@/lib/useMedia'
import { Popover } from '@/components/overlays/Popover'
import { useFieldProps } from '@/components/forms/Field'
import { Button } from '@/components/ui/Button'
import { Calendar } from './Calendar'

interface DateRangePickerProps {
  value: DateRange
  onChange: (value: DateRange) => void
  max?: Date
  min?: Date
  /** Show the quick ranges column (Last 7 days, Year to date ...). */
  presets?: boolean
  placeholder?: string
  ariaLabel?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  min,
  max = today(),
  presets = true,
  placeholder = 'Select range',
  ariaLabel,
  className,
}: DateRangePickerProps) {
  const field = useFieldProps()
  const fmt = useFormat()
  const compact = useMedia('(max-width: 760px)')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange>(value)
  const list = rangePresets()

  const label =
    value.from && value.to
      ? `${fmt.date(value.from, 'short')} – ${fmt.date(value.to, 'short')}`
      : value.from
        ? `${fmt.date(value.from, 'short')} – …`
        : placeholder

  const matched = list.find((p) => isSameDay(p.range.from, draft.from) && isSameDay(p.range.to, draft.to))?.id

  const apply = (range: DateRange) => {
    onChange(range)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(value)
        setOpen(o)
      }}
      placement="bottom-end"
      initialFocus={-1}
      trigger={
        <button
          type="button"
          className={cn('input select-trigger', className)}
          aria-haspopup="dialog"
          aria-label={field.id ? undefined : (ariaLabel ?? placeholder)}
          {...field}
        >
          <span className={cn('select-value', !value.from && 'is-placeholder')}>{label}</span>
          <CalendarRange aria-hidden="true" />
        </button>
      }
    >
      <div className="range-pop">
        {presets && (
          <ul className="range-presets" aria-label="Quick ranges">
            {list.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={cn('range-preset', matched === p.id && 'is-active')}
                  onClick={() => apply(p.range)}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="cal-pop">
          <Calendar
            mode="range"
            autoFocus
            months={compact ? 1 : 2}
            value={draft}
            min={min}
            max={max}
            onChange={setDraft}
            month={undefined}
          />
          <div className="cal-foot">
            <span className="mono small">
              {draft.from ? fmt.date(draft.from, 'day') : '—'} → {draft.to ? fmt.date(draft.to, 'day') : '—'}
            </span>
            <span className="grow" />
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!draft.from || !draft.to} onClick={() => apply(draft)}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Popover>
  )
}
