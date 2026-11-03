import { Clock3, Users, Zap } from 'lucide-react'
import { Countdown } from '@/kit/components/ui/Countdown'
import { Avatar } from '@/kit/components/ui/Avatar'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { Episode, Question } from '../data/types'
import { episodeSeconds, questionSlots } from '../lib/episode'

interface LiveLobbyProps {
  episode: Episode
  questions: Question[]
  /** Names of the people who joined, newest last. */
  players: string[]
  /** Whether this person has joined. */
  joined?: boolean
  /** Shows a "Join" button when the person has not joined. */
  onJoin?: () => void
  now?: () => number
  className?: string
}

/** The waiting room before a show: the show's name, the time to go, who is here, and what to expect. It is the stage's dark studio, in both themes. */
export function LiveLobby({ episode, questions, players, joined, onJoin, now, className }: LiveLobbyProps) {
  const minutes = Math.round(episodeSeconds(episode, questions) / 60)
  return (
    <section className={cn('stage lobby', className)} aria-label="Lobby">
      <span className="stage-tag">Weekly Live #{episode.number}</span>
      <h2>{episode.title}</h2>
      <div className="lobby-count">
        <span>Starts in</span>
        <Countdown to={episode.startsAt} variant="inline" doneLabel="Starting any moment" now={now} />
      </div>
      <ul className="lobby-facts">
        <li>
          <Zap aria-hidden="true" /> {questionSlots(episode).length} questions, quick answers earn up to 50% more
        </li>
        <li>
          <Clock3 aria-hidden="true" /> About {minutes} minutes. Join before it starts: late arrivals wait for the next question
        </li>
      </ul>
      <div className="lobby-who">
        <span>
          <Users aria-hidden="true" /> {players.length} in the lobby
        </span>
        <span className="lobby-faces">
          {players.slice(-12).map((n) => (
            <Avatar key={n} name={n} size={28} />
          ))}
        </span>
      </div>
      {onJoin && !joined && <Button onClick={onJoin}>Join the show</Button>}
      {joined && <p className="lobby-in">You are in. Keep this screen open.</p>}
    </section>
  )
}
