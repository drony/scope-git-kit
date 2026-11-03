import { useMemo, useState, type ReactNode } from 'react'
import { CONTEST_DOCS, CONTEST_GROUPS } from '@/contest/catalog'
import { AnswerKeyEditor } from '@/contest/components/AnswerKeyEditor'
import { ChannelPreview } from '@/contest/components/ChannelPreview'
import { DeliveryStatus } from '@/contest/components/DeliveryStatus'
import { Leaderboard } from '@/contest/components/Leaderboard'
import { MediaLibrary } from '@/contest/components/MediaLibrary'
import { NotificationItem } from '@/contest/components/NotificationCenter'
import { Podium } from '@/contest/components/Podium'
import { QuestionView } from '@/contest/components/QuestionView'
import { RubricScorer } from '@/contest/components/RubricScorer'
import { ScoreHeatGrid } from '@/contest/components/ScoreHeatGrid'
import type { AnswerKey, AnswerValue, Id } from '@/contest/data/types'
import { rankParticipants, rankTeams } from '@/contest/lib/ranking'
import { ApiReference } from '@/kit/components/docs/ApiReference'
import { PageBar } from '@/kit/components/nav/PageBar'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { CONTEST_SEED } from '@/apps/contest/seed/contest'

const { questions, answerKeys, media, participants, submissions } = CONTEST_SEED
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
          <Demo title="Media library">
            <MediaLibrary assets={media} selected={picked} onSelectedChange={setPicked} maxSelect={3} kinds={['image']} />
          </Demo>
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
