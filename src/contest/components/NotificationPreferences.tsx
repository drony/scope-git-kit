import { Moon } from 'lucide-react'
import { TimeField } from '@/kit/components/calendar/TimePicker'
import { Switch } from '@/kit/components/forms/Controls'
import { Field } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Segmented } from '@/kit/components/nav/Segmented'
import { cn } from '@/kit/lib/cn'
import type { Channel, NotificationCategory, NotificationPrefs } from '../data/types'
import { CATEGORIES, CHANNELS } from '../lib/prefs'

interface NotificationPreferencesProps {
  value: NotificationPrefs
  onChange: (prefs: NotificationPrefs) => void
  /** Time zones to offer. The person's own is added. */
  timezones?: string[]
  className?: string
}

const ZONES = ['UTC', 'Europe/London', 'Europe/Istanbul', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']

/**
 * A person's say over what reaches them: a grid of kinds of message by channel, quiet hours (in their own time zone) for push
 * and e-mail, and an optional daily digest. The in-app bell is never held back. A critical message, such as "the show is
 * starting", ignores quiet hours and the digest, but still respects a channel that is switched off.
 */
export function NotificationPreferences({ value, onChange, timezones = ZONES, className }: NotificationPreferencesProps) {
  const own = Intl.DateTimeFormat().resolvedOptions().timeZone
  const zones = [...new Set([own, value.quiet?.timezone, ...timezones].filter((z): z is string => Boolean(z)))]
  const flip = (cat: NotificationCategory, ch: Channel, on: boolean) => onChange({ ...value, matrix: { ...value.matrix, [cat]: { ...value.matrix[cat], [ch]: on } } })
  const quiet = value.quiet
  return (
    <div className={cn('np', className)}>
      <table className="np-grid">
        <caption className="cs-sr">What reaches you, by kind and channel</caption>
        <thead>
          <tr>
            <th scope="col">What</th>
            {CHANNELS.map((c) => (
              <th key={c.value} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat) => (
            <tr key={cat.value}>
              <th scope="row">
                <strong>{cat.label}</strong>
                <small>{cat.hint}</small>
              </th>
              {CHANNELS.map((ch) => (
                <td key={ch.value}>
                  <label className="np-toggle">
                    <input type="checkbox" checked={value.matrix[cat.value][ch.value]} onChange={(e) => flip(cat.value, ch.value, e.target.checked)} aria-label={`${cat.label} by ${ch.label}`} />
                    <i aria-hidden="true" />
                  </label>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <section className="np-quiet">
        <Switch
          checked={Boolean(quiet)}
          onChange={(on) => onChange({ ...value, quiet: on ? { from: '22:00', to: '08:00', timezone: own } : undefined })}
          label={
            <span className="np-quiet-title">
              <Moon aria-hidden="true" /> Quiet hours
            </span>
          }
          description="Push and e-mail wait until the quiet time ends. The bell in the app keeps filling."
        />
        {quiet && (
          <div className="np-quiet-row">
            <Field label="From">
              <TimeField ariaLabel="Quiet from" value={quiet.from} onChange={(from) => onChange({ ...value, quiet: { ...quiet, from } })} />
            </Field>
            <Field label="To">
              <TimeField ariaLabel="Quiet until" value={quiet.to} onChange={(to) => onChange({ ...value, quiet: { ...quiet, to } })} />
            </Field>
            <Field label="Time zone">
              <Select<string> ariaLabel="Time zone" value={quiet.timezone} searchable options={zones.map((z) => ({ value: z, label: z.replace('_', ' ') }))} onChange={(timezone) => onChange({ ...value, quiet: { ...quiet, timezone } })} />
            </Field>
          </div>
        )}
      </section>

      <section className="np-digest">
        <span className="field-label">E-mail and push summary</span>
        <Segmented<'off' | 'daily'>
          ariaLabel="Summary"
          value={value.digest}
          onChange={(digest) => onChange({ ...value, digest })}
          options={[
            { value: 'off', label: 'One by one' },
            { value: 'daily', label: 'Once a day' },
          ]}
        />
        <p className="field-hint">With a daily summary, e-mail and push that are not urgent are gathered into one message. “The show is starting” always arrives at once.</p>
      </section>
    </div>
  )
}
