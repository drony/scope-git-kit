import { useMemo, useState, type ReactNode } from 'react'
import { FileText, Film, LayoutGrid, List, Music, Search, Trash2, X } from 'lucide-react'
import { Input } from '@/kit/components/forms/Field'
import { Modal } from '@/kit/components/overlays/Modal'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import { Chip, Tag, type Tone } from '@/kit/components/ui/Badge'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { Id, MediaAsset, MediaKind, ModerationState } from '../data/types'
import { formatBytes, formatDuration } from '../lib/mediaRules'
import { CroppedImage } from './CroppedImage'

interface MediaLibraryProps {
  assets: MediaAsset[]
  /** How many questions use each file, by id. Shown on the card, and warned about before a delete. */
  usage?: Record<Id, number>
  /** The chosen files. Leave out to let the library keep the choice itself. */
  selected?: Id[]
  onSelectedChange?: (ids: Id[]) => void
  /** 1 picks a single file: choosing another replaces the choice. */
  maxSelect?: number
  /** Only these kinds are listed. */
  kinds?: MediaKind[]
  /** Click on a file. Without it, clicking a file chooses it. */
  onOpen?: (asset: MediaAsset) => void
  /** Shows the delete button for the chosen files, after a confirmation. */
  onDelete?: (assets: MediaAsset[]) => void
  /** Extra buttons on the right of the toolbar, e.g. an Upload button. */
  actions?: ReactNode
  className?: string
}

const KIND_LABEL: Record<MediaKind, string> = { image: 'Images', audio: 'Audio', video: 'Video', document: 'Files' }
const MODERATION: Record<ModerationState, { tone: Tone; label: string } | null> = {
  approved: null,
  pending: { tone: 'warning', label: 'Waiting for review' },
  flagged: { tone: 'error', label: 'Flagged' },
  rejected: { tone: 'error', label: 'Rejected' },
}

const dimensions = (a: MediaAsset) => (a.width && a.height ? `${a.width}×${a.height}` : a.durationSec ? formatDuration(a.durationSec) : '')
const meta = (a: MediaAsset) => [formatBytes(a.sizeBytes), dimensions(a)].filter(Boolean).join(' · ')

/** The picture, or an icon for sound, video and documents. */
export function MediaThumb({ asset, ratio = 4 / 3 }: { asset: MediaAsset; ratio?: number }) {
  if (asset.kind === 'image') return <CroppedImage asset={asset} ratio={ratio} alt="" />
  const Icon = asset.kind === 'audio' ? Music : asset.kind === 'video' ? Film : FileText
  return (
    <div className="cs-media-icon" style={{ aspectRatio: ratio }}>
      <Icon aria-hidden="true" />
    </div>
  )
}

/**
 * All uploaded files in a grid or a list, with search, kind and tag filters, multiple choice, and a bulk delete that tells
 * you how many questions would lose a picture. It shows and chooses; uploading, viewing and deleting are up to the page,
 * through `onOpen`, `onDelete` and `actions`.
 */
export function MediaLibrary({ assets, usage = {}, selected, onSelectedChange, maxSelect, kinds, onOpen, onDelete, actions, className }: MediaLibraryProps) {
  const [own, setOwn] = useState<Id[]>([])
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<MediaKind | 'all'>('all')
  const [tags, setTags] = useState<string[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [asking, setAsking] = useState(false)
  const chosen = selected ?? own
  const selectable = Boolean(onSelectedChange || onDelete || selected)
  const setChosen = (ids: Id[]) => {
    setOwn(ids)
    onSelectedChange?.(ids)
  }

  const pool = useMemo(() => assets.filter((a) => !kinds || kinds.includes(a.kind)), [assets, kinds])
  const presentKinds = useMemo(() => [...new Set(pool.map((a) => a.kind))], [pool])
  const allTags = useMemo(() => [...new Set(pool.flatMap((a) => a.tags))].sort(), [pool])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pool.filter((a) => (kind === 'all' || a.kind === kind) && tags.every((t) => a.tags.includes(t)) && (!q || `${a.name} ${a.alt ?? ''} ${a.caption ?? ''} ${a.tags.join(' ')}`.toLowerCase().includes(q)))
  }, [pool, query, kind, tags])

  const toggle = (id: Id) => {
    if (chosen.includes(id)) return setChosen(chosen.filter((c) => c !== id))
    if (maxSelect === 1) return setChosen([id])
    if (maxSelect && chosen.length >= maxSelect) return
    setChosen([...chosen, id])
  }
  const chosenAssets = chosen.map((id) => assets.find((a) => a.id === id)).filter((a): a is MediaAsset => Boolean(a))
  const inUse = chosenAssets.filter((a) => (usage[a.id] ?? 0) > 0)
  const filtered = query !== '' || kind !== 'all' || tags.length > 0

  return (
    <div className={cn('cs-library', className)}>
      <div className="cs-library-bar">
        <div className="cs-library-search">
          <Input icon={<Search size={16} aria-hidden="true" />} type="search" value={query} placeholder="Search name, tag or description" aria-label="Search media" onChange={(e) => setQuery(e.target.value)} />
        </div>
        {presentKinds.length > 1 && (
          <Segmented<MediaKind | 'all'> ariaLabel="Kind of file" value={kind} onChange={setKind} options={[{ value: 'all', label: 'All' }, ...presentKinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))]} />
        )}
        <Segmented<'grid' | 'list'>
          ariaLabel="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'grid', label: <span className="cs-sr">Grid</span>, icon: <LayoutGrid size={15} aria-hidden="true" /> },
            { value: 'list', label: <span className="cs-sr">List</span>, icon: <List size={15} aria-hidden="true" /> },
          ]}
        />
        {actions}
      </div>

      {allTags.length > 0 && (
        <div className="cs-library-tags" role="group" aria-label="Filter by tag">
          {allTags.map((t) => (
            <Chip key={t} pressed={tags.includes(t)} onClick={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}>
              {t}
            </Chip>
          ))}
        </div>
      )}

      {selectable && chosen.length > 0 && (
        <div className="cs-library-selection" role="status">
          <strong>{chosen.length} selected</strong>
          <Button variant="ghost" size="sm" onClick={() => setChosen([])}>
            <X aria-hidden="true" /> Clear
          </Button>
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => setAsking(true)}>
              <Trash2 aria-hidden="true" /> Delete
            </Button>
          )}
        </div>
      )}

      <p className="cs-library-count" role="status">
        {shown.length === pool.length ? `${pool.length} file${pool.length === 1 ? '' : 's'}` : `${shown.length} of ${pool.length} files`}
      </p>

      {shown.length === 0 ? (
        <EmptyState
          title={filtered ? 'Nothing matches' : 'No media yet'}
          action={
            filtered && (
              <Button
                variant="plain"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setKind('all')
                  setTags([])
                }}
              >
                Clear filters
              </Button>
            )
          }
        >
          {filtered ? 'Try another word, or remove a filter.' : 'Uploaded pictures, sounds and videos appear here.'}
        </EmptyState>
      ) : (
        <ul className={cn('cs-media', view === 'list' ? 'is-list' : 'is-grid')}>
          {shown.map((a) => {
            const picked = chosen.includes(a.id)
            const used = usage[a.id] ?? 0
            const mod = MODERATION[a.moderation]
            return (
              <li key={a.id} className={cn('cs-media-card', picked && 'is-picked')}>
                <button type="button" className="cs-media-open" aria-label={`${onOpen ? 'Open' : picked ? 'Remove' : 'Choose'} ${a.name}`} aria-pressed={onOpen ? undefined : picked} onClick={() => (onOpen ? onOpen(a) : toggle(a.id))}>
                  <MediaThumb asset={a} ratio={view === 'list' ? 1 : 4 / 3} />
                </button>
                {selectable && onOpen && (
                  <label className="cs-media-pick">
                    <input type="checkbox" checked={picked} onChange={() => toggle(a.id)} aria-label={`Select ${a.name}`} />
                  </label>
                )}
                {selectable && !onOpen && picked && <span className="cs-media-tick" aria-hidden="true" />}
                <div className="cs-media-meta">
                  <strong title={a.name}>{a.name}</strong>
                  <span>{meta(a)}</span>
                </div>
                <div className="cs-media-flags">
                  {mod && <Tag tone={mod.tone}>{mod.label}</Tag>}
                  {used > 0 ? <Tag tone="accent">{`Used in ${used} question${used === 1 ? '' : 's'}`}</Tag> : <span className="cs-media-unused">Not used</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title={`Delete ${chosen.length} file${chosen.length === 1 ? '' : 's'}?`}
        description={inUse.length > 0 ? `${inUse.length} of them ${inUse.length === 1 ? 'is' : 'are'} used in questions. Those questions will lose the file.` : 'You cannot undo this.'}
        actions={
          <>
            <Button variant="plain" onClick={() => setAsking(false)}>
              Keep them
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setAsking(false)
                onDelete?.(chosenAssets)
                setChosen([])
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  )
}
