import { Trophy, Users } from 'lucide-react'
import { Countdown } from '@/kit/components/ui/Countdown'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Episode, Question } from '../data/types'
import { episodeSeconds, questionSlots } from '../lib/episode'

const TONE: Record<Episode['status'], Tone> = { draft: 'neutral', scheduled: 'accent', live: 'error', finished: 'success' }

interface EpisodeCardProps {
  episode: Episode
  questions: Question[]
  /** Makes the card a button. */
  onOpen?: (episode: Episode) => void
  selected?: boolean
  now?: () => number
  className?: string
}

/**
 * One show of the weekly calendar: its number and day, a strip of difficulty bars (the shape of the show at a glance), and
 * either the time to go until it starts or how it went (players, the winning score). A show that is on air says so.
 */
export function EpisodeCard({ episode, questions, onOpen, selected, now, className }: EpisodeCardProps) {
  const slots = questionSlots(episode)
  const day = new Date(episode.startsAt).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = new Date(episode.startsAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
  const top = episode.result ? Math.max(0, ...Object.values(episode.result.scores)) : 0
  const body = (
    <>
      <header>
        <span className="ep-no">#{episode.number}</span>
        <Tag tone={TONE[episode.status]}>{episode.status === 'live' ? 'on air' : episode.status}</Tag>
      </header>
      <strong className="ep-title">{episode.title}</strong>
      <span className="ep-when">
        {day} · {time} · {Math.round(episodeSeconds(episode, questions) / 60)} min
      </span>
      <span className="ep-shape" aria-label={`${slots.length} questions`}>
        {slots.map((s) => {
          const q = questions.find((x) => x.id === s.questionId)
          return <i key={s.id} style={{ height: `${10 + (q?.difficulty ?? 1) * 6}px`, background: q?.difficulty ? `var(--level-${q.difficulty})` : 'var(--line-strong)' }} />
        })}
      </span>
      {episode.status === 'scheduled' && <Countdown to={episode.startsAt} variant="inline" doneLabel="Starting now" now={now} />}
      {episode.result && (
        <span className="ep-stats">
          <span>
            <Users aria-hidden="true" /> {episode.result.participants} players
          </span>
          <span>
            <Trophy aria-hidden="true" /> top score {top}
          </span>
        </span>
      )}
    </>
  )
  return onOpen ? (
    <button type="button" className={cn('ep', selected && 'is-selected', `is-${episode.status}`, className)} aria-pressed={selected} onClick={() => onOpen(episode)}>
      {body}
    </button>
  ) : (
    <div className={cn('ep', selected && 'is-selected', `is-${episode.status}`, className)}>{body}</div>
  )
}
