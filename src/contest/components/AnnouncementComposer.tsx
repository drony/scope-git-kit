import { useRef } from 'react'
import { Send } from 'lucide-react'
import { DatePicker } from '@/kit/components/calendar/DatePicker'
import { TimeField } from '@/kit/components/calendar/TimePicker'
import { Checkbox, Switch } from '@/kit/components/forms/Controls'
import { Field, Input, Textarea } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Alert } from '@/kit/components/ui/Feedback'
import { Button } from '@/kit/components/ui/Button'
import { Chip, Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Announcement, Audience, Channel, Participant, Submission } from '../data/types'
import { announcementProblems } from '../lib/announcements'
import { audienceOf, SEGMENTS, teamsOf, type Segment } from '../lib/audience'
import { TEMPLATE_FIELDS } from '../lib/templates'

interface AnnouncementComposerProps {
  value: Announcement
  onChange: (announcement: Announcement) => void
  /** Everyone in the contest: the audience is counted from this list. */
  participants: Participant[]
  /** Needed for audiences that depend on progress ("not started", "finished"). */
  submissions?: Submission[]
  /** Shows a "Send now" button. Called only when nothing is wrong; save the draft first. */
  onSend?: () => void
  now?: Date
  className?: string
}

const CHANNELS: Array<{ value: Channel; label: string; description: string }> = [
  { value: 'in-app', label: 'In the app', description: 'A notification in the bell and a post in the announcements.' },
  { value: 'email', label: 'E-mail', description: 'A message to the address each person signed up with.' },
  { value: 'push', label: 'Push', description: 'A notification on the phones of people who use the app.' },
]

const AUDIENCES = [
  { value: 'all', label: 'Everyone', description: 'Every participant who is not disqualified.' },
  ...SEGMENTS.map((s) => ({ value: s.value as string, label: s.label, description: s.description })),
  { value: 'people', label: 'Chosen people', description: 'Pick the people one by one.' },
]

const kindOf = (a: Audience): string => (a.kind === 'segment' ? a.segment : a.kind)

function toAudience(kind: string, previous: Audience, teams: string[]): Audience {
  if (kind === 'all') return { kind: 'all' }
  if (kind === 'people') return { kind: 'people', ids: previous.kind === 'people' ? previous.ids : [] }
  return { kind: 'segment', segment: kind as Segment, team: kind === 'team' ? (previous.kind === 'segment' && previous.team) || teams[0] : undefined }
}

const toDate = (iso?: string) => (iso ? new Date(iso) : null)
const toTime = (iso?: string) => (iso ? `${String(new Date(iso).getHours()).padStart(2, '0')}:${String(new Date(iso).getMinutes()).padStart(2, '0')}` : null)
const combine = (date: Date, time: string | null) => {
  const [h, m] = (time ?? '09:00').split(':').map(Number)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).toISOString()
}

/**
 * The form for one announcement: title and message with merge fields, who gets it (with a live count), which channels,
 * and when. It saves and sends nothing: it hands every change to `onChange` and calls `onSend` when the person says go.
 * A message that was already sent is shown but cannot be edited.
 */
export function AnnouncementComposer({ value: a, onChange, participants, submissions = [], onSend, now = new Date(), className }: AnnouncementComposerProps) {
  const title = useRef<HTMLInputElement>(null)
  const body = useRef<HTMLTextAreaElement>(null)
  const last = useRef<'title' | 'body'>('body')
  const teams = teamsOf(participants)
  const reach = audienceOf(a.audience, participants, submissions)
  const problems = announcementProblems(a, reach.length, now)
  const sent = a.status === 'sent'
  const set = (patch: Partial<Announcement>) => onChange({ ...a, ...patch })

  const insert = (field: string) => {
    const key = last.current
    const el = key === 'title' ? title.current : body.current
    const text = a[key]
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? start
    set({ [key]: `${text.slice(0, start)}{{${field}}}${text.slice(end)}` })
    requestAnimationFrame(() => {
      el?.focus()
      const at = start + field.length + 4
      el?.setSelectionRange(at, at)
    })
  }

  const when = a.scheduledAt ? new Date(a.scheduledAt) : null

  return (
    <div className={cn('cs-composer', className)}>
      {sent && (
        <Alert tone="info" title="This announcement was sent">
          A sent message cannot be edited. Write a new one to correct it.
        </Alert>
      )}
      <fieldset className="cs-fieldset" disabled={sent}>
        <Field label="Title">
          <Input ref={title} value={a.title} placeholder="What is this about?" onFocus={() => (last.current = 'title')} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Message">
          <Textarea ref={body} rows={5} value={a.body} placeholder="Write to the participants" onFocus={() => (last.current = 'body')} onChange={(e) => set({ body: e.target.value })} />
        </Field>
        <div className="cs-fields" role="group" aria-label="Insert a merge field">
          <span>Insert:</span>
          {TEMPLATE_FIELDS.map((f) => (
            <Chip key={f.name} onClick={() => insert(f.name)}>
              {`{{${f.name}}}`}
            </Chip>
          ))}
        </div>

        <div className="cs-grid-3">
          <Field label="Who gets it">
            <Select<string> ariaLabel="Audience" value={kindOf(a.audience)} options={AUDIENCES} onChange={(kind) => set({ audience: toAudience(kind, a.audience, teams) })} />
          </Field>
          {a.audience.kind === 'segment' && a.audience.segment === 'team' && (
            <Field label="Team">
              <Select<string>
                ariaLabel="Team"
                value={a.audience.team ?? ''}
                placeholder="Choose a team"
                options={teams.map((t) => ({ value: t, label: t }))}
                onChange={(team) => set({ audience: { kind: 'segment', segment: 'team', team } })}
              />
            </Field>
          )}
        </div>

        {a.audience.kind === 'people' && (
          <div className="cs-people" role="group" aria-label="Choose people">
            {participants.map((p) => (
              <Checkbox
                key={p.id}
                label={p.name}
                description={p.team}
                checked={a.audience.kind === 'people' && a.audience.ids.includes(p.id)}
                disabled={p.status === 'disqualified'}
                onChange={(on) => set({ audience: { kind: 'people', ids: on ? [...(a.audience.kind === 'people' ? a.audience.ids : []), p.id] : (a.audience.kind === 'people' ? a.audience.ids : []).filter((id) => id !== p.id) } })}
              />
            ))}
          </div>
        )}
        <p className="cs-reach" role="status">
          <Tag tone={reach.length ? 'accent' : 'warning'}>{reach.length}</Tag> {reach.length === 1 ? 'person' : 'people'} will get this, out of {participants.length}.
        </p>

        <div className="cs-field">
          <span className="field-label">Channels</span>
          {CHANNELS.map((c) => (
            <Checkbox
              key={c.value}
              label={c.label}
              description={c.description}
              checked={a.channels.includes(c.value)}
              onChange={(on) => set({ channels: on ? [...a.channels, c.value] : a.channels.filter((x) => x !== c.value) })}
            />
          ))}
        </div>

        <Switch checked={a.pinned} onChange={(pinned) => set({ pinned })} label="Pin it" description="A pinned announcement stays at the top of the feed." />

        <div className="cs-field">
          <span className="field-label">When</span>
          <Segmented<'draft' | 'scheduled'>
            ariaLabel="When to send"
            value={a.status === 'scheduled' ? 'scheduled' : 'draft'}
            onChange={(status) => set(status === 'draft' ? { status, scheduledAt: undefined } : { status, scheduledAt: a.scheduledAt ?? combine(new Date(now.getTime() + 86_400_000), '09:00') })}
            options={[
              { value: 'draft', label: 'Keep as a draft' },
              { value: 'scheduled', label: 'Schedule it' },
            ]}
          />
          {a.status === 'scheduled' && (
            <div className="cs-when">
              <DatePicker ariaLabel="Date to send" value={toDate(a.scheduledAt)} min={new Date(now.getFullYear(), now.getMonth(), now.getDate())} onChange={(d) => d && set({ scheduledAt: combine(d, toTime(a.scheduledAt)) })} />
              <TimeField ariaLabel="Time to send" value={toTime(a.scheduledAt) ?? ''} onChange={(t) => when && set({ scheduledAt: combine(when, t) })} />
            </div>
          )}
        </div>
      </fieldset>

      {!sent && problems.length > 0 && (
        <Alert tone="warning" title={problems.length === 1 ? 'One thing before you send' : `${problems.length} things before you send`}>
          <span className="cs-problems">
            {problems.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </span>
        </Alert>
      )}
      {!sent && onSend && (
        <div className="cs-send">
          <Button disabled={problems.some((p) => !p.startsWith('Pick a time'))} onClick={onSend}>
            <Send aria-hidden="true" /> Send now to {reach.length} {reach.length === 1 ? 'person' : 'people'}
          </Button>
        </div>
      )}
    </div>
  )
}
