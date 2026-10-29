import { useId, type CSSProperties } from 'react'

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** How the current value is displayed, e.g. (v) => `${v}%`. */
  format?: (value: number) => string
  /** Small labels under the track. */
  ticks?: string[]
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, format, ticks }: SliderProps) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="slider-wrap">
      <div className="slider-head">
        <label htmlFor={id} style={{ fontWeight: 500 }}>
          {label}
        </label>
        <span className="slider-value">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {ticks && (
        <div className="slider-ticks" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}
