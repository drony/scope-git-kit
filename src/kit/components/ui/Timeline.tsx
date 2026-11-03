import type { ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

export interface TimelineItem {
  id: string
  title: ReactNode
  /** When it happens or happened, shown beside the title. */
  time?: ReactNode
  description?: ReactNode
  /** A small icon inside the marker. */
  icon?: ReactNode
  state?: 'done' | 'active' | 'upcoming'
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}

/** A vertical list of events on a line. `state` styles the marker: filled when done, ringed when active, hollow when upcoming. */
export function Timeline({ items, label, className }: { items: TimelineItem[]; label: string; className?: string }) {
  return (
    <ol className={cn('timeline', className)} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className={cn('timeline-item', `is-${item.state ?? 'done'}`, item.tone && `tone-${item.tone}`)} aria-current={item.state === 'active' ? 'step' : undefined}>
          <span className="timeline-mark" aria-hidden="true">
            {item.icon}
          </span>
          <div className="timeline-body">
            <div className="timeline-head">
              <strong>{item.title}</strong>
              {item.time && <span className="timeline-time">{item.time}</span>}
            </div>
            {item.description && <p>{item.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
