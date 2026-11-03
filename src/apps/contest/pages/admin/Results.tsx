import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart } from '@/kit/components/charts/BarChart'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { Leaderboard } from '@/contest/components/Leaderboard'
import { Podium } from '@/contest/components/Podium'
import { ScoreHeatGrid } from '@/contest/components/ScoreHeatGrid'
import { useParticipants, useQuestions, useSubmissions } from '@/contest/hooks/useContestData'
import { useRankReplay } from '@/contest/hooks/useRankReplay'
import { rankParticipants, rankTeams } from '@/contest/lib/ranking'

export default function Results() {
  usePageTitle('Results')
  const navigate = useNavigate()
  const people = useParticipants()
  const subs = useSubmissions()
  const questions = useQuestions()

  const ranked = useMemo(() => rankParticipants(people.data ?? [], subs.data ?? []), [people.data, subs.data])
  const { rows, changes } = useRankReplay(ranked, 'admin')
  const teams = useMemo(() => rankTeams(ranked), [ranked])

  const submissions = (subs.data ?? []).filter((s) => s.status !== 'in-progress')
  const asked = (questions.data ?? []).filter((q) => submissions.some((s) => s.scores[q.id]))
  const heat = ranked.map((r) => ({ id: r.id, name: r.name, scores: submissions.find((s) => s.participantId === r.id)?.scores ?? {} }))
  const buckets = ['0–19%', '20–39%', '40–59%', '60–79%', '80–100%'].map((label, i) => ({
    label,
    values: { people: ranked.filter((r) => r.max > 0 && Math.min(4, Math.floor((r.points / r.max) * 5)) === i).length },
  }))

  if (!people.data || !subs.data || !questions.data) return <Skeleton height="20rem" radius="0.75rem" />

  return (
    <div className="cs-results">
      <Card>
        <CardHead title="Podium" />
        <Podium rows={ranked} />
      </Card>
      <Card>
        <CardHead title="Leaderboard" />
        <Leaderboard rows={rows} teams={teams} changes={changes} onOpen={(r) => navigate(`/admin/submissions?sub=${subs.data!.find((s) => s.participantId === r.id)?.id ?? ''}`)} />
      </Card>
      <Card className="cs-results-wide">
        <CardHead title="Where did people struggle?" />
        <ScoreHeatGrid questions={asked} rows={heat} onOpen={(pid, qid) => navigate(`/admin/submissions?sub=${subs.data!.find((s) => s.participantId === pid)?.id ?? ''}&q=${qid}`)} />
      </Card>
      <Card>
        <CardHead title="Score spread" />
        <BarChart ariaLabel="Number of people per score band" data={buckets} series={[{ key: 'people', label: 'People' }]} height={220} />
      </Card>
    </div>
  )
}
