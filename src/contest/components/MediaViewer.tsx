import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react'
import { Field, Input, Textarea } from '@/kit/components/forms/Field'
import { Lightbox } from '@/kit/components/media/Gallery'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { MediaAsset } from '../data/types'
import { formatBytes, formatDuration } from '../lib/mediaRules'
import { CroppedImage } from './CroppedImage'
import { ImageCropper, type CropValue } from './ImageCropper'
import { currentCrop } from '../lib/crop'

interface MediaViewerProps {
  asset: MediaAsset
  /** How many questions use the file. */
  usage?: number
  /** Shows the edit fields and a Save button. Without it the viewer only shows. */
  onSave?: (asset: MediaAsset) => void
  onPrev?: () => void
  onNext?: () => void
  className?: string
}

const rows = (a: MediaAsset, usage?: number): Array<[string, string]> =>
  [
    ['Type', a.mime],
    ['Size', formatBytes(a.sizeBytes)],
    a.width && a.height ? (['Dimensions', `${a.width} × ${a.height} px`] as [string, string]) : null,
    a.durationSec ? (['Length', formatDuration(a.durationSec)] as [string, string]) : null,
    ['Added', new Date(a.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })],
    usage !== undefined ? (['Used in', `${usage} question${usage === 1 ? '' : 's'}`] as [string, string]) : null,
  ].filter((r): r is [string, string] => Boolean(r))

/**
 * One file in full: the picture (click to enlarge), a player for sound and video, a reader for PDFs, and the file's
 * details. With `onSave` you can also write its description, caption and tags, and crop a picture and set its focal point.
 */
export function MediaViewer({ asset, usage, onSave, onPrev, onNext, className }: MediaViewerProps) {
  const [draft, setDraft] = useState(asset)
  const [tab, setTab] = useState<'details' | 'crop'>('details')
  const [zoom, setZoom] = useState<number | null>(null)

  // Saved values replace the draft; a different file also starts on the details tab.
  useEffect(() => setDraft(asset), [asset])
  useEffect(() => setTab('details'), [asset.id])

  const dirty = JSON.stringify(draft) !== JSON.stringify(asset)
  const crop: CropValue = currentCrop(draft)
  const isImage = asset.kind === 'image'
  const isPdf = asset.mime === 'application/pdf'

  return (
    <div className={cn('cs-viewer', className)}>
      <div className="cs-viewer-stage">
        {isImage && (
          <button type="button" className="cs-viewer-zoom" aria-label="Enlarge picture" onClick={() => setZoom(0)}>
            <CroppedImage asset={draft} alt={draft.alt ?? asset.name} />
            <span aria-hidden="true">
              <Maximize2 size={14} />
            </span>
          </button>
        )}
        {asset.kind === 'audio' && <audio src={asset.url} controls aria-label={asset.name} />}
        {asset.kind === 'video' && <video src={asset.url} controls aria-label={asset.name} />}
        {asset.kind === 'document' &&
          (isPdf ? (
            <object data={asset.url} type="application/pdf" aria-label={asset.name}>
              <a href={asset.url} download={asset.name}>
                Download {asset.name}
              </a>
            </object>
          ) : (
            <a className="btn btn-plain" href={asset.url} download={asset.name}>
              <Download aria-hidden="true" /> Download {asset.name}
            </a>
          ))}
        {(onPrev || onNext) && (
          <div className="cs-viewer-nav">
            <Button variant="plain" size="sm" icon aria-label="Previous file" disabled={!onPrev} onClick={onPrev}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button variant="plain" size="sm" icon aria-label="Next file" disabled={!onNext} onClick={onNext}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="cs-viewer-side">
        <h3 title={asset.name}>{asset.name}</h3>
        {onSave && isImage && (
          <Segmented<'details' | 'crop'>
            ariaLabel="What to edit"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'details', label: 'Details' },
              { value: 'crop', label: 'Crop & focus' },
            ]}
          />
        )}

        {tab === 'crop' && onSave ? (
          <ImageCropper asset={draft} value={crop} onChange={(v) => setDraft({ ...draft, transform: v.transform, focal: v.focal })} />
        ) : (
          <>
            <dl className="cs-viewer-facts">
              {rows(asset, usage).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {onSave ? (
              <div className="cs-viewer-form">
                <Field label="Description" hint="Read aloud to people who cannot see the picture.">
                  <Input value={draft.alt ?? ''} onChange={(e) => setDraft({ ...draft, alt: e.target.value || undefined })} />
                </Field>
                <Field label="Caption" optional>
                  <Textarea rows={2} value={draft.caption ?? ''} onChange={(e) => setDraft({ ...draft, caption: e.target.value || undefined })} />
                </Field>
                <Field label="Tags" optional hint="Separate with commas.">
                  <Input value={draft.tags.join(', ')} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
                </Field>
              </div>
            ) : (
              <>
                {asset.alt && <p>{asset.alt}</p>}
                {asset.tags.length > 0 && (
                  <div className="cs-viewer-tags">
                    {asset.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {onSave && (
          <div className="cs-viewer-actions">
            <Button variant="plain" disabled={!dirty} onClick={() => setDraft(asset)}>
              Discard
            </Button>
            <Button disabled={!dirty} onClick={() => onSave(draft)}>
              Save changes
            </Button>
          </div>
        )}
      </div>

      {isImage && <Lightbox items={[{ src: asset.url, alt: asset.alt ?? asset.name, caption: asset.caption }]} index={zoom} onIndexChange={setZoom} />}
    </div>
  )
}
