import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

type When = Date | string | number

interface CountdownProps {
  /** The moment it counts down to. */
  to: When
  /** Shown instead of the numbers once the moment has passed. */
  doneLabel?: ReactNode
  /** Called once when it reaches zero. */
  onDone?: () => void
  /** `blocks` shows four boxes; `inline` shows a single line like 2d 03:14:09. */
  variant?: 'blocks' | 'inline'
  /** Words under the blocks. */
  labels?: { days: string; hours: string; minutes: string; seconds: string }
  /** Replaces the clock, for tests and demos. */
  now?: () => number
  className?: string
}

const DEFAULT_LABELS = { days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds' }
const at = (when: When) => (when instanceof Date ? when.getTime() : new Date(when).getTime())
const two = (n: number) => String(n).padStart(2, '0')

export function splitRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return { days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 }
}

/** A countdown to a moment. It ticks every second; screen readers hear the time left, not every tick. */
export function Countdown({ to, doneLabel = 'Time is up', onDone, variant = 'blocks', labels = DEFAULT_LABELS, now = Date.now, className }: CountdownProps) {
  const target = at(to)
  const [tick, setTick] = useState(() => now())
  const fired = useRef(false)

  useEffect(() => {
    const id = window.setInterval(() => setTick(now()), 1000)
    return () => window.clearInterval(id)
  }, [now])

  const remaining = target - tick
  const done = remaining <= 0
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true
      onDone?.()
    }
    if (!done) fired.current = false
  }, [done, onDone])

  if (done) return <span className={cn('countdown is-done', className)}>{doneLabel}</span>

  const { days, hours, minutes, seconds } = splitRemaining(remaining)
  const spoken = [days && `${days} ${labels.days}`, (days || hours) && `${hours} ${labels.hours}`, `${minutes} ${labels.minutes}`].filter(Boolean).join(', ')

  if (variant === 'inline') {
    return (
      <time className={cn('countdown countdown-inline', className)} dateTime={new Date(target).toISOString()} aria-label={`${spoken} left`}>
        {days > 0 && `${days}d `}
        {two(hours)}:{two(minutes)}:{two(seconds)}
      </time>
    )
  }
  const parts: Array<[keyof typeof DEFAULT_LABELS, number]> = [['days', days], ['hours', hours], ['minutes', minutes], ['seconds', seconds]]
  return (
    <time className={cn('countdown', className)} dateTime={new Date(target).toISOString()} aria-label={`${spoken} left`}>
      {parts.map(([unit, value]) => (
        <span key={unit} className="countdown-part" aria-hidden="true">
          <strong>{two(value)}</strong>
          <small>{labels[unit]}</small>
        </span>
      ))}
    </time>
  )
}
