import { Trophy } from 'lucide-react'
import { Countdown } from '@/kit/components/ui/Countdown'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { WeeklyProgram } from '../data/types'
import { occurrences, showState, type Occurrence } from '../lib/program'
import { QuotaMeter } from './QuotaMeter'

interface UpcomingShowsProps {
  program: WeeklyProgram
  registrations: Record<string, number>
  /** The clock, in milliseconds. */
  now: number
  /** How many shows to list. */
  limit?: number
  /** Says what is ready for a show, for example `{ label: 'Line-up ready', tone: 'success' }`. */
  lineup?: (occurrence: Occurrence) => { label: string; tone?: Tone } | undefined
  /** Makes each row a button. */
  onOpen?: (occurrence: Occurrence) => void
  className?: string
}

const dateFormat = (tz: string) => new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz })

/**
 * The next shows in time order. The first one has a live countdown; each row has the day, the start time, the topic, how full it
 * is and, when `lineup` says so, whether its questions are ready.
 */
export function UpcomingShows({ program, registrations, now, limit = 5, lineup, onOpen, className }: UpcomingShowsProps) {
  const list = occurrences(program, now, 21).filter((o) => showState(o, now) !== 'done').slice(0, limit)
  const fmt = dateFormat(program.timezone)
  if (list.length === 0) return <p className={cn('pg-flow-empty', className)}>No show is planned. Add one to the program.</p>
  return (
    <ol className={cn('pg-up', className)}>
      {list.map((o, i) => {
        const state = showState(o, now)
        const ready = lineup?.(o)
        const body = (
          <>
            <span className="pg-up-when">
              <b>{fmt.format(o.at)}</b>
              <span>{o.slot.time}</span>
              {i === 0 && state !== 'live' && <Countdown className="pg-up-count" to={o.at} variant="inline" doneLabel="Starting now" />}
            </span>
            <span className="pg-up-what">
              <strong>{o.slot.topic || 'No topic'}</strong>
              <span>
                {o.slot.kind === 'final' ? (
                  <>
                    <Trophy aria-hidden="true" /> Final
                  </>
                ) : (
                  'Daily show'
                )}
                {state === 'live' && <Tag tone="error">On air</Tag>}
                {ready && <Tag tone={ready.tone ?? 'neutral'}>{ready.label}</Tag>}
              </span>
            </span>
            <span className="pg-up-meter">
              <QuotaMeter value={registrations[o.key] ?? 0} quota={o.slot.quota} size="sm" />
            </span>
          </>
        )
        return (
          <li key={o.key}>
            {onOpen ? (
              <button type="button" className={cn('pg-up-row', i === 0 && 'is-first')} onClick={() => onOpen(o)}>
                {body}
              </button>
            ) : (
              <div className={cn('pg-up-row', i === 0 && 'is-first')}>{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
