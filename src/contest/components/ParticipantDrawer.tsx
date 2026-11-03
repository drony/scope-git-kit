import { useEffect, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Field, Textarea } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Drawer } from '@/kit/components/overlays/Drawer'
import { Modal } from '@/kit/components/overlays/Modal'
import { Avatar } from '@/kit/components/ui/Avatar'
import { Button } from '@/kit/components/ui/Button'
import { Timeline, type TimelineItem } from '@/kit/components/ui/Timeline'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import type { Participant, ParticipantStatus, Submission } from '../data/types'
import { dayLabel, timeLabel } from '../lib/dates'
import { isPending } from '../lib/ranking'

interface ParticipantDrawerProps {
  /** The person to show. The drawer is open while this is set. */
  participant: Participant | null
  submission?: Submission
  /** Their place on the leaderboard, when they have one. */
  rank?: number
  onClose: () => void
  onSave: (participant: Participant) => void
  /** Shows a "Review the answers" button. */
  onReview?: (submission: Submission) => void
  now?: Date
}

const TONE: Record<ParticipantStatus, Tone> = { invited: 'neutral', active: 'accent', finished: 'success', disqualified: 'error' }
const STATUS_OPTIONS: Array<{ value: ParticipantStatus; label: string; description: string }> = [
  { value: 'invited', label: 'Invited', description: 'Has not opened the contest yet.' },
  { value: 'active', label: 'Active', description: 'Is taking part.' },
  { value: 'finished', label: 'Finished', description: 'Has submitted the answers.' },
  { value: 'disqualified', label: 'Disqualified', description: 'Out of the ranking and of every announcement.' },
]

const when = (iso: string, now: Date) => `${dayLabel(iso, now)}, ${timeLabel(iso)}`

/**
 * One person: their status (changing it to "disqualified" asks first), a note, what they did and when, and a link to
 * their answers. It saves nothing: it hands the changed person to `onSave`.
 */
export function ParticipantDrawer({ participant, submission, rank, onClose, onSave, onReview, now = new Date() }: ParticipantDrawerProps) {
  const [draft, setDraft] = useState<Participant | null>(participant)
  const [asking, setAsking] = useState(false)
  useEffect(() => setDraft(participant), [participant])

  if (!participant || !draft) return null
  const dirty = JSON.stringify(draft) !== JSON.stringify(participant)
  const pending = submission ? Object.values(submission.scores).filter(isPending).length : 0
  const points = submission ? Math.round(Object.values(submission.scores).reduce((n, s) => n + s.points, 0) * 100) / 100 : 0
  const max = submission ? Object.values(submission.scores).reduce((n, s) => n + s.max, 0) : 0

  const events: TimelineItem[] = [
    ...(participant.joinedAt ? [{ id: 'joined', title: 'Joined the contest', time: when(participant.joinedAt, now) }] : [{ id: 'invited', title: 'Invited', description: 'Has not opened the contest yet.', state: 'active' as const }]),
    ...(submission && submission.answers.length > 0 ? [{ id: 'started', title: 'Started the quiz', time: when(submission.startedAt, now), description: `${submission.answers.length} answer${submission.answers.length === 1 ? '' : 's'} so far.` }] : []),
    ...(submission?.submittedAt ? [{ id: 'submitted', title: 'Submitted the answers', time: when(submission.submittedAt, now), tone: 'success' as const }] : []),
    ...(submission && submission.status !== 'in-progress' ? [pending > 0 ? { id: 'review', title: 'Waiting for a reviewer', description: `${pending} answer${pending === 1 ? '' : 's'} to score.`, state: 'active' as const, tone: 'warning' as const } : { id: 'review', title: 'Every answer is scored', tone: 'success' as const }] : []),
    ...(participant.status === 'disqualified' ? [{ id: 'dq', title: 'Disqualified', tone: 'error' as const }] : []),
  ]

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title="Participant"
        footer={
          <>
            <Button variant="plain" disabled={!dirty} onClick={() => setDraft(participant)}>
              Discard
            </Button>
            <Button disabled={!dirty} onClick={() => onSave(draft)}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="cs-pd">
          <header>
            <Avatar name={participant.name} size={48} />
            <div>
              <h3>{participant.name}</h3>
              <p>{participant.email}</p>
              <p>
                <Tag tone={TONE[participant.status]}>{participant.status}</Tag> {participant.team && <span>Team {participant.team}</span>}
              </p>
            </div>
          </header>

          {submission && submission.status !== 'in-progress' && (
            <div className="cs-pd-score">
              <strong>
                {points} <span>/ {max} points</span>
              </strong>
              {rank !== undefined && <Tag tone="accent">Rank {rank}</Tag>}
              {onReview && (
                <Button variant="plain" size="sm" onClick={() => onReview(submission)}>
                  <ClipboardCheck aria-hidden="true" /> Review the answers
                </Button>
              )}
            </div>
          )}

          <Field label="Status">
            <Select<ParticipantStatus>
              ariaLabel="Status"
              value={draft.status}
              options={STATUS_OPTIONS}
              onChange={(status) => (status === 'disqualified' && participant.status !== 'disqualified' ? setAsking(true) : setDraft({ ...draft, status }))}
            />
          </Field>
          <Field label="Note" optional hint="Only the organisers see it.">
            <Textarea rows={3} value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value || undefined })} />
          </Field>

          <section>
            <h4>What happened</h4>
            <Timeline label="Events" items={events} />
          </section>
        </div>
      </Drawer>

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title={`Disqualify ${participant.name}?`}
        description="They leave the leaderboard and no announcement reaches them. You can change this later."
        actions={
          <>
            <Button variant="plain" onClick={() => setAsking(false)}>
              Keep them in
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDraft({ ...draft, status: 'disqualified' })
                setAsking(false)
              }}
            >
              Disqualify
            </Button>
          </>
        }
      />
    </>
  )
}
