import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import { useFormat } from '@/kit/lib/format'
import { Popover } from '@/kit/components/overlays/Popover'
import { useFieldProps } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { CalNav, MonthGrid, YearGrid } from './Calendar'

export interface YearMonth {
  year: number
  month: number
}

interface MonthPickerProps {
  value: YearMonth | null
  onChange: (value: YearMonth) => void
  min?: Date
  max?: Date
  className?: string
}

/** Inline month chooser: a year header over a 3×4 grid of months. */
export function MonthPicker({ value, onChange, min, max, className }: MonthPickerProps) {
  const [year, setYear] = useState(value?.year ?? new Date().getFullYear())
  const [years, setYears] = useState(false)
  const base = Math.floor(year / 12) * 12

  return (
    <div className={cn('cal cal-narrow', className)}>
      {years ? (
        <>
          <CalNav label={`${base} – ${base + 11}`} onPrev={() => setYear(year - 12)} onNext={() => setYear(year + 12)} />
          <YearGrid
            base={base}
            selected={year}
            min={min}
            max={max}
            onSelect={(y) => {
              setYear(y)
              setYears(false)
            }}
          />
        </>
      ) : (
        <>
          <CalNav
            label={String(year)}
            titleLabel="Choose a year"
            onTitle={() => setYears(true)}
            onPrev={() => setYear(year - 1)}
            onNext={() => setYear(year + 1)}
            prevDisabled={Boolean(min && year <= min.getFullYear())}
            nextDisabled={Boolean(max && year >= max.getFullYear())}
          />
          <MonthGrid year={year} selected={value} min={min} max={max} onSelect={(month) => onChange({ year, month })} />
        </>
      )}
    </div>
  )
}

/** Input-style trigger that opens a MonthPicker. */
export function MonthField({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select month',
  ariaLabel,
}: MonthPickerProps & { placeholder?: string; ariaLabel?: string }) {
  const field = useFieldProps()
  const fmt = useFormat()
  const [open, setOpen] = useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      initialFocus={0}
      trigger={
        <button
          type="button"
          className="input select-trigger"
          aria-haspopup="dialog"
          aria-label={field.id ? undefined : (ariaLabel ?? placeholder)}
          {...field}
        >
          <span className={cn('select-value', !value && 'is-placeholder')}>
            {value ? fmt.date(new Date(value.year, value.month, 1), 'monthYear') : placeholder}
          </span>
          <CalendarRange aria-hidden="true" />
        </button>
      }
    >
      <div className="cal-pop">
        <MonthPicker
          value={value}
          min={min}
          max={max}
          onChange={(v) => {
            onChange(v)
            setOpen(false)
          }}
        />
        <div className="cal-foot">
          <Button
            variant="plain"
            size="sm"
            onClick={() => {
              const now = new Date()
              onChange({ year: now.getFullYear(), month: now.getMonth() })
              setOpen(false)
            }}
          >
            This month
          </Button>
        </div>
      </div>
    </Popover>
  )
}
