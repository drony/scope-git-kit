import { useRef, useState, type KeyboardEvent } from 'react'
import { Check, Flag, Undo2, X } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { Kbd, Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Id, MediaAsset, ModerationState } from '../data/types'
import { formatBytes } from '../lib/mediaRules'
import { MediaThumb } from './MediaLibrary'

interface MediaModerationProps {
  /** All media. The wall shows those that are waiting for review or flagged. */
  assets: MediaAsset[]
  /** Called with the file and the state to give it. */
  onModerate: (asset: MediaAsset, state: ModerationState) => void
  /** Turns an uploader's id into a name for the card. Without it the card says nothing about who uploaded. */
  uploaderName?: (id: Id) => string | undefined
  className?: string
}

const IN_QUEUE: ModerationState[] = ['pending', 'flagged']

/**
 * A wall for going through uploads quickly. Move with the arrow keys, then press A to approve, R to reject, F to flag for a
 * second look, Z to take back the last decision. A decided file leaves the wall at once and the next one is selected.
 */
export function MediaModeration({ assets, onModerate, uploaderName, className }: MediaModerationProps) {
  const [decided, setDecided] = useState<Record<Id, ModerationState>>({})
  const [history, setHistory] = useState<Array<{ asset: MediaAsset; before: ModerationState }>>([])
  const [at, setAt] = useState(0)
  const grid = useRef<HTMLUListElement>(null)

  const stateOf = (a: MediaAsset) => decided[a.id] ?? a.moderation
  const queue = assets.filter((a) => IN_QUEUE.includes(stateOf(a))).sort((a, b) => Number(stateOf(a) === 'flagged') - Number(stateOf(b) === 'flagged'))
  const active = Math.min(at, Math.max(0, queue.length - 1))
  const current = queue[active]

  const decide = (asset: MediaAsset, state: ModerationState) => {
    setHistory((h) => [...h, { asset, before: stateOf(asset) }])
    setDecided((d) => ({ ...d, [asset.id]: state }))
    onModerate(asset, state)
  }
  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    setDecided((d) => ({ ...d, [last.asset.id]: last.before }))
    onModerate(last.asset, last.before)
    const i = queue.findIndex((a) => a.id === last.asset.id)
    setAt(i >= 0 ? i : at)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const columns = grid.current ? getComputedStyle(grid.current).gridTemplateColumns.split(' ').length : 1
    const move: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }
    if (e.key in move) {
      e.preventDefault()
      setAt(Math.max(0, Math.min(queue.length - 1, active + move[e.key])))
      return
    }
    const key = e.key.toLowerCase()
    if (key === 'z') return void (e.preventDefault(), undo())
    if (!current) return
    const state = key === 'a' ? 'approved' : key === 'r' ? 'rejected' : key === 'f' ? 'flagged' : null
    if (state) {
      e.preventDefault()
      decide(current, state)
    }
  }

  return (
    <div className={cn('cs-mod', className)}>
      <div className="cs-mod-head">
        <p role="status">
          <strong>{queue.length}</strong> to review
          {queue.some((a) => stateOf(a) === 'flagged') && <> · {queue.filter((a) => stateOf(a) === 'flagged').length} flagged</>}
        </p>
        <p className="cs-mod-keys">
          <Kbd>A</Kbd> approve <Kbd>R</Kbd> reject <Kbd>F</Kbd> flag <Kbd>Z</Kbd> undo
        </p>
        <Button variant="plain" size="sm" disabled={history.length === 0} onClick={undo}>
          <Undo2 aria-hidden="true" /> Undo
        </Button>
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={<Check size={20} aria-hidden="true" />} title="Everything is reviewed">
          New uploads that need a look appear here.
        </EmptyState>
      ) : (
        <ul ref={grid} className="cs-mod-wall" tabIndex={0} aria-label="Review queue. Arrow keys move between files. A approves, R rejects, F flags, Z undoes." aria-activedescendant={current ? `mod-${current.id}` : undefined} onKeyDown={onKey}>
          {queue.map((a, i) => (
            <li key={a.id} id={`mod-${a.id}`} className={cn('cs-mod-card', i === active && 'is-active', stateOf(a) === 'flagged' && 'is-flagged')} onClick={() => setAt(i)}>
              <MediaThumb asset={a} ratio={4 / 3} />
              <div className="cs-mod-meta">
                <strong title={a.name}>{a.name}</strong>
                <span>
                  {formatBytes(a.sizeBytes)}
                  {a.uploadedBy && uploaderName?.(a.uploadedBy) ? ` · from ${uploaderName(a.uploadedBy)}` : ''}
                </span>
                {stateOf(a) === 'flagged' && <Tag tone="error">Flagged</Tag>}
              </div>
              <div className="cs-mod-actions">
                <Button variant="ghost" size="sm" icon aria-label={`Approve ${a.name}`} tabIndex={-1} onClick={(e) => (e.stopPropagation(), decide(a, 'approved'))}>
                  <Check aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="sm" icon aria-label={`Flag ${a.name}`} tabIndex={-1} disabled={stateOf(a) === 'flagged'} onClick={(e) => (e.stopPropagation(), decide(a, 'flagged'))}>
                  <Flag aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="sm" icon aria-label={`Reject ${a.name}`} tabIndex={-1} onClick={(e) => (e.stopPropagation(), decide(a, 'rejected'))}>
                  <X aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
