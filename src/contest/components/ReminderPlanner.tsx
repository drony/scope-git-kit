import { Plus, X } from 'lucide-react'
import { Checkbox } from '@/kit/components/forms/Controls'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Channel, Episode, Reminder } from '../data/types'
import { offsetLabel, reminderTime } from '../lib/reminders'
import { DeliveryStatus } from './DeliveryStatus'

const CHANNELS: Array<{ value: Channel; label: string }> = [
  { value: 'in-app', label: 'In the app' },
  { value: 'email', label: 'E-mail' },
  { value: 'push', label: 'Push' },
]
const PRESETS = [
  { offsetMin: 2880, label: '2 days before' },
  { offsetMin: 1440, label: '1 day before' },
  { offsetMin: 60, label: '1 hour before' },
  { offsetMin: 10, label: '10 minutes before' },
  { offsetMin: 0, label: 'At the start' },
]

interface ReminderPlannerProps {
  episode: Episode
  onChange: (episode: Episode) => void
  now?: number
  className?: string
}

const clock = (ms: number) => new Date(ms).toLocaleString('en', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

/**
 * The reminders before a show on a time line: a day before, an hour before, ten minutes before, and "starting now". Each has
 * its own channels and a clock time worked out from the start. Pick from the usual steps, so the same reminder is never added
 * twice. Whether a person gets it also depends on their own preferences: someone who turned push off is skipped, and
 * quiet hours hold push and e-mail back, except "starting now".
 */
export function ReminderPlanner({ episode, onChange, now = Date.now(), className }: ReminderPlannerProps) {
  const start = new Date(episode.startsAt).getTime()
  const sorted = [...episode.reminders].sort((a, b) => b.offsetMin - a.offsetMin)
  const span = Math.max(1, sorted[0]?.offsetMin ?? 1)
  const set = (id: string, patch: Partial<Reminder>) => onChange({ ...episode, reminders: episode.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const free = PRESETS.filter((p) => !episode.reminders.some((r) => r.offsetMin === p.offsetMin))

  return (
    <div className={cn('rp', className)}>
      <div className="rp-line" role="img" aria-label={`Reminders: ${sorted.map((r) => offsetLabel(r.offsetMin)).join(', ')}`}>
        <span className="rp-track" />
        {sorted.map((r) => (
          <i key={r.id} className={cn(r.sentAt && 'is-sent', reminderTime(episode, r) <= now && !r.sentAt && 'is-due')} style={{ left: `${(1 - r.offsetMin / span) * 94 + 3}%` }} title={`${offsetLabel(r.offsetMin)}: ${clock(reminderTime(episode, r))}`} />
        ))}
        <span className="rp-start">Show starts {clock(start)}</span>
      </div>

      <ul className="rp-list">
        {sorted.map((r) => (
          <li key={r.id}>
            <div className="rp-when">
              <strong>{offsetLabel(r.offsetMin)}</strong>
              <span>{clock(reminderTime(episode, r))}</span>
            </div>
            <div className="rp-channels" role="group" aria-label={`Channels for ${offsetLabel(r.offsetMin)}`}>
              {CHANNELS.map((c) => (
                <Checkbox key={c.value} label={c.label} checked={r.channels.includes(c.value)} disabled={Boolean(r.sentAt)} onChange={(on) => set(r.id, { channels: on ? [...r.channels, c.value] : r.channels.filter((x) => x !== c.value) })} />
              ))}
            </div>
            <div className="rp-state">
              {r.sentAt ? <Tag tone="success">Sent</Tag> : reminderTime(episode, r) <= now ? <Tag tone="warning">Due: goes out on the next read</Tag> : <Tag>Scheduled</Tag>}
              {r.offsetMin === 0 && <small>Critical: skips quiet hours and the digest.</small>}
            </div>
            <Button variant="ghost" size="sm" icon aria-label={`Remove the ${offsetLabel(r.offsetMin)} reminder`} disabled={Boolean(r.sentAt)} onClick={() => onChange({ ...episode, reminders: episode.reminders.filter((x) => x.id !== r.id) })}>
              <X aria-hidden="true" />
            </Button>
            {r.delivery && (
              <div className="rp-report">
                <DeliveryStatus delivery={r.delivery} />
              </div>
            )}
          </li>
        ))}
        {sorted.length === 0 && <li className="rp-none">No reminders. People only hear about the show if they look.</li>}
      </ul>

      {free.length > 0 && (
        <div className="rp-add" role="group" aria-label="Add a reminder">
          {free.map((p) => (
            <Button key={p.offsetMin} variant="plain" size="sm" onClick={() => onChange({ ...episode, reminders: [...episode.reminders, { id: `${episode.id}-r${p.offsetMin}`, offsetMin: p.offsetMin, channels: p.offsetMin >= 1440 ? ['in-app', 'email'] : ['in-app', 'push'] }] })}>
              <Plus aria-hidden="true" /> {p.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
