import { BellRing } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'

interface PushPrimerProps {
  /** Called when the person agrees. Only now ask the browser or the phone for permission. */
  onAllow: () => void
  /** Called when the person says not now. Ask again later, at a moment that makes sense, not at once. */
  onLater: () => void
  /** What the person gets, in a few words each. */
  benefits?: string[]
  className?: string
}

/**
 * A soft question before the system's own permission box. It says what the person gets and asks first; the browser's prompt
 * appears only after "Turn on". A "Not now" does not use up the one chance the system gives: a refused system prompt is hard
 * to undo, a refused soft prompt is not.
 */
export function PushPrimer({ onAllow, onLater, benefits = ['A nudge 10 minutes before the show', 'Your score when it ends', 'Never more than a few a week'], className }: PushPrimerProps) {
  return (
    <aside className={cn('pp', className)} aria-label="Turn on push notifications">
      <BellRing aria-hidden="true" />
      <div>
        <strong>Never miss the show</strong>
        <ul>
          {benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className="pp-actions">
          <Button size="sm" onClick={onAllow}>
            Turn on
          </Button>
          <Button size="sm" variant="plain" onClick={onLater}>
            Not now
          </Button>
        </div>
      </div>
    </aside>
  )
}
