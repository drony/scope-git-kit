import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import type { Id, WeeklyProgram } from '../data/types'
import { programChecks } from '../lib/program'

interface ProgramChecksProps {
  program: WeeklyProgram
  /** Makes each check a button that jumps to the show it is about. */
  onSelect?: (slotId: Id) => void
  className?: string
}

/** What is wrong with the program, errors first: overlapping shows, too many seats, a missing topic, a topic three days in a row. */
export function ProgramChecks({ program, onSelect, className }: ProgramChecksProps) {
  const checks = programChecks(program)
  if (checks.length === 0) {
    return (
      <p className={cn('pg-ok', className)} role="status">
        <CircleCheck aria-hidden="true" /> The program has no problems.
      </p>
    )
  }
  return (
    <ul className={cn('pg-checks', className)} aria-label="Checks">
      {checks.map((c, i) => {
        const Icon = c.level === 'error' ? CircleAlert : TriangleAlert
        const body = (
          <>
            <Icon aria-hidden="true" />
            <span>
              <b>{c.level === 'error' ? 'Fix: ' : 'Look: '}</b>
              {c.text}
            </span>
          </>
        )
        return (
          <li key={i} className={`is-${c.level}`}>
            {onSelect && c.slotId ? (
              <button type="button" onClick={() => onSelect(c.slotId!)}>
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        )
      })}
    </ul>
  )
}
