import { useEffect, useRef } from 'react'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Claim } from '../data/types'
import { REASONS, ageDays, SLA_DAYS, type CasePriority, type Priority, type ReportCase } from '../lib/moderation'

const TONE: Record<Priority, Tone> = { urgent: 'error', high: 'warning', medium: 'accent', low: 'neutral' }

/** One case for the queue: the case itself, how urgent it is and why, and the words to show for its target. */
export interface CaseItem {
  case: ReportCase
  priority: CasePriority
  /** The name of the player or the text of the question. */
  title: string
  /** A second line, for example the team or the type of question. */
  detail?: string
}

interface CaseQueueProps {
  /** The cases to show, in the order to work them: the caller sorts (see `byPriority`). */
  items: CaseItem[]
  claims: Record<string, Claim>
  selectedKey?: string | null
  onSelect: (key: string) => void
  /** The clock, in milliseconds. */
  now: number
  /** Who is using the queue: their own claims say "You". */
  actor: string
  /** Shown when the list is empty. */
  empty?: string
  className?: string
}

/**
 * The open cases, most urgent first. A row has the priority (in words), the person or question, the reasons given, how many
 * people reported, how long it has waited, whether it is overdue, and who is working on it. J and K move through the list.
 */
export function CaseQueue({ items, claims, selectedKey, onSelect, now, actor, empty = 'No open cases.', className }: CaseQueueProps) {
  const latest = useRef({ items, selectedKey, onSelect })
  latest.current = { items, selectedKey, onSelect }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable], [role=dialog]') || e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k !== 'j' && k !== 'k') return
      const { items: list, selectedKey: key, onSelect: select } = latest.current
      const i = list.findIndex((x) => x.case.key === key)
      const next = list[k === 'j' ? Math.min(list.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1)]
      if (next) {
        e.preventDefault()
        select(next.case.key)
        document.getElementById(`mq-row-${next.case.key}`)?.scrollIntoView({ block: 'nearest' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (items.length === 0) return <p className={cn('mq-empty', className)}>{empty}</p>
  return (
    <ul className={cn('mq-queue', className)} aria-label="Open cases">
      {items.map(({ case: c, priority, title, detail }) => {
        const claim = claims[c.key]
        const people = new Set(c.reports.map((r) => r.reporterId)).size
        const on = selectedKey === c.key
        return (
          <li key={c.key}>
            <button id={`mq-row-${c.key}`} type="button" className={cn('mq-row', on && 'is-open', `is-${priority.level}`)} aria-current={on ? 'true' : undefined} onClick={() => onSelect(c.key)}>
              <span className="mq-row-top">
                <Tag tone={TONE[priority.level]}>{priority.level}</Tag>
                {priority.overdue && <Tag tone="error">overdue</Tag>}
                <span className="mq-age">{ageDays(c.since, now) === 0 ? 'today' : `${ageDays(c.since, now)} d`}</span>
              </span>
              <strong>{title}</strong>
              {detail && <span className="mq-detail">{detail}</span>}
              <span className="mq-row-meta">
                <span>{c.reasons.map((r) => REASONS[r].label).join(', ')}</span>
                <span>
                  {c.reports.length} report{c.reports.length === 1 ? '' : 's'}
                  {people > 1 ? ` from ${people} people` : ''}
                </span>
                {claim && <span className="mq-claim">{claim.by === actor ? 'You are on it' : `${claim.by} is on it`}</span>}
                {priority.overdue && <span className="mq-sla">Should be done in {SLA_DAYS[priority.level]} d</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
