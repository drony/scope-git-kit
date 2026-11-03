import { useMemo, useState, type ReactNode } from 'react'
import { CONTEST_DOCS, CONTEST_GROUPS } from '@/contest/catalog'
import { AnswerKeyEditor } from '@/contest/components/AnswerKeyEditor'
import { ChannelPreview } from '@/contest/components/ChannelPreview'
import { AnswerDistribution } from '@/contest/components/AnswerDistribution'
import { AuditActivity } from '@/contest/components/AuditActivity'
import { AuditDiff } from '@/contest/components/AuditDiff'
import { BuildLadder } from '@/contest/components/BuildLadder'
import { DeliveryStatus } from '@/contest/components/DeliveryStatus'
import { DifficultyMeter } from '@/contest/components/DifficultyMeter'
import { LiveScoreboard } from '@/contest/components/LiveScoreboard'
import { Leaderboard } from '@/contest/components/Leaderboard'
import { MediaLibrary } from '@/contest/components/MediaLibrary'
import { NotificationItem } from '@/contest/components/NotificationCenter'
import { PollCard } from '@/contest/components/PollCard'
import { ProgramBoard } from '@/contest/components/ProgramBoard'
import { QualificationFlow } from '@/contest/components/QualificationFlow'
import { PackCoverage } from '@/contest/components/PackCoverage'
import { PackHistory } from '@/contest/components/PackHistory'
import { PackStatus } from '@/contest/components/PackStatus'
import { QuotaMeter } from '@/contest/components/QuotaMeter'
import { ReviewHistory } from '@/contest/components/ReviewHistory'
import { RiskSignals } from '@/contest/components/RiskSignals'
import { UpdateScreen } from '@/contest/components/UpdateScreen'
import { ViolationHistory } from '@/contest/components/ViolationHistory'
import { ReviewPanel } from '@/contest/components/ReviewPanel'
import { ReviewRail } from '@/contest/components/ReviewRail'
import { Podium } from '@/contest/components/Podium'
import { PushPrimer } from '@/contest/components/PushPrimer'
import { QuestionView } from '@/contest/components/QuestionView'
import { RubricScorer } from '@/contest/components/RubricScorer'
import { ScoreHeatGrid } from '@/contest/components/ScoreHeatGrid'
import { SourceBadge } from '@/contest/components/SourceBadge'
import { LikertScale, NpsScale } from '@/contest/components/SurveyInputs'
import { TimeDial } from '@/contest/components/TimeDial'
import type { AnswerKey, AnswerValue, Difficulty, Id } from '@/contest/data/types'
import type { LiveRow } from '@/contest/lib/live'
import { rankParticipants, rankTeams } from '@/contest/lib/ranking'
import { ApiReference } from '@/kit/components/docs/ApiReference'
import { PageBar } from '@/kit/components/nav/PageBar'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { CONTEST_SEED } from '@/apps/contest/seed/contest'
import { PROGRAM, registrations } from '@/apps/contest/seed/program'
import { GATE, buildUsage } from '@/apps/contest/seed/gate'
import { VIOLATIONS } from '@/apps/contest/seed/moderation'
import { REVIEW } from '@/apps/contest/seed/review'
import { activityByDay, diffEntry } from '@/contest/lib/audit'
import { activePack, coverage, diffPack } from '@/contest/lib/packs'
import type { ReviewView } from '@/contest/lib/review'
import { SURVEYS } from '@/apps/contest/seed/weekly'

const { questions, answerKeys, media, participants, submissions } = CONTEST_SEED
const PROGRAM_REGISTRATIONS = registrations()
const GATE_USAGE = buildUsage()
const AUDIT_DAYS = activityByDay(CONTEST_SEED.audit, 14, Date.now())
const AUDIT_DIFF = diffEntry(CONTEST_SEED.audit.find((e) => e.entity === 'gate') ?? CONTEST_SEED.audit[0])
const ACTIVE_PACK = activePack(CONTEST_SEED.packs)
const PACK_DIFF = ACTIVE_PACK ? diffPack(ACTIVE_PACK, CONTEST_SEED.questions, CONTEST_SEED.answerKeys, CONTEST_SEED.topics) : undefined
const PACK_ROWS = coverage(CONTEST_SEED.topics, CONTEST_SEED.questions, CONTEST_SEED.answerKeys, ACTIVE_PACK, CONTEST_SEED.program)
const question = (id: string) => questions.find((q) => q.id === id)!
const lookup = (id: string) => media.find((a) => a.id === id)

function Demo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHead title={title} />
      {children}
    </Card>
  )
}

/** One question, answered for real: the same component the quiz uses. */
function QuestionDemo({ id }: { id: string }) {
  const [value, setValue] = useState<AnswerValue | null>(null)
  return <QuestionView question={question(id)} value={value} onChange={setValue} media={lookup} state={value ? 'answered' : 'open'} />
}

function KeyDemo() {
  const [key, setKey] = useState<AnswerKey>(answerKeys.q5)
  return <AnswerKeyEditor question={question('q5')} value={key} onChange={setKey} />
}

function RubricDemo() {
  const key = answerKeys.q9
  const [points, setPoints] = useState<Record<Id, number>>({})
  return key.type === 'manual' ? <RubricScorer rubric={key.rubric} value={points} onChange={setPoints} /> : null
}

function ReviewDemo() {
  const [view, setView] = useState<ReviewView>('mine')
  const counts: Record<ReviewView, number> = { mine: 7, all: 42, draft: 3, pending: 6, preapproved: 3, approved: 28, returned: 2, trashed: 2, stale: 4 }
  return <ReviewRail counts={counts} value={view} onChange={setView} />
}

function DifficultyDemo() {
  const [level, setLevel] = useState<Difficulty>(3)
  const [seconds, setSeconds] = useState(20)
  return (
    <div className="stack">
      <DifficultyMeter value={level} onChange={setLevel} />
      <TimeDial value={seconds} onChange={setSeconds} question={{ type: 'single', difficulty: level }} />
      <p className="sr-only" aria-live="polite">{`Level ${level}, ${seconds} seconds`}</p>
    </div>
  )
}

function SourceDemo() {
  return (
    <div className="row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
      <SourceBadge source={{ kind: 'book', title: 'Campbell Biology', checkedBy: 'Ada', checkedAt: new Date().toISOString() }} />
      <SourceBadge source={{ kind: 'original', title: 'Written by the host' }} />
      <SourceBadge source={{ kind: 'web', title: 'A web page' }} />
      <SourceBadge source={{ kind: 'web', title: 'Wikipedia: Moon', url: 'https://en.wikipedia.org/wiki/Moon' }} />
      <SourceBadge />
    </div>
  )
}

function ScalesDemo() {
  const [nps, setNps] = useState<number | undefined>(9)
  const [likert, setLikert] = useState<number | undefined>(4)
  return (
    <div className="stack">
      <NpsScale value={nps} onChange={setNps} />
      <LikertScale points={5} low="Far too easy" high="Far too hard" value={likert} onChange={setLikert} />
    </div>
  )
}

const poll = SURVEYS.find((x) => x.id === 'sv-poll') ?? SURVEYS[0]
function PollDemo() {
  const [voted, setVoted] = useState<Id>()
  const first = poll.questions[0]
  const options = first.type === 'choice' ? first.options : []
  const counts = Object.fromEntries(options.map((o, i) => [o.id, [41, 23, 14, 9][i % 4] + (o.id === voted ? 1 : 0)]))
  return <PollCard survey={poll} voted={voted} counts={counts} onVote={setVoted} />
}

const OPTIONS = [
  { id: 'a', label: 'Oxygen' },
  { id: 'b', label: 'Carbon dioxide' },
  { id: 'c', label: 'Nitrogen' },
  { id: 'd', label: 'Helium' },
]
const ROWS: LiveRow[] = [
  { id: '1', name: 'Mira', points: 61, rank: 1, gained: 14, streak: 4 },
  { id: '2', name: 'Jon', points: 54, rank: 2, gained: 0, streak: 0 },
  { id: '3', name: 'Sade', points: 47, rank: 3, gained: 12, streak: 2 },
  { id: '4', name: 'Pavel', points: 39, rank: 4, gained: 10, streak: 1 },
  { id: '5', name: 'Lu', points: 33, rank: 5, gained: 0, streak: 0 },
]

function PrimerDemo() {
  const [answer, setAnswer] = useState<'allow' | 'later' | null>(null)
  return answer ? (
    <p className="muted">{answer === 'allow' ? 'Now the browser would ask for permission.' : 'Not now. Ask again at a better moment.'}</p>
  ) : (
    <PushPrimer onAllow={() => setAnswer('allow')} onLater={() => setAnswer('later')} />
  )
}

export default function Components() {
  usePageTitle('Components')
  const ranked = useMemo(() => rankParticipants(participants, submissions), [])
  const [picked, setPicked] = useState<Id[]>([])
  const asked = questions.filter((q) => submissions.some((s) => s.scores[q.id]))
  const heat = ranked.slice(0, 6).map((r) => ({ id: r.id, name: r.name, scores: submissions.find((s) => s.participantId === r.id)?.scores ?? {} }))

  return (
    <>
      <PageBar eyebrow="Contest layer" title="Components">
        <p className="lead">Live examples of the contest components, then the API reference. Everything here takes plain props: the data below is the demo seed.</p>
      </PageBar>
      <div className="container cs-components">
        <section aria-label="Live examples" className="cs-demo-grid">
          <Demo title="Single choice">
            <QuestionDemo id="q1" />
          </Demo>
          <Demo title="Ordering">
            <QuestionDemo id="q7" />
          </Demo>
          <Demo title="Matching">
            <QuestionDemo id="q8" />
          </Demo>
          <Demo title="Answer key editor">
            <KeyDemo />
          </Demo>
          <Demo title="Rubric scorer">
            <RubricDemo />
          </Demo>
          <Demo title="Channel preview">
            <ChannelPreview title="Quiz tips for {{name}}" body="Hi {{name}}, read every question twice. Good luck in the {{contest}}!" channels={['in-app', 'email', 'push']} contest="Aurora Cup" />
          </Demo>
          <Demo title="Notifications and delivery">
            <div className="cs-demo-stack">
              <NotificationItem notification={{ id: 'a', recipientId: 'p11', kind: 'announcement', title: 'Welcome to the Aurora Cup', body: 'Hi Kai, the first round opens tomorrow at 09:00.', createdAt: new Date().toISOString() }} />
              <NotificationItem notification={{ id: 'b', recipientId: 'p11', kind: 'deadline', title: 'Round one closes soon', body: 'Answers lock at 23:59.', createdAt: new Date(Date.now() - 3_600_000).toISOString(), readAt: new Date().toISOString() }} />
              <DeliveryStatus delivery={CONTEST_SEED.announcements[0].delivery} />
            </div>
          </Demo>
          <Demo title="Podium and leaderboard">
            <div className="cs-demo-stack">
              <Podium rows={ranked} />
              <Leaderboard rows={ranked} teams={rankTeams(ranked)} limit={5} />
            </div>
          </Demo>
          <Demo title="Score heat grid">
            <ScoreHeatGrid questions={asked} rows={heat} />
          </Demo>
          <Demo title="Changes per day">
            <AuditActivity days={AUDIT_DAYS} />
          </Demo>
          <Demo title="What changed">
            <AuditDiff changes={AUDIT_DIFF} />
          </Demo>
          <Demo title="Pack in force">
            <PackStatus pack={ACTIVE_PACK} diff={PACK_DIFF} now={Date.now()} />
          </Demo>
          <Demo title="Coverage by topic">
            <PackCoverage rows={PACK_ROWS} />
          </Demo>
          <Demo title="Pack history">
            <PackHistory packs={CONTEST_SEED.packs} now={Date.now()} onRestore={() => undefined} />
          </Demo>
          <Demo title="Players by build">
            <BuildLadder gate={GATE.stores[0]} usage={GATE_USAGE} highlight={381} />
          </Demo>
          <Demo title="Update screens">
            <div className="stack">
              <UpdateScreen verdict="recommended" message={GATE.message} updateUrl={GATE.stores[0].updateUrl} build={381} minBuild={GATE.stores[0].minBuild} onClose={() => undefined} />
              <UpdateScreen verdict="required" message={GATE.message} updateUrl={GATE.stores[0].updateUrl} build={374} minBuild={GATE.stores[0].minBuild} />
            </div>
          </Demo>
          <Demo title="Why this priority">
            <RiskSignals
              priority={{ level: 'high', score: 7, overdue: false, factors: [{ label: 'Cheating is serious', points: 3 }, { label: '2 different people reported it', points: 1 }, { label: 'Evidence: very fast answers', points: 3 }] }}
              signals={[{ id: 'fast', label: 'Very fast answers', detail: '9 of 10 answers took 3 seconds or less. Other players took 28 seconds at the median.', strength: 3 }]}
            />
          </Demo>
          <Demo title="Violation record">
            <ViolationHistory violations={VIOLATIONS.filter((v) => v.participantId === 'p12')} now={Date.now()} />
          </Demo>
          <Demo title="Review views">
            <ReviewDemo />
          </Demo>
          <Demo title="Review history">
            <ReviewHistory events={REVIEW.questions.find((q) => q.id === 'q46')?.review?.history ?? []} />
          </Demo>
          <Demo title="Review panel">
            <ReviewPanel question={REVIEW.questions.find((q) => q.id === 'q34')!} answerKey={REVIEW.keys.q34} actor="Ada" now={Date.now()} onAction={() => undefined} />
          </Demo>
          <Demo title="Quota meter">
            <div className="stack">
              <QuotaMeter value={312} quota={1000} />
              <QuotaMeter value={864} quota={1000} />
              <QuotaMeter value={1000} quota={1000} />
            </div>
          </Demo>
          <Demo title="Seats to the final">
            <QualificationFlow program={PROGRAM} />
          </Demo>
          <Demo title="Difficulty and time">
            <DifficultyDemo />
          </Demo>
          <Demo title="Source badges">
            <SourceDemo />
          </Demo>
          <Demo title="Answer distribution">
            <AnswerDistribution options={OPTIONS} counts={{ a: 3, b: 18, c: 6, d: 1 }} correct={['b']} reveal />
          </Demo>
          <Demo title="Live scoreboard">
            <LiveScoreboard rows={ROWS} highlightId="3" />
          </Demo>
          <Demo title="Survey scales">
            <ScalesDemo />
          </Demo>
          <Demo title="One-tap poll">
            <PollDemo />
          </Demo>
          <Demo title="Push primer">
            <PrimerDemo />
          </Demo>
          <Demo title="Media library">
            <MediaLibrary assets={media} selected={picked} onSelectedChange={setPicked} maxSelect={3} kinds={['image']} />
          </Demo>
        </section>

        <section aria-label="Weekly program">
          <Card>
            <CardHead title="Weekly program" />
            <ProgramBoard program={PROGRAM} registrations={PROGRAM_REGISTRATIONS} now={Date.now()} />
          </Card>
        </section>

        <ApiReference
          docs={CONTEST_DOCS}
          groups={CONTEST_GROUPS}
          intro={
            <>
              Every component, hook and utility of the contest layer, with props, an example and notes. Generated from <code>src/contest/catalog</code>; the same data
              becomes <code>docs/components/contest-*.md</code> with <code>npm run docs</code>.
            </>
          }
        />
      </div>
    </>
  )
}
