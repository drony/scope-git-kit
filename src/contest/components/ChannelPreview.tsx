import { useState } from 'react'
import { Bell, Mail, Smartphone, type LucideIcon } from 'lucide-react'
import { Segmented } from '@/kit/components/nav/Segmented'
import { cn } from '@/kit/lib/cn'
import type { Channel } from '../data/types'
import { renderTemplate, SAMPLE_VARS, type TemplateVars } from '../lib/templates'
import { NotificationItem } from './NotificationCenter'

const CHANNELS: Record<Channel, { label: string; icon: LucideIcon }> = {
  'in-app': { label: 'In the app', icon: Bell },
  email: { label: 'E-mail', icon: Mail },
  push: { label: 'Push', icon: Smartphone },
}

interface ChannelPreviewProps {
  title: string
  body: string
  /** The channels the announcement uses; each one gets a tab. */
  channels: Channel[]
  /** Name shown as the sender, and the value of `{{contest}}`. */
  contest?: string
  /** Values for the merge fields. They default to a sample person. */
  vars?: TemplateVars
  /** The tab shown. Leave out to let the preview keep it. */
  channel?: Channel
  onChannelChange?: (channel: Channel) => void
  className?: string
}

/**
 * The same announcement as each channel shows it: a notification in the app, an e-mail, and a push on a lock screen.
 * Merge fields are filled with a sample person, so you see a real message. Unknown fields stay as typed, which makes a
 * typo easy to spot.
 */
export function ChannelPreview({ title, body, channels, contest = 'Contest', vars, channel, onChannelChange, className }: ChannelPreviewProps) {
  const [own, setOwn] = useState<Channel>()
  const active = channel && channels.includes(channel) ? channel : own && channels.includes(own) ? own : channels[0]
  const filled = { ...SAMPLE_VARS, contest, ...vars }
  const t = renderTemplate(title, filled) || 'Untitled announcement'
  const b = renderTemplate(body, filled) || 'Write the message to see it here.'
  const choose = (c: Channel) => {
    setOwn(c)
    onChannelChange?.(c)
  }

  if (channels.length === 0) return <p className={cn('cs-pv-empty', className)}>Choose a channel to see how the message looks.</p>

  return (
    <div className={cn('cs-pv', className)}>
      <Segmented<Channel> ariaLabel="Channel" value={active} onChange={choose} options={channels.map((c) => ({ value: c, label: CHANNELS[c].label, icon: (() => { const Icon = CHANNELS[c].icon; return <Icon size={14} aria-hidden="true" /> })() }))} />

      {active === 'in-app' && (
        <div className="cs-pv-app">
          <NotificationItem notification={{ id: 'preview', recipientId: '', kind: 'announcement', title: t, body: b, createdAt: new Date().toISOString() }} />
        </div>
      )}

      {active === 'email' && (
        <article className="cs-pv-mail" aria-label="E-mail preview">
          <dl>
            <dt>From</dt>
            <dd>{contest}</dd>
            <dt>To</dt>
            <dd>{filled.name}</dd>
            <dt>Subject</dt>
            <dd>
              <strong>{t}</strong>
            </dd>
          </dl>
          <div className="cs-pv-mail-body">
            <p>{b}</p>
            <span className="cs-pv-cta">Open {contest}</span>
            <small>You get this e-mail because you joined {contest}.</small>
          </div>
        </article>
      )}

      {active === 'push' && (
        <div className="cs-pv-lock" aria-label="Push notification preview">
          <span className="cs-pv-time">9:41</span>
          <div className="cs-pv-push">
            <span className="cs-pv-appicon" aria-hidden="true">
              {contest[0]}
            </span>
            <span>
              <strong>{t}</strong>
              <span>{b}</span>
            </span>
            <small>now</small>
          </div>
        </div>
      )}
    </div>
  )
}
