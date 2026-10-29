import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** Mono, uppercase style used for chart ranges (1D, 1W ...). */
  mono?: boolean
  /** Stretch to the full width, with equal-width options. */
  block?: boolean
  className?: string
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel, mono, block, className }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    let next = index
    for (let n = 0; n < options.length; n++) {
      next = (next + step + options.length) % options.length
      if (!options[next].disabled) break
    }
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div className={cn('seg', mono && 'seg-mono', block && 'seg-block', className)} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={value === o.value ? 0 : -1}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
