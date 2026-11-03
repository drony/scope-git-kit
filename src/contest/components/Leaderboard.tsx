import { useState } from 'react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Avatar } from '@/kit/components/ui/Avatar'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { Tag } from '@/kit/components/ui/Badge'
import { useFlip } from '@/kit/hooks/useFlip'
import { cn } from '@/kit/lib/cn'
import type { Id } from '../data/types'
import type { RankedRow, TeamRow } from '../lib/ranking'

interface LeaderboardProps {
  rows: RankedRow[]
  /** Adds an "Individuals / Teams" switch. */
  teams?: TeamRow[]
  /** The row of the person looking at the board: highlighted and tagged "You". */
  highlightId?: Id
  /** How many places each person moved since the last ranking (positive is up), by id. See `rankChanges`. */
  changes?: Record<Id, number>
  /** Shows only the best N rows. */
  limit?: number
  /** Called when a person's row is clicked. */
  onOpen?: (row: RankedRow) => void
  className?: string
}

const medal = (rank: number) => (rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : undefined)

function Move({ by }: { by: number | undefined }) {
  if (by === undefined) return <span className="cs-move" />
  if (by === 0) return <span className="cs-move is-same" aria-label="Same place"><Minus aria-hidden="true" /></span>
  return (
    <span className={cn('cs-move', by > 0 ? 'is-up' : 'is-down')} aria-label={`${by > 0 ? 'Up' : 'Down'} ${Math.abs(by)} ${Math.abs(by) === 1 ? 'place' : 'places'}`}>
      {by > 0 ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
      {Math.abs(by)}
    </span>
  )
}

/**
 * The ranking as a list: place (with medal colours for the first three), name, a bar for the points, and an arrow for
 * the places gained or lost. When the order changes, the rows slide to their new places. With `teams` it can also rank
 * teams by the average of their members.
 */
export function Leaderboard({ rows, teams, highlightId, changes, limit, onOpen, className }: LeaderboardProps) {
  const [view, setView] = useState<'people' | 'teams'>('people')
  const shown = view === 'people' ? (limit ? rows.slice(0, limit) : rows) : []
  const shownTeams = view === 'teams' && teams ? (limit ? teams.slice(0, limit) : teams) : []
  const list = useFlip<HTMLOListElement>(view === 'people' ? shown.map((r) => r.id) : shownTeams.map((t) => t.team))
  const top = Math.max(1, ...(view === 'people' ? shown.map((r) => r.max) : shownTeams.map((t) => t.max)))

  return (
    <div className={cn('cs-board', className)}>
      {teams && (
        <Segmented<'people' | 'teams'>
          ariaLabel="Rank"
          value={view}
          onChange={setView}
          options={[
            { value: 'people', label: 'People' },
            { value: 'teams', label: 'Teams' },
          ]}
        />
      )}
      {(view === 'people' ? shown.length : shownTeams.length) === 0 ? (
        <EmptyState title="Nobody is on the board yet">Scores appear here once people submit their answers.</EmptyState>
      ) : (
        <ol ref={list} className="cs-board-list" aria-label={view === 'people' ? 'Leaderboard' : 'Team leaderboard'}>
          {view === 'people'
            ? shown.map((r) => {
                const body = (
                  <>
                    <span className={cn('cs-rank', medal(r.rank) && `is-${medal(r.rank)}`)}>{r.rank}</span>
                    <Avatar name={r.name} size={32} />
                    <span className="cs-board-name">
                      <strong>
                        {r.name} {r.id === highlightId && <Tag tone="accent">You</Tag>}
                      </strong>
                      {r.team && <small>{r.team}</small>}
                    </span>
                    <span className="cs-board-bar" aria-hidden="true">
                      <i style={{ width: `${(r.points / top) * 100}%` }} />
                    </span>
                    <span className="cs-board-points">
                      {r.points}
                      {r.pending > 0 && <small title={`${r.pending} answer${r.pending === 1 ? '' : 's'} still to be scored`}> +?</small>}
                    </span>
                    <Move by={changes?.[r.id]} />
                  </>
                )
                return (
                  <li key={r.id} data-flip={r.id} className={cn('cs-board-row', r.id === highlightId && 'is-you')}>
                    {onOpen ? (
                      <button type="button" onClick={() => onOpen(r)}>
                        {body}
                      </button>
                    ) : (
                      <div>{body}</div>
                    )}
                  </li>
                )
              })
            : shownTeams.map((t) => (
                <li key={t.team} data-flip={t.team} className="cs-board-row">
                  <div>
                    <span className={cn('cs-rank', medal(t.rank) && `is-${medal(t.rank)}`)}>{t.rank}</span>
                    <Avatar name={t.team} size={32} square />
                    <span className="cs-board-name">
                      <strong>{t.team}</strong>
                      <small>
                        {t.members} {t.members === 1 ? 'person' : 'people'}, average
                      </small>
                    </span>
                    <span className="cs-board-bar" aria-hidden="true">
                      <i style={{ width: `${(t.points / top) * 100}%` }} />
                    </span>
                    <span className="cs-board-points">{t.points}</span>
                    <span className="cs-move" />
                  </div>
                </li>
              ))}
        </ol>
      )}
    </div>
  )
}
