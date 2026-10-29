import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Popover } from '@/components/overlays/Popover'
import { useFieldProps } from '@/components/forms/Field'

const pad = (n: number) => String(n).padStart(2, '0')

interface TimeFieldProps {
  /** "HH:MM" in 24-hour time, or empty. */
  value: string
  onChange: (value: string) => void
  /** Minutes between choices. */
  step?: 5 | 10 | 15 | 30
  placeholder?: string
  ariaLabel?: string
}

function Column({
  items,
  selected,
  onPick,
  label,
}: {
  items: number[]
  selected: number | null
  onPick: (n: number) => void
  label: string
}) {
  const ref = useRef<HTMLUListElement>(null)
  useEffect(() => {
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
  }, [])
  return (
    <ul className="time-col" role="listbox" aria-label={label} ref={ref}>
      {items.map((n) => (
        <li key={n} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={n === selected}
            className={cn('time-item', n === selected && 'is-selected')}
            onClick={() => onPick(n)}
          >
            {pad(n)}
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Input-style trigger with hour and minute columns. */
export function TimeField({ value, onChange, step = 15, placeholder = 'Select time', ariaLabel }: TimeFieldProps) {
  const field = useFieldProps()
  const [open, setOpen] = useState(false)
  const [h, m] = value ? value.split(':').map(Number) : [null, null]
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 / step }, (_, i) => i * step)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className="input select-trigger"
          aria-haspopup="dialog"
          aria-label={field.id ? undefined : (ariaLabel ?? placeholder)}
          {...field}
        >
          <span className={cn('select-value', !value && 'is-placeholder')}>{value || placeholder}</span>
          <Clock aria-hidden="true" />
        </button>
      }
    >
      <div className="time-cols">
        <Column items={hours} selected={h} label="Hour" onPick={(n) => onChange(`${pad(n)}:${pad(m ?? 0)}`)} />
        <Column
          items={minutes}
          selected={m}
          label="Minute"
          onPick={(n) => {
            onChange(`${pad(h ?? 9)}:${pad(n)}`)
            setOpen(false)
          }}
        />
      </div>
    </Popover>
  )
}
