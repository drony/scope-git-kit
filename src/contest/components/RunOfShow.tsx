import { cn } from '@/kit/lib/cn'
import type { Episode, Question } from '../data/types'
import { runOfShow } from '../lib/episode'

const clock = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const span = (s: number) => (s >= 120 ? `${Math.floor(s / 60)} min ${s % 60 ? `${s % 60} s` : ''}`.trim() : `${s} s`)

interface RunOfShowProps {
  episode: Episode
  questions: Question[]
  /** Highlights the item on air at this moment (server milliseconds). */
  now?: number
  className?: string
}

/**
 * The rundown sheet of a show: every item with the clock time it starts, how long it runs, and a bar for its length. The lobby
 * opens before the start; the last row says when the show ends. Times come from the start time and the slots, so changing the
 * line-up changes the sheet.
 */
export function RunOfShow({ episode, questions, now, className }: RunOfShowProps) {
  const items = runOfShow(episode, questions)
  const longest = Math.max(...items.map((i) => i.seconds))
  const last = items[items.length - 1]
  const end = new Date(new Date(last.at).getTime() + last.seconds * 1000).toISOString()
  return (
    <ol className={cn('ros', className)} aria-label="Run of show">
      {items.map((item) => {
        const on = now !== undefined && now >= new Date(item.at).getTime() && now < new Date(item.at).getTime() + item.seconds * 1000
        return (
          <li key={item.id} className={cn('ros-item', `is-${item.kind}`, on && 'is-on')} aria-current={on ? 'step' : undefined}>
            <time dateTime={item.at}>{clock(item.at)}</time>
            <span className="ros-label">{item.label}</span>
            <span className="ros-bar" aria-hidden="true">
              <i style={{ width: `${Math.max(4, (item.seconds / longest) * 100)}%` }} />
            </span>
            <span className="ros-len">{span(item.seconds)}</span>
          </li>
        )
      })}
      <li className="ros-item is-end">
        <time dateTime={end}>{clock(end)}</time>
        <span className="ros-label">Off air</span>
      </li>
    </ol>
  )
}
