import { useEffect, useState } from 'react'
import { isHex, normHex } from '@/config/theme'

interface ColorFieldProps {
  value: string
  onChange: (hex: string) => void
  /** Used for screen reader labels. */
  label: string
}

/** Native color picker plus a hex input that only commits valid colors. */
export function ColorField({ value, onChange, label }: ColorFieldProps) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])

  return (
    <div className="color-field">
      <label className="color-swatch" style={{ background: value }}>
        <input type="color" aria-label={`${label}: color picker`} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <input
        className="input"
        value={text}
        spellCheck={false}
        maxLength={7}
        aria-label={`${label}: hex value`}
        aria-invalid={!isHex(text) || undefined}
        onChange={(e) => {
          const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
          setText(next)
          if (isHex(next)) onChange(normHex(next, value))
        }}
        onBlur={() => setText(value)}
      />
    </div>
  )
}
