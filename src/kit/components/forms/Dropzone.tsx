import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Trash2, Upload, X } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import { Button } from '@/kit/components/ui/Button'
import { useFieldProps } from './Field'

function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return urls
}

/** Returns accepted files and a message for the first rejected one. */
export function filterFiles(list: FileList | File[], accept: string, maxMb: number) {
  const accepted: File[] = []
  let error: string | undefined
  const rules = accept.split(',').map((s) => s.trim())
  for (const file of Array.from(list)) {
    const typeOk = rules.some((r) => (r.endsWith('/*') ? file.type.startsWith(r.slice(0, -1)) : file.type === r))
    if (!typeOk) error ??= `${file.name} is not a supported file type.`
    else if (file.size > maxMb * 1024 * 1024) error ??= `${file.name} is larger than ${maxMb} MB.`
    else accepted.push(file)
  }
  return { accepted, error }
}

/* ---- Multi-file dropzone with thumbnails ------------------------------------ */

interface DropzoneProps {
  value: File[]
  onChange: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxMb?: number
  maxFiles?: number
  title?: string
  hint?: string
}

export function Dropzone({
  value,
  onChange,
  accept = 'image/*',
  multiple = true,
  maxMb = 5,
  maxFiles = 8,
  title = 'Drop photos here, or click to browse',
  hint,
}: DropzoneProps) {
  const field = useFieldProps()
  const inputId = useId()
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string>()
  const urls = useObjectUrls(value)

  const add = (list: FileList | File[]) => {
    const { accepted, error: err } = filterFiles(list, accept, maxMb)
    setError(err)
    if (accepted.length) onChange(multiple ? [...value, ...accepted].slice(0, maxFiles) : accepted.slice(0, 1))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    add(e.dataTransfer.files)
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={cn('dropzone', over && 'is-over', error && 'is-error')}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <span className="dropzone-icon">
          <Upload size={18} aria-hidden="true" />
        </span>
        <strong>{title}</strong>
        <p>{hint ?? `PNG, JPG or WebP up to ${maxMb} MB${multiple ? `, ${maxFiles} files max` : ''}.`}</p>
        <input
          id={field.id ?? inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          aria-describedby={field['aria-describedby']}
          onChange={(e) => {
            if (e.target.files) add(e.target.files)
            e.target.value = ''
          }}
          style={{ display: 'block', position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      </label>
      {error && (
        <p className="field-error" role="alert" style={{ marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
      {value.length > 0 && (
        <ul className="thumbs">
          {value.map((file, i) => (
            <li className="thumb" key={`${file.name}-${file.lastModified}-${i}`}>
              <img src={urls[i]} alt={file.name} />
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onChange(value.filter((_, k) => k !== i))}>
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---- Round profile photo picker ------------------------------------------------ */

export function PhotoPicker({
  value,
  onChange,
  maxMb = 5,
}: {
  value: File | null
  onChange: (file: File | null) => void
  maxMb?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const files = useMemo(() => (value ? [value] : []), [value])
  const [url] = useObjectUrls(files)

  return (
    <div className="stack-sm">
      <div className="photo-picker">
        <div className={cn('photo-preview', url && 'has-image')}>
          {url ? <img src={url} alt="Profile preview" /> : <ImagePlus size={22} aria-hidden="true" />}
        </div>
        <div className="stack-sm">
          <div className="row">
            <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
              {value ? 'Change photo' : 'Upload photo'}
            </Button>
            {value && (
              <Button variant="plain" size="sm" onClick={() => onChange(null)}>
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
          <span className="field-hint">PNG, JPG or WebP up to {maxMb} MB.</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            const { accepted, error: err } = filterFiles([file], 'image/*', maxMb)
            setError(err)
            if (accepted[0]) onChange(accepted[0])
          }}
        />
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
