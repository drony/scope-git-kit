import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

interface CountdownRingProps {
  /** Milliseconds left. The ring does not run a clock of its own: you pass the time, so it can follow any clock. */
  remainingMs: number
  /** The whole time the ring counts down from. */
  totalMs: number
  /** Width and height in px. */
  size?: number
  /** Names the timer for screen readers, for example "Time to answer". */
  label?: string
  /** Seconds at which a screen reader is told how much time is left. Time's up is always announced. */
  announceAt?: number[]
  /** Replaces the seconds in the middle. */
  children?: ReactNode
  className?: string
}

/**
 * A ring that empties as time runs out, with the seconds left in the middle. It turns urgent in the last five seconds
 * (with a pulse, unless the person prefers reduced motion). Screen readers hear the time at the moments you choose, not every
 * tick.
 */
export function CountdownRing({ remainingMs, totalMs, size = 96, label = 'Time left', announceAt = [10, 5], children, className }: CountdownRingProps) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const share = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0
  const seconds = Math.ceil(remainingMs / 1000)
  const low = seconds <= 5 && remainingMs > 0
  const spoken = remainingMs <= 0 ? 'Time is up' : announceAt.includes(seconds) ? `${seconds} seconds left` : ''

  return (
    <div className={cn('ring', low && 'is-low', remainingMs <= 0 && 'is-done', className)} style={{ '--ring-size': `${size}px` } as CSSProperties} role="timer" aria-label={`${label}: ${seconds} seconds`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r={radius} />
        <circle className="ring-arc" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - share)} />
      </svg>
      <span className="ring-value" aria-hidden="true">
        {children ?? seconds}
      </span>
      <span className="ring-sr" role="status" aria-live="polite">
        {spoken}
      </span>
    </div>
  )
}
