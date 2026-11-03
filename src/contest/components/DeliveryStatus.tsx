import { Bell, Mail, Smartphone, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Meter } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { Announcement, Channel } from '../data/types'

const CHANNELS: Record<Channel, { label: string; icon: LucideIcon }> = {
  'in-app': { label: 'In the app', icon: Bell },
  email: { label: 'E-mail', icon: Mail },
  push: { label: 'Push', icon: Smartphone },
}

/** After an announcement is sent: per channel, how many people it reached, how many it missed, and why. */
export function DeliveryStatus({ delivery, className }: { delivery: Announcement['delivery']; className?: string }) {
  const rows = (Object.keys(CHANNELS) as Channel[]).flatMap((c) => (delivery?.[c] ? [{ channel: c, ...delivery[c]! }] : []))
  if (rows.length === 0) return null
  return (
    <ul className={cn('cs-delivery', className)} aria-label="Delivery">
      {rows.map((r) => {
        const Icon = CHANNELS[r.channel].icon
        const total = r.sent + r.failed
        return (
          <li key={r.channel}>
            <span className="cs-delivery-name">
              <Icon aria-hidden="true" /> {CHANNELS[r.channel].label}
            </span>
            <Meter label={`${CHANNELS[r.channel].label}: ${r.sent} of ${total} reached`} value={r.sent} max={Math.max(1, total)} tone={r.failed ? 'warning' : 'success'} />
            <span className="cs-delivery-count">
              {r.sent} of {total} reached
            </span>
            {r.failed > 0 && (
              <small className="cs-delivery-miss">
                <TriangleAlert aria-hidden="true" /> {r.failed} missed. {r.reason}
              </small>
            )}
          </li>
        )
      })}
    </ul>
  )
}
