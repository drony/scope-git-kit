import { cn } from '@/kit/lib/cn'
import type { Verdict } from '../lib/gate'

interface UpdateScreenProps {
  /** What the build is told. `ok` shows nothing. */
  verdict: Verdict
  /** The message of the gate. */
  message: string
  /** Where "Update" goes. */
  updateUrl: string
  /** The build the person has, and the oldest one that may play. */
  build: number
  minBuild: number
  /** For a suggestion: called when the person closes it. Without it, a suggestion has no "Not now". */
  onClose?: () => void
  className?: string
}

/**
 * What a player sees. A required update is a full screen with one way out, the update. A stopped build says so. A suggestion is
 * a small card that can be closed. A current build sees nothing. The text comes from the gate, so it is the same on the phone.
 */
export function UpdateScreen({ verdict, message, updateUrl, build, minBuild, onClose, className }: UpdateScreenProps) {
  if (verdict === 'ok') return null
  const hard = verdict === 'required' || verdict === 'blocked'
  const title = verdict === 'blocked' ? 'This version has been stopped' : verdict === 'required' ? 'Update required' : 'A new version is ready'
  return (
    <section className={cn('gt-screen', `is-${verdict}`, hard && 'is-hard', className)} role={hard ? 'alertdialog' : 'region'} aria-label={title}>
      <h3>{title}</h3>
      <p>{message}</p>
      <small>
        Your build is {build}
        {verdict === 'required' ? `. The oldest that can play is ${minBuild}.` : verdict === 'blocked' ? '. It cannot be used any more.' : '.'}
      </small>
      <span className="gt-screen-actions">
        <a className="btn btn-primary btn-sm" href={updateUrl} target="_blank" rel="noreferrer">
          Update
        </a>
        {!hard && onClose && (
          <button type="button" className="btn btn-plain btn-sm" onClick={onClose}>
            Not now
          </button>
        )}
      </span>
    </section>
  )
}
