import { Clock3, Target, Users } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import type { Episode, Id, Question } from '../data/types'
import type { RankedRow } from '../lib/ranking'
import { Podium } from './Podium'

interface EpisodeRecapProps {
  episode: Episode
  questions: Question[]
  /** A readable name for someone on the scoreboard (a player, a bot). */
  nameOf: (id: Id) => string
  className?: string
}

/** How a finished show went: the podium, how many played, the easiest and the hardest question, and the average time to answer. */
export function EpisodeRecap({ episode, questions, nameOf, className }: EpisodeRecapProps) {
  const r = episode.result
  if (!r) return <p className="recap-empty">This show has no result yet.</p>
  const sorted = Object.entries(r.scores).sort((a, b) => b[1] - a[1])
  const rows: RankedRow[] = sorted.map(([id, points], i) => ({ id, name: nameOf(id), points, max: 0, pending: 0, rank: i > 0 && sorted[i - 1][1] === points ? 0 : i + 1 })).reduce<RankedRow[]>((out, row, i) => (out.push({ ...row, rank: row.rank || out[i - 1].rank }), out), [])
  const rated = r.questions.filter((x) => x.answered > 0).map((x) => ({ ...x, p: x.correct / x.answered, q: questions.find((q) => q.id === x.questionId) }))
  const easiest = [...rated].sort((a, b) => b.p - a.p)[0]
  const hardest = [...rated].sort((a, b) => a.p - b.p)[0]
  const avg = rated.length ? rated.reduce((n, x) => n + x.avgSec, 0) / rated.length : 0
  return (
    <div className={cn('recap', className)}>
      <Podium rows={rows} />
      <ul className="recap-facts">
        <li>
          <Users aria-hidden="true" /> <strong>{r.participants}</strong> players
        </li>
        <li>
          <Clock3 aria-hidden="true" /> <strong>{avg.toFixed(1)} s</strong> to answer on average
        </li>
        {easiest?.q && (
          <li>
            <Target aria-hidden="true" /> Easiest: “{easiest.q.prompt}” ({Math.round(easiest.p * 100)}% right)
          </li>
        )}
        {hardest?.q && hardest !== easiest && (
          <li>
            <Target aria-hidden="true" /> Hardest: “{hardest.q.prompt}” ({Math.round(hardest.p * 100)}% right)
          </li>
        )}
      </ul>
    </div>
  )
}
