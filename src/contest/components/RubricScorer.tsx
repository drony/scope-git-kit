import { Slider } from '@/kit/components/forms/Slider'
import { Button } from '@/kit/components/ui/Button'
import { Meter } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { Id, RubricCriterion } from '../data/types'

interface RubricScorerProps {
  rubric: RubricCriterion[]
  /** Points per criterion, by id. A criterion that is missing counts as 0. */
  value: Record<Id, number>
  onChange: (value: Record<Id, number>) => void
  disabled?: boolean
  className?: string
}

/**
 * Score an answer by criteria: one slider per criterion, with a running total. The sliders work with the keyboard: arrow
 * keys change the points by one, Page Up and Page Down in larger steps, Home and End jump to 0 and to the full
 * points. "Full marks" and "Zero" set every criterion at once.
 */
export function RubricScorer({ rubric, value, onChange, disabled, className }: RubricScorerProps) {
  const total = rubric.reduce((n, r) => n + (value[r.id] ?? 0), 0)
  const max = rubric.reduce((n, r) => n + r.maxPoints, 0)
  const setAll = (full: boolean) => onChange(Object.fromEntries(rubric.map((r) => [r.id, full ? r.maxPoints : 0])))

  return (
    <fieldset className={cn('cs-rubric', className)} disabled={disabled}>
      <legend className="field-label">Score by criteria</legend>
      {rubric.map((r) => (
        <Slider key={r.id} label={r.label || 'Criterion'} min={0} max={Math.max(1, r.maxPoints)} step={1} value={value[r.id] ?? 0} format={(v) => `${v} / ${r.maxPoints}`} onChange={(v) => onChange({ ...value, [r.id]: v })} />
      ))}
      <div className="cs-rubric-total" role="status">
        <strong>
          {total} <span>/ {max} points</span>
        </strong>
        <Meter label="Rubric total" value={total} max={Math.max(1, max)} tone={total === max ? 'success' : undefined} />
        <span className="cs-rubric-quick">
          <Button variant="ghost" size="sm" onClick={() => setAll(true)}>
            Full marks
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAll(false)}>
            Zero
          </Button>
        </span>
      </div>
    </fieldset>
  )
}
