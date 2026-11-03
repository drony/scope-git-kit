import { cn } from '@/kit/lib/cn'

interface QuotaMeterProps {
  /** People who registered. */
  value: number
  /** Places there are. */
  quota: number
  size?: 'sm' | 'md'
  className?: string
}

/**
 * How full a show is: a bar and the numbers. Below 80% it is plain, from 80% it says "filling" and turns amber, at 100% it says
 * "full". The words carry the state, so colour is never the only cue.
 */
export function QuotaMeter({ value, quota, size = 'md', className }: QuotaMeterProps) {
  const ratio = quota > 0 ? value / quota : 0
  const state = ratio >= 1 ? 'full' : ratio >= 0.8 ? 'filling' : 'open'
  const n = (x: number) => x.toLocaleString('en')
  return (
    <div
      className={cn('qm', `qm-${size}`, `is-${state}`, className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={quota}
      aria-valuenow={Math.min(value, quota)}
      aria-valuetext={`${n(value)} of ${n(quota)} places taken${state === 'open' ? '' : `, ${state}`}`}
    >
      <span className="qm-bar" aria-hidden="true">
        <i style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </span>
      <span className="qm-text">
        <strong>{n(value)}</strong> / {n(quota)}
        {state !== 'open' && <em>{state === 'full' ? 'Full' : 'Filling'}</em>}
      </span>
    </div>
  )
}
