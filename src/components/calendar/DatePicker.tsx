import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFormat } from '@/lib/format'
import { isSameDay, today } from '@/lib/date'
import { Popover } from '@/components/overlays/Popover'
import { useFieldProps } from '@/components/forms/Field'
import { Button } from '@/components/ui/Button'
import { Calendar } from './Calendar'

interface DatePickerProps {
  value: Date | null
  onChange: (value: Date | null) => void
  placeholder?: string
  min?: Date
  max?: Date
  /** Month shown first when no date is selected yet. */
  defaultMonth?: Date
  isDisabled?: (d: Date) => boolean
  /** Adds a "Clear" action. */
  clearable?: boolean
  ariaLabel?: string
  disabled?: boolean
}

/** Input-style trigger that opens a single-date Calendar. */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  min,
  max,
  defaultMonth,
  isDisabled,
  clearable,
  ariaLabel,
  disabled,
}: DatePickerProps) {
  const field = useFieldProps()
  const fmt = useFormat()
  const [open, setOpen] = useState(false)
  const now = today()
  const todayAllowed = !(min && now < min) && !(max && now > max) && !isDisabled?.(now)

  return (
    <Popover
      open={open}
      onOpenChange={(o) => !disabled && setOpen(o)}
      initialFocus={-1}
      trigger={
        <button
          type="button"
          disabled={disabled}
          className="input select-trigger"
          aria-haspopup="dialog"
          aria-label={field.id ? undefined : (ariaLabel ?? placeholder)}
          {...field}
        >
          <span className={cn('select-value', !value && 'is-placeholder')}>{value ? fmt.date(value, 'short') : placeholder}</span>
          <CalendarDays aria-hidden="true" />
        </button>
      }
    >
      <div className="cal-pop">
        <Calendar
          mode="single"
          autoFocus
          value={value}
          min={min}
          max={max}
          defaultMonth={defaultMonth}
          isDisabled={isDisabled}
          onChange={(d) => {
            onChange(d)
            setOpen(false)
          }}
        />
        <div className="cal-foot">
          <Button
            variant="plain"
            size="sm"
            disabled={!todayAllowed || isSameDay(value, now)}
            onClick={() => {
              onChange(now)
              setOpen(false)
            }}
          >
            Today
          </Button>
          {clearable && value && (
            <Button
              variant="plain"
              size="sm"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </Popover>
  )
}
