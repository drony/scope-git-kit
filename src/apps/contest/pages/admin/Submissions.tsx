import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { cn } from '@/kit/lib/cn'
import { SubmissionReview } from '@/contest/components/SubmissionReview'
import type { SubmissionStatus } from '@/contest/data/types'
import { useAnswerKeys, useMedia, useParticipants, useQuestions, useSubmissions } from '@/contest/hooks/useContestData'
import { isPending } from '@/contest/lib/ranking'

const TONE: Record<SubmissionStatus, Tone> = { 'in-progress': 'neutral', submitted: 'warning', reviewed: 'success' }

export default function Submissions() {
  usePageTitle('Submissions')
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'review' | 'all'>('review')
  const subs = useSubmissions()
  const people = useParticipants()
  const questions = useQuestions()
  const keys = useAnswerKeys((questions.data ?? []).map((q) => q.id))
  const media = useMedia()

  const submitted = useMemo(() => (subs.data ?? []).filter((s) => s.status !== 'in-progress'), [subs.data])
  const waiting = (s: (typeof submitted)[number]) => Object.values(s.scores).filter(isPending).length
  const shown = submitted.filter((s) => filter === 'all' || waiting(s) > 0 || s.id === params.get('sub')).sort((a, b) => waiting(b) - waiting(a))
  const current = submitted.find((s) => s.id === params.get('sub')) ?? shown[0]
  const name = (id: string) => people.data?.find((p) => p.id === id)?.name ?? id
  const lookup = (id: string) => media.data?.find((a) => a.id === id)
  const set = (id: string) => setParams({ sub: id }, { replace: true })

  const ready = subs.data && questions.data && people.data

  return (
    <div className="cs-subs">
      <Card>
        <CardHead title="Submissions" />
        <Segmented<'review' | 'all'>
          ariaLabel="Which submissions"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'review', label: `To review (${submitted.filter((s) => waiting(s) > 0).length})` },
            { value: 'all', label: `All (${submitted.length})` },
          ]}
        />
        {!ready ? (
          <Skeleton height="12rem" radius="0.75rem" />
        ) : shown.length === 0 ? (
          <EmptyState icon={<ClipboardCheck size={20} aria-hidden="true" />} title="Nothing to review">
            Every submitted answer is scored.
          </EmptyState>
        ) : (
          <ul className="cs-subs-list">
            {shown.map((s) => (
              <li key={s.id}>
                <button type="button" className={cn(current?.id === s.id && 'is-open')} aria-current={current?.id === s.id ? 'true' : undefined} onClick={() => set(s.id)}>
                  <span>{name(s.participantId)}</span>
                  <Tag tone={TONE[s.status]}>{waiting(s) > 0 ? `${waiting(s)} to score` : s.status}</Tag>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        {ready && current ? (
          <SubmissionReview
            key={current.id}
            questions={questions.data!.filter((q) => current.scores[q.id] || current.answers.some((a) => a.questionId === q.id))}
            submission={current}
            answerKeys={keys.data ?? {}}
            participantName={name(current.participantId)}
            media={lookup}
            initialQuestionId={params.get('q') ?? undefined}
            reviewer="Judge"
            onScore={(qid, score) =>
              void subs
                .saveScore(current.id, qid, score, 'Judge')
                .then(() => toast.push({ tone: 'success', title: 'Score saved', key: 'score-saved' }))
                .catch((e: unknown) => toast.push({ tone: 'error', title: 'Could not save the score', description: e instanceof Error ? e.message : undefined }))
            }
          />
        ) : (
          <EmptyState icon={<ClipboardCheck size={20} aria-hidden="true" />} title="Pick a submission">
            Open one on the left to compare each answer with its key and change the points.
          </EmptyState>
        )}
      </Card>
    </div>
  )
}
