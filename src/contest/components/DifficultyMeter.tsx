import { useId } from 'react'
import { cn } from '@/kit/lib/cn'
import type { Difficulty } from '../data/types'
import { LEVELS, levelInfo } from '../lib/difficulty'

interface DifficultyMeterProps {
  value?: Difficulty
  /** Makes it a picker: five choices, each with its own ladder and name. Without it the meter only shows. */
  onChange?: (level: Difficulty) => void
  /** The size of the ladder. */
  size?: 'sm' | 'md'
  /** In the picker: one slim row of choices, without the hints. */
  compact?: boolean
  /** Shows the name next to the ladder (read-only meter). The picker always shows names. */
  showName?: boolean
  className?: string
}

/** Five bars that grow, filled up to the level, in the colour of that level. The name is there too: colour is never the only cue. */
function Ladder({ level, size }: { level: number; size: 'sm' | 'md' }) {
  return (
    <span className={cn('lv-ladder', `is-${size}`)} aria-hidden="true">
      {LEVELS.map((l) => (
        <i key={l.level} className={cn(l.level <= level && 'is-on')} style={{ height: `${(size === 'sm' ? 4 : 6) + l.level * (size === 'sm' ? 2.5 : 3.5)}px`, ['--lv' as string]: `var(--level-${level || 1})` }} />
      ))}
    </span>
  )
}

/**
 * The difficulty of a question as a ladder of five growing bars: Warm-up, Easy, Medium, Hard, Finale. Read-only it is a small
 * badge for lists and cards; with `onChange` it is a picker whose choices are real radio buttons, so arrow keys work.
 */
export function DifficultyMeter({ value, onChange, size = 'md', compact, showName = true, className }: DifficultyMeterProps) {
  const name = useId()
  if (!onChange) {
    const info = value ? levelInfo(value) : undefined
    return (
      <span className={cn('lv', !value && 'is-unset', className)} role="img" aria-label={info ? `Difficulty: ${info.name}, level ${value} of 5` : 'No difficulty set'}>
        <Ladder level={value ?? 0} size={size} />
        {showName && <span className="lv-name">{info?.name ?? 'Not set'}</span>}
      </span>
    )
  }
  return (
    <div className={cn('lv-picker', compact && 'is-compact', className)} role="radiogroup" aria-label="Difficulty">
      {LEVELS.map((l) => (
        <label key={l.level} className={cn('lv-choice', value === l.level && 'is-picked')} style={{ ['--lv' as string]: `var(--level-${l.level})` }}>
          <input type="radio" name={name} checked={value === l.level} onChange={() => onChange(l.level)} />
          <Ladder level={l.level} size={compact ? 'sm' : 'md'} />
          <strong>{l.name}</strong>
          {!compact && <small>{l.hint}</small>}
        </label>
      ))}
    </div>
  )
}
