import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/kit/lib/cn'

/** Horizontal progress through a multi-step flow. `current` is zero-based. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="stepper" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current
        return (
          <Fragment key={label}>
            <li className={cn('step', i === current && 'is-current', done && 'is-done')} aria-current={i === current ? 'step' : undefined}>
              <span className="step-dot">{done ? <Check aria-hidden="true" /> : i + 1}</span>
              <span className="step-label">{label}</span>
            </li>
            {i < steps.length - 1 && <span className={cn('step-line', done && 'is-done')} aria-hidden="true" />}
          </Fragment>
        )
      })}
    </ol>
  )
}
