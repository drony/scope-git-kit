import { cn } from '@/kit/lib/cn'
import { STAGES, type ReviewView } from '../lib/review'

interface ReviewRailProps {
  /** How many questions are in each view. See `reviewCounts`. */
  counts: Record<ReviewView, number>
  value: ReviewView
  onChange: (view: ReviewView) => void
  className?: string
}

const Item = ({ view, label, hint, count, value, onChange, tone }: { view: ReviewView; label: string; hint?: string; count: number; value: ReviewView; onChange: (v: ReviewView) => void; tone?: string }) => (
  <button type="button" className={cn('rv-view', value === view && 'is-on', tone)} aria-current={value === view ? 'true' : undefined} title={hint} onClick={() => onChange(view)}>
    <i className={cn('rv-dot', `is-${view}`)} aria-hidden="true" />
    <span>{label}</span>
    <b>{count.toLocaleString('en')}</b>
  </button>
)

/**
 * The views of the review as a list with counts: what waits for you, every question, one view per stage, and the questions that
 * have waited too long. The first one is for the person using it, so it is the one to open the page on.
 */
export function ReviewRail({ counts, value, onChange, className }: ReviewRailProps) {
  return (
    <nav className={cn('rv-rail', className)} aria-label="Review views">
      <Item view="mine" label="Waiting for you" hint="Questions you can take the next step on" count={counts.mine} value={value} onChange={onChange} tone="is-mine" />
      <Item view="all" label="All questions" hint="Every question except the trash" count={counts.all} value={value} onChange={onChange} />
      <h3>Stages</h3>
      {STAGES.map((s) => (
        <Item key={s.id} view={s.id} label={s.label} hint={s.hint} count={counts[s.id]} value={value} onChange={onChange} />
      ))}
      <h3>Attention</h3>
      <Item view="stale" label="Waiting too long" hint="Waiting for a reviewer for days" count={counts.stale} value={value} onChange={onChange} tone={counts.stale > 0 ? 'is-warn' : undefined} />
    </nav>
  )
}
