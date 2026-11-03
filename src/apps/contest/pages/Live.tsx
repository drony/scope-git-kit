import { useMemo, useState } from 'react'
import { ME } from '@/apps/contest/data'
import { PageBar } from '@/kit/components/nav/PageBar'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { EpisodeCard } from '@/contest/components/EpisodeCard'
import { ProgramBoard } from '@/contest/components/ProgramBoard'
import { UpdateScreen } from '@/contest/components/UpdateScreen'
import { EpisodeRecap } from '@/contest/components/EpisodeRecap'
import { LiveLobby } from '@/contest/components/LiveLobby'
import { LiveStage } from '@/contest/components/LiveStage'
import { LivePoll } from '@/apps/contest/components/LivePoll'
import { Link } from 'react-router-dom'
import { useNow } from '@/kit/hooks/useNow'
import { useEpisodes, useGate, useParticipants, useProgram, useQuestions, useRegistrations } from '@/contest/hooks/useContestData'
import { canPlay, gateInForce, verdictFor } from '@/contest/lib/gate'
import { useLiveShow } from '@/contest/hooks/useLiveShow'
import { botsAsEpisodeNames, makeBots } from '@/contest/lib/simulate'

const BOT_NAMES = botsAsEpisodeNames(makeBots(40))

export default function Live() {
  usePageTitle('Live')
  const show = useLiveShow(500)
  const episodes = useEpisodes(5000)
  const questions = useQuestions()
  const people = useParticipants()
  const program = useProgram()
  const toast = useToast()
  const gate = useGate(4000)
  const [later, setLater] = useState(false)
  const registrations = useRegistrations(5000)
  const clock = useNow(30_000)
  const nameOf = (id: string) => people.data?.find((p) => p.id === id)?.name ?? BOT_NAMES[id] ?? id
  const upcoming = useMemo(() => (episodes.data ?? []).filter((e) => e.status === 'scheduled').sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0], [episodes.data])
  const past = useMemo(() => (episodes.data ?? []).filter((e) => e.status === 'finished').sort((a, b) => b.number - a.number), [episodes.data])
  const { live, ctx, now } = show
  // the version gate: the demo player's build decides whether the show can be joined
  const client = people.data?.find((p) => p.id === ME)?.client
  const rule = gate.data && client ? gateInForce(gate.data.current, gate.data.next, now) : undefined
  const verdict = rule && client ? verdictFor(rule, client.store, client.build) : 'ok'
  const store = rule?.stores.find((g) => g.store === client?.store)
  const screen = rule && client && store ? <UpdateScreen verdict={verdict} message={rule.message} updateUrl={store.updateUrl} build={client.build} minBuild={store.minBuild} onClose={() => setLater(true)} /> : null

  return (
    <>
      <PageBar eyebrow="Every week" title="Weekly Live">
        <p className="lead">A live quiz with everyone at the same time. Answer fast: a quick right answer earns up to 50% more.</p>
      </PageBar>
      <div className="container cs-live">
        {live === undefined || !questions.data || !episodes.data ? (
          <Skeleton height="16rem" radius="0.75rem" />
        ) : live && ctx ? (
          live.phase === 'lobby' ? (
            <>
              {(!canPlay(verdict) || (verdict === 'recommended' && !later)) && screen}
              {canPlay(verdict) && <LiveLobby episode={ctx.episode} questions={ctx.questions} players={live.joined.map(nameOf)} joined={live.joined.includes(ME)} onJoin={() => void show.send({ type: 'join', participantId: ME }).catch((e) => toast.push({ tone: 'error', title: 'You cannot join', description: e instanceof Error ? e.message : undefined }))} />}
            </>
          ) : (
            <>
              <LiveStage state={live} ctx={ctx} participantId={ME} now={now} nameOf={nameOf} onAnswer={(value) => void show.send({ type: 'answer', participantId: ME, value })} poll={<LivePoll live={live} ctx={ctx} />} />
              {live.phase === 'finished' && ctx.episode.surveyId && (
                <Link className="btn btn-plain" to={`/survey/${ctx.episode.surveyId}`}>
                  Two-minute survey about tonight
                </Link>
              )}
              {live.phase === 'finished' && ctx.episode.result && (
                <Card>
                  <CardHead title="How the show went" />
                  <EpisodeRecap episode={ctx.episode} questions={ctx.questions} nameOf={nameOf} />
                </Card>
              )}
            </>
          )
        ) : (
          <div className="cs-live-idle">
            <section>
              <h2>Next show</h2>
              {upcoming ? <EpisodeCard episode={upcoming} questions={questions.data} /> : <p className="lead">No show is planned yet.</p>}
            </section>
            {program.data && (
              <section>
                <h2>This week</h2>
                <ProgramBoard program={program.data} registrations={registrations.data ?? {}} now={clock} />
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2>Past shows</h2>
                <div className="cs-live-past">
                  {past.map((e) => (
                    <Card key={e.id}>
                      <CardHead title={e.title} />
                      <EpisodeRecap episode={e} questions={questions.data!} nameOf={nameOf} />
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}
