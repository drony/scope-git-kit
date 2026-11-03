import { CircleCheck, Lock, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from '@/kit/components/forms/Controls'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { WeeklyProgram } from '../data/types'
import { impactOf, programChecks, worstSeverity, type Severity } from '../lib/program'

const ICON = { free: CircleCheck, confirm: TriangleAlert, blocked: Lock } as const
const NAME: Record<Severity, string> = { free: 'Safe', confirm: 'Needs confirmation', blocked: 'Locked' }

interface ProgramImpactProps {
  /** The saved program. */
  prev: WeeklyProgram
  /** The program with the edits. */
  next: WeeklyProgram
  registrations: Record<string, number>
  /** The clock, in milliseconds. A show that has started is locked. */
  now: number
  /** Called with `true` when the editor confirmed a change that touches registered people. */
  onSave: (confirmed: boolean) => void
  onDiscard: () => void
  saving?: boolean
  className?: string
}

/**
 * The review before a save: every changed show with what the change does to the people who registered. A show on air is locked,
 * a show with registrations needs a tick in the confirm box, anything else is safe. Errors in the program stop the save too.
 * Nothing is shown while the two programs are the same.
 */
export function ProgramImpact({ prev, next, registrations, now, onSave, onDiscard, saving, className }: ProgramImpactProps) {
  const [confirmed, setConfirmed] = useState(false)
  const items = impactOf(prev, next, registrations, now)
  if (items.length === 0) return null
  const worst = worstSeverity(items)
  const errors = programChecks(next).filter((c) => c.level === 'error')
  const affected = items.reduce((n, i) => n + i.registered, 0)
  const canSave = worst !== 'blocked' && errors.length === 0 && (worst !== 'confirm' || confirmed)
  return (
    <section className={cn('pg-impact', `is-${worst}`, className)} aria-label="Review the changes">
      <header>
        <strong>
          Review {items.length} change{items.length === 1 ? '' : 's'}
        </strong>
        <span>
          Revision {prev.revision} → {prev.revision + 1}
        </span>
      </header>
      <ul>
        {items.map((i) => {
          const Icon = ICON[i.severity]
          return (
            <li key={i.change.slotId} className={`is-${i.severity}`}>
              <Icon aria-hidden="true" />
              <span>
                <b>{NAME[i.severity]}.</b> {i.message}
              </span>
            </li>
          )
        })}
      </ul>
      {errors.length > 0 && <p className="pg-impact-errors">Fix first: {errors[0].text}</p>}
      {worst === 'confirm' && (
        <Checkbox checked={confirmed} onChange={setConfirmed} label={`I understand that ${affected.toLocaleString('en')} registered ${affected === 1 ? 'person is' : 'people are'} affected.`} />
      )}
      <footer>
        <Button variant="plain" size="sm" onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" disabled={!canSave} loading={saving} onClick={() => onSave(worst === 'confirm' && confirmed)}>
          Save revision {prev.revision + 1}
        </Button>
      </footer>
    </section>
  )
}
