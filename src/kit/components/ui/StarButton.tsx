import { Star } from 'lucide-react'
import { cn } from '@/kit/lib/cn'

interface StarButtonProps {
  pressed: boolean
  onToggle: () => void
  /** Accessible name, e.g. "Add AAPL to your watchlist". */
  label: string
  size?: number
  className?: string
}

/** A star toggle for favorites and watchlists. Safe inside clickable rows: it does not trigger the row. */
export function StarButton({ pressed, onToggle, label, size = 16, className }: StarButtonProps) {
  return (
    <button
      type="button"
      className={cn('star-btn', pressed && 'is-on', className)}
      aria-pressed={pressed}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Star size={size} fill={pressed ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}
