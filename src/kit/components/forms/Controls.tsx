import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

/* ---- Checkbox --------------------------------------------------------------- */

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  indeterminate?: boolean
  disabled?: boolean
  name?: string
  error?: boolean
}

export function Checkbox({ checked, onChange, label, description, indeterminate, disabled, name, error }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])

  return (
    <label className="check">
      <input
        ref={ref}
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        aria-invalid={error || undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {description ? <strong>{label}</strong> : label}
        {description && <small>{description}</small>}
      </span>
    </label>
  )
}

/* ---- Radio group ---------------------------------------------------------------- */

export interface RadioOption<T extends string> {
  value: T
  label: ReactNode
  description?: ReactNode
  /** Shown in mono on the card variant. */
  price?: ReactNode
  disabled?: boolean
}

interface RadioGroupProps<T extends string> {
  legend: string
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  name?: string
  /** Bordered cards instead of plain radios. */
  cards?: boolean
}

export function RadioGroup<T extends string>({ legend, options, value, onChange, name, cards }: RadioGroupProps<T>) {
  const auto = useId()
  const group = name ?? auto
  return (
    <fieldset style={{ border: 0, padding: 0, minWidth: 0 }}>
      <legend className="sr-only">{legend}</legend>
      <div className={cn(cards ? 'radio-cards' : 'stack-sm')}>
        {options.map((o) =>
          cards ? (
            <label key={o.value} className="radio-card">
              <input
                type="radio"
                name={group}
                value={o.value}
                checked={value === o.value}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
              />
              <strong>{o.label}</strong>
              {o.price && <span className="radio-price">{o.price}</span>}
              {o.description && <span>{o.description}</span>}
            </label>
          ) : (
            <label key={o.value} className="check">
              <input
                type="radio"
                name={group}
                value={o.value}
                checked={value === o.value}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
              />
              <span>
                {o.description ? <strong>{o.label}</strong> : o.label}
                {o.description && <small>{o.description}</small>}
              </span>
            </label>
          ),
        )}
      </div>
    </fieldset>
  )
}

/* ---- Switch ---------------------------------------------------------------------- */

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

/** A labelled row with a toggle on the right. */
export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId()
  return (
    <div className="switch-row">
      <label htmlFor={id} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        className="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  )
}
