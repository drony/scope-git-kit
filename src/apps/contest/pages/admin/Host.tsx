import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { Switch } from '@/kit/components/forms/Controls'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { EpisodeRecap } from '@/contest/components/EpisodeRecap'
import { HostConsole } from '@/contest/components/HostConsole'
import { LiveLobby } from '@/contest/components/LiveLobby'
import { LiveScoreboard } from '@/contest/components/LiveScoreboard'
import { LiveStage } from '@/contest/components/LiveStage'
import { LivePoll } from '@/apps/contest/components/LivePoll'
import { useParticipants } from '@/contest/hooks/useContestData'
import { useLiveShow } from '@/contest/hooks/useLiveShow'
import { useLiveSimulation } from '@/contest/hooks/useLiveSimulation'
import { liveRanking, type LiveContext } from '@/contest/lib/live'
import { botsAsEpisodeNames, makeBots } from '@/contest/lib/simulate'
import { ME } from '@/apps/contest/data'

const BOT_NAMES = botsAsEpisodeNames(makeBots(40))

export default function Host() {
  usePageTitle('Host')
  const show = useLiveShow(400)
  const people = useParticipants()
  const [simulate, setSimulate] = useState(true)
  useLiveSimulation(show.live, show.ctx, simulate)
  const nameOf = (id: string) => people.data?.find((p) => p.id === id)?.name ?? BOT_NAMES[id] ?? id
  const { live, ctx, now } = show

  // The player preview is Kai: he joins by himself as soon as the lobby opens.
  const meIn = live?.joined.includes(ME)
  useEffect(() => {
    if (live && live.phase === 'lobby' && !meIn) void show.send({ type: 'join', participantId: ME })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.phase, meIn])

  if (live === undefined) return <Skeleton height="16rem" radius="0.75rem" />
  if (live === null || !ctx) {
    return (
      <Card>
        <EmptyState icon={<Radio size={20} aria-hidden="true" />} title="No show is on air" action={<Link className="btn" to="/admin/weekly">Plan or open a show</Link>}>
          Open the lobby of a scheduled show from Weekly live. Then run it from here.
        </EmptyState>
      </Card>
    )
  }

  const rows = liveRanking(live, nameOf)
  return (
    <div className="host-page">
      <div className="host-left">
        <HostConsole state={live} ctx={ctx} now={now} onCommand={(c) => void show.send(c)} />
        <Card>
          <CardHead title="Scoreboard" actions={<Switch checked={simulate} onChange={setSimulate} label="Simulated players" />} />
          <div className="host-board">
            <LiveScoreboard rows={rows} limit={8} />
          </div>
        </Card>
        {live.phase === 'finished' && ctx.episode.result && (
          <Card>
            <CardHead title="How it went" />
            <EpisodeRecap episode={ctx.episode} questions={ctx.questions} nameOf={nameOf} />
          </Card>
        )}
      </div>
      <div className="host-right">
        <span className="host-peek">Player view: Kai Moreau</span>
        {live.phase === 'lobby' ? (
          <LiveLobby episode={ctx.episode} questions={ctx.questions} players={live.joined.map(nameOf)} joined={Boolean(meIn)} />
        ) : (
          <LiveStage state={live} ctx={ctx as LiveContext} participantId={ME} now={now} nameOf={nameOf} onAnswer={(value) => void show.send({ type: 'answer', participantId: ME, value })} poll={<LivePoll live={live} ctx={ctx} />} />
        )}
      </div>
    </div>
  )
}
