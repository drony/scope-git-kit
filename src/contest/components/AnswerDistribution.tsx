import { Check } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import type { ChoiceOption, Id } from '../data/types'

export const TILE_SHAPES = ['▲', '●', '■', '◆', '★', '✚', '⬟', '⬢']

interface AnswerDistributionProps {
  options: ChoiceOption[]
  /** How many people picked each option, by option id. */
  counts: Record<Id, number>
  /** The right options. They are marked once `reveal` is on. */
  correct?: Id[]
  reveal?: boolean
  className?: string
}

/** How the room answered: a bar per option, with its shape and letter, the count and the share. The right ones are marked after the reveal. */
export function AnswerDistribution({ options, counts, correct = [], reveal, className }: AnswerDistributionProps) {
  const total = Object.values(counts).reduce((n, c) => n + c, 0)
  const top = Math.max(1, ...Object.values(counts))
  return (
    <ul className={cn('ad', className)} aria-label="How the room answered">
      {options.map((o, i) => {
        const n = counts[o.id] ?? 0
        const right = reveal && correct.includes(o.id)
        return (
          <li key={o.id} className={cn('ad-row', right && 'is-right', reveal && !right && 'is-dim')} style={{ ['--tile' as string]: `var(--tile-${(i % 4) + 1})` }}>
            <span className="ad-shape" aria-hidden="true">
              {TILE_SHAPES[i % TILE_SHAPES.length]}
            </span>
            <span className="ad-label">
              {o.label || `Option ${String.fromCharCode(65 + i)}`}
              {right && (
                <>
                  {' '}
                  <Check aria-label="Right answer" />
                </>
              )}
            </span>
            <span className="ad-bar" aria-hidden="true">
              <i style={{ width: `${(n / top) * 100}%` }} />
            </span>
            <span className="ad-n">
              {n}
              <small>{total ? ` · ${Math.round((n / total) * 100)}%` : ''}</small>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
