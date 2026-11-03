import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Id, Report, ReportAction } from '../data/types'
import { relativeTime } from '../lib/dates'
import { ACTIONS, REASONS } from '../lib/moderation'

const TONE: Record<ReportAction, Tone> = { dismiss: 'neutral', warn: 'warning', suspend: 'accent', disqualify: 'error', withdraw: 'accent' }

interface ReportLogProps {
  /** Handled reports: the ones with a resolution. Reports without one are ignored. */
  reports: Report[]
  /** The name of the player, or the text of the question. */
  targetName: (report: Report) => string
  reporterName: (id: Id) => string
  /** The clock, in milliseconds. */
  now: number
  className?: string
}

/** What was decided, newest first. Reports closed by one decision are one row, with who reported and the reason that was given. */
export function ReportLog({ reports, targetName, reporterName, now, className }: ReportLogProps) {
  const rows = new Map<string, Report[]>()
  for (const r of reports.filter((x) => x.resolution)) rows.set(`${r.kind}:${r.targetId}|${r.resolution!.at}`, [...(rows.get(`${r.kind}:${r.targetId}|${r.resolution!.at}`) ?? []), r])
  const list = [...rows.values()].sort((a, b) => b[0].resolution!.at.localeCompare(a[0].resolution!.at))
  if (list.length === 0) return <p className={cn('mq-empty', className)}>Nothing was decided yet.</p>
  return (
    <ul className={cn('mq-log', className)} aria-label="Decisions">
      {list.map((group) => {
        const first = group[0]
        const res = first.resolution!
        return (
          <li key={`${first.id}`}>
            <Tag tone={TONE[res.action]}>{ACTIONS[res.action].past}</Tag>
            <span>
              <strong>{targetName(first)}</strong>
              <small>
                {[...new Set(group.map((r) => REASONS[r.reason].label))].join(', ')} · reported by {[...new Set(group.map((r) => reporterName(r.reporterId)))].join(', ')}
              </small>
              <q>{res.note}</q>
            </span>
            <span className="mq-by">
              {res.by}
              <small>{relativeTime(res.at, new Date(now))}</small>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
