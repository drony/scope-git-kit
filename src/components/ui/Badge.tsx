import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useFormat } from '@/lib/format'

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'error'

export function Tag({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('tag', tone !== 'neutral' && `tag-${tone}`, className)}>{children}</span>
}

interface ChipProps {
  children: ReactNode
  /** Colored initial shown before the label. */
  mark?: string
  markColor?: string
  pressed?: boolean
  onClick?: () => void
  className?: string
}

export function Chip({ children, mark, markColor = 'var(--accent)', pressed, onClick, className }: ChipProps) {
  const content = (
    <>
      {mark && (
        <span className="chip-mark" style={{ background: markColor }}>
          {mark}
        </span>
      )}
      {children}
    </>
  )
  if (onClick) {
    return (
      <button type="button" className={cn('chip', className)} aria-pressed={pressed} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <span className={cn('chip', className)}>{content}</span>
}

export function Badge({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('badge', className)}>
      {icon}
      <span>{children}</span>
    </span>
  )
}

interface DeltaProps {
  value: number
  digits?: number
  /** Custom text, e.g. rank movement ("+5"). Defaults to a signed percent. */
  format?: (n: number) => string
  className?: string
}

export function Delta({ value, digits = 2, format, className }: DeltaProps) {
  const fmt = useFormat()
  const tone = value > 0 ? '' : value < 0 ? 'delta-down' : 'delta-flat'
  const text = value === 0 && !format ? '—' : format ? format(value) : fmt.pct(value, digits)
  return <span className={cn('delta', tone, className)}>{text}</span>
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('eyebrow', className)}>{children}</span>
}

export function Dot({ tone = 'success' }: { tone?: 'success' | 'warning' | 'error' }) {
  return <span className={cn('dot', tone !== 'success' && `dot-${tone}`)} aria-hidden="true" />
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>
}
