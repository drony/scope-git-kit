import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { CircleAlert, CircleCheck, RotateCcw, Upload, X } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { MediaAsset } from '../data/types'
import { describeAccept, formatBytes, validateMediaFile, type MediaRules } from '../lib/mediaRules'

type Status = 'uploading' | 'done' | 'error' | 'cancelled'

interface QueueItem {
  id: string
  file: File
  status: Status
  progress: number
  error?: string
  asset?: MediaAsset
}

/** Sends one file. Report progress with `onProgress(0..1)` and stop when `signal` aborts. */
export type UploadHandler = (file: File, options: { onProgress: (fraction: number) => void; signal: AbortSignal }) => Promise<MediaAsset>

interface MediaUploaderProps extends Partial<MediaRules> {
  onUpload: UploadHandler
  /** Called once for every file that arrives safely. */
  onUploaded?: (asset: MediaAsset) => void
  multiple?: boolean
  /** Most files accepted in one go. */
  maxFiles?: number
  title?: string
  hint?: string
  disabled?: boolean
  className?: string
}

let counter = 0

/**
 * Drop files or browse, and watch each one upload: it checks type, size, dimensions and duration first, shows progress per
 * file, lets the person cancel a file on its way or retry one that failed, and tells them exactly why a file was refused.
 */
export function MediaUploader({
  onUpload,
  onUploaded,
  accept = 'image/*',
  maxMb = 5,
  minWidth,
  minHeight,
  maxDurationSec,
  multiple = true,
  maxFiles = 10,
  title = 'Drop files here, or click to browse',
  hint,
  disabled,
  className,
}: MediaUploaderProps) {
  const rules: MediaRules = { accept, maxMb, minWidth, minHeight, maxDurationSec }
  const inputId = useId()
  const [over, setOver] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const latest = useRef({ onUpload, onUploaded })
  latest.current = { onUpload, onUploaded }

  useEffect(() => {
    const map = controllers.current
    return () => map.forEach((c) => c.abort())
  }, [])

  const patch = (id: string, change: Partial<QueueItem>) => setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...change } : it)))

  const send = async (item: QueueItem) => {
    const controller = new AbortController()
    controllers.current.set(item.id, controller)
    patch(item.id, { status: 'uploading', progress: 0, error: undefined })
    try {
      const asset = await latest.current.onUpload(item.file, { signal: controller.signal, onProgress: (f) => patch(item.id, { progress: f }) })
      patch(item.id, { status: 'done', progress: 1, asset })
      latest.current.onUploaded?.(asset)
    } catch (e) {
      if (controller.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) patch(item.id, { status: 'cancelled' })
      else patch(item.id, { status: 'error', error: e instanceof Error ? e.message : 'The upload failed.' })
    } finally {
      controllers.current.delete(item.id)
    }
  }

  const add = async (list: FileList | File[]) => {
    const files = Array.from(list)
    const room = Math.max(0, maxFiles - queue.filter((q) => q.status !== 'cancelled').length)
    const take = multiple ? files.slice(0, room) : files.slice(0, 1)
    const problems: string[] = []
    if (files.length > take.length) problems.push(multiple ? `Only ${maxFiles} files fit; ${files.length - take.length} were left out.` : 'Only one file is allowed.')
    const ready: QueueItem[] = []
    for (const file of take) {
      const error = await validateMediaFile(file, rules)
      if (error) problems.push(error)
      else ready.push({ id: `up-${counter++}`, file, status: 'uploading', progress: 0 })
    }
    setNotice(problems.join(' ') || undefined)
    if (!ready.length) return
    setQueue((q) => (multiple ? [...q, ...ready] : ready))
    ready.forEach((item) => void send(item))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (!disabled) void add(e.dataTransfer.files)
  }

  const note = hint ?? `${describeAccept(accept)} up to ${maxMb} MB${minWidth ? `, at least ${minWidth} px wide` : ''}${multiple ? `, ${maxFiles} files at most` : ''}.`

  return (
    <div className={cn('cs-uploader', className)}>
      <label
        htmlFor={inputId}
        className={cn('dropzone', over && 'is-over', notice && 'is-error', disabled && 'is-disabled')}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <span className="dropzone-icon">
          <Upload size={18} aria-hidden="true" />
        </span>
        <strong>{title}</strong>
        <p>{note}</p>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) void add(e.target.files)
            e.target.value = ''
          }}
          style={{ display: 'block', position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      </label>
      {notice && (
        <p className="field-error" role="alert">
          {notice}
        </p>
      )}
      {queue.length > 0 && (
        <ul className="cs-queue" aria-label="Uploads">
          {queue.map((it) => (
            <li key={it.id} className={cn('cs-queue-item', `is-${it.status}`)}>
              <div className="cs-queue-main">
                <strong title={it.file.name}>{it.file.name}</strong>
                <span>{formatBytes(it.file.size)}</span>
              </div>
              {it.status === 'uploading' && (
                <div className="cs-queue-bar" role="progressbar" aria-label={`Uploading ${it.file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(it.progress * 100)}>
                  <span style={{ width: `${it.progress * 100}%` }} />
                </div>
              )}
              {it.status === 'done' && (
                <span className="cs-queue-state tone-success">
                  <CircleCheck aria-hidden="true" /> Uploaded
                </span>
              )}
              {it.status === 'cancelled' && <span className="cs-queue-state">Cancelled</span>}
              {it.status === 'error' && (
                <span className="cs-queue-state tone-error" role="alert">
                  <CircleAlert aria-hidden="true" /> {it.error}
                </span>
              )}
              <div className="cs-queue-actions">
                {it.status === 'uploading' && (
                  <Button variant="ghost" size="sm" icon aria-label={`Cancel ${it.file.name}`} onClick={() => controllers.current.get(it.id)?.abort()}>
                    <X aria-hidden="true" />
                  </Button>
                )}
                {(it.status === 'error' || it.status === 'cancelled') && (
                  <Button variant="ghost" size="sm" icon aria-label={`Try ${it.file.name} again`} onClick={() => void send(it)}>
                    <RotateCcw aria-hidden="true" />
                  </Button>
                )}
                {it.status !== 'uploading' && (
                  <Button variant="ghost" size="sm" icon aria-label={`Remove ${it.file.name} from the list`} onClick={() => setQueue((q) => q.filter((x) => x.id !== it.id))}>
                    <X aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
