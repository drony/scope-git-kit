import { Fragment, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  onComplete?: (value: string) => void
  invalid?: boolean
  ariaLabel?: string
}

/** One-time code entry with paste support and arrow/backspace navigation. */
export function OtpInput({ value, onChange, length = 6, onComplete, invalid, ariaLabel = 'Verification code' }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const chars = Array.from({ length }, (_, i) => value[i] ?? '')

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  const onInput = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return
    const next = chars.slice()
    digits.split('').forEach((d, k) => {
      if (i + k < length) next[i + k] = d
    })
    commit(next.join(''))
    refs.current[Math.min(i + digits.length, length - 1)]?.focus()
  }

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = chars.slice()
      if (next[i]) next[i] = ''
      else if (i > 0) {
        next[i - 1] = ''
        refs.current[i - 1]?.focus()
      }
      onChange(next.join(''))
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const onPaste = (e: ClipboardEvent) => {
    e.preventDefault()
    commit(e.clipboardData.getData('text'))
    refs.current[Math.min(e.clipboardData.getData('text').replace(/\D/g, '').length, length - 1)]?.focus()
  }

  return (
    <div className="otp" role="group" aria-label={ariaLabel} onPaste={onPaste}>
      {chars.map((c, i) => (
        <Fragment key={i}>
          {length === 6 && i === 3 && <span className="otp-sep" aria-hidden="true" />}
          <input
            ref={(el) => {
              refs.current[i] = el
            }}
            className="input"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            value={c}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={invalid || undefined}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
          />
        </Fragment>
      ))}
    </div>
  )
}
