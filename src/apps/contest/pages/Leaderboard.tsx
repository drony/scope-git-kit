import { useMemo } from 'react'
import { ME } from '@/apps/contest/data'
import { PageBar } from '@/kit/components/nav/PageBar'
import { Card } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { Leaderboard } from '@/contest/components/Leaderboard'
import { Podium } from '@/contest/components/Podium'
import { useParticipants, useSubmissions } from '@/contest/hooks/useContestData'
import { useRankReplay } from '@/contest/hooks/useRankReplay'
import { rankParticipants, rankTeams } from '@/contest/lib/ranking'

export default function LeaderboardPage() {
  usePageTitle('Leaderboard')
  const people = useParticipants()
  const subs = useSubmissions()
  const ranked = useMemo(() => rankParticipants(people.data ?? [], subs.data ?? []), [people.data, subs.data])
  const { rows, changes } = useRankReplay(ranked, 'public')
  const teams = useMemo(() => rankTeams(ranked), [ranked])
  const mine = ranked.find((r) => r.id === ME)

  return (
    <>
      <PageBar eyebrow="Standings" title="Leaderboard">
        <p className="lead">{mine ? `You are number ${mine.rank} with ${mine.points} points.` : 'Submit your answers to appear on the board.'}</p>
      </PageBar>
      <div className="container cs-board-page">
        {!people.data || !subs.data ? (
          <Skeleton height="16rem" radius="0.75rem" />
        ) : (
          <>
            <Card>
              <Podium rows={ranked} />
            </Card>
            <Card>
              <Leaderboard rows={rows} teams={teams} highlightId={ME} changes={changes} />
            </Card>
          </>
        )}
      </div>
    </>
  )
}
