import { Bell, CircleCheck, Clock, Info, Megaphone, Trophy, type LucideIcon } from 'lucide-react'
import { Popover } from '@/kit/components/overlays/Popover'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { Id, Notification, NotificationKind } from '../data/types'
import { dayLabel, relativeTime } from '../lib/dates'

const ICONS: Record<NotificationKind, LucideIcon> = { announcement: Megaphone, score: Trophy, deadline: Clock, system: Info }

interface NotificationItemProps {
  notification: Notification
  /** Makes the item a button. Without it the item is plain text, as in a preview. */
  onSelect?: (notification: Notification) => void
  now?: Date
}

/** One notification: an icon for its kind, the title, the text, how long ago, and a dot while it is unread. */
export function NotificationItem({ notification: n, onSelect, now }: NotificationItemProps) {
  const Icon = ICONS[n.kind]
  const unread = !n.readAt
  const content = (
    <>
      <span className={cn('cs-note-icon', `is-${n.kind}`)}>
        <Icon aria-hidden="true" />
      </span>
      <span className="cs-note-body">
        <strong>{n.title}</strong>
        <span>{n.body}</span>
        <small>{relativeTime(n.createdAt, now)}</small>
      </span>
      {unread && <span className="cs-note-dot" role="img" aria-label="Unread" />}
    </>
  )
  return onSelect ? (
    <button type="button" className={cn('cs-note', unread && 'is-unread')} onClick={() => onSelect(n)}>
      {content}
    </button>
  ) : (
    <div className={cn('cs-note', unread && 'is-unread')}>{content}</div>
  )
}

interface NotificationCenterProps {
  notifications: Notification[]
  /** Called with the ids that were just read: one when an item is opened, all unread ones for "Mark all as read". */
  onRead: (ids: Id[]) => void
  /** Called when an item that has a link is opened. */
  onOpen?: (notification: Notification) => void
  now?: Date
  className?: string
}

/**
 * A bell with the number of unread notifications. It opens a panel with the notifications grouped by day, newest first.
 * Opening an item marks it read; "Mark all as read" clears the rest.
 */
export function NotificationCenter({ notifications, onRead, onOpen, now = new Date(), className }: NotificationCenterProps) {
  const unread = notifications.filter((n) => !n.readAt)
  const groups: Array<{ label: string; items: Notification[] }> = []
  for (const n of [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const label = dayLabel(n.createdAt, now)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(n)
    else groups.push({ label, items: [n] })
  }

  return (
    <Popover
      placement="bottom-end"
      className={cn('cs-notes', className)}
      trigger={
        <button type="button" className="cs-bell" aria-label={unread.length ? `Notifications, ${unread.length} unread` : 'Notifications'}>
          <Bell aria-hidden="true" />
          {unread.length > 0 && <span className="cs-bell-count">{unread.length > 9 ? '9+' : unread.length}</span>}
        </button>
      }
    >
      {({ close }) => (
        <div className="cs-notes-panel">
          <header>
            <strong>Notifications</strong>
            <Button variant="ghost" size="sm" disabled={unread.length === 0} onClick={() => onRead(unread.map((n) => n.id))}>
              <CircleCheck aria-hidden="true" /> Mark all as read
            </Button>
          </header>
          {groups.length === 0 ? (
            <p className="cs-notes-empty">Nothing yet. News about the contest shows up here.</p>
          ) : (
            groups.map((g) => (
              <section key={g.label} aria-label={g.label}>
                <h4>{g.label}</h4>
                {g.items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    now={now}
                    onSelect={(item) => {
                      if (!item.readAt) onRead([item.id])
                      if (item.href) {
                        onOpen?.(item)
                        close()
                      }
                    }}
                  />
                ))}
              </section>
            ))
          )}
        </div>
      )}
    </Popover>
  )
}
