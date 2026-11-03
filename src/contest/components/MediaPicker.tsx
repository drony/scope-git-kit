import { useState } from 'react'
import { Modal } from '@/kit/components/overlays/Modal'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import type { Id, MediaAsset, MediaKind } from '../data/types'
import { MediaLibrary } from './MediaLibrary'
import { MediaUploader, type UploadHandler } from './MediaUploader'
import type { MediaRules } from '../lib/mediaRules'

interface MediaPickerProps extends Partial<MediaRules> {
  open: boolean
  onClose: () => void
  assets: MediaAsset[]
  usage?: Record<Id, number>
  /** Only these kinds can be chosen. */
  kinds?: MediaKind[]
  /** Choose several files. */
  multiple?: boolean
  title?: string
  /** Called with the chosen files when the person confirms. */
  onPick: (assets: MediaAsset[]) => void
  /** Adds an Upload tab. A file that uploads is chosen for the person. */
  onUpload?: UploadHandler
}

/**
 * A dialog to choose files from the library, or to upload a new one on the spot. Use it behind every "Add picture" button:
 * the question composer, an option's picture, a contest banner.
 */
export function MediaPicker({ open, onClose, assets, usage, kinds, multiple = false, title = 'Choose media', onPick, onUpload, ...rules }: MediaPickerProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [chosen, setChosen] = useState<Id[]>([])
  const done = (ids: Id[]) => {
    const picked = ids.map((id) => assets.find((a) => a.id === id)).filter((a): a is MediaAsset => Boolean(a))
    setChosen([])
    setTab('library')
    onPick(picked)
  }
  const close = () => {
    setChosen([])
    setTab('library')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={title}
      actions={
        <>
          <Button variant="plain" onClick={close}>
            Cancel
          </Button>
          <Button disabled={chosen.length === 0} onClick={() => done(chosen)}>
            {chosen.length > 1 ? `Use ${chosen.length} files` : 'Use this file'}
          </Button>
        </>
      }
    >
      <div className="cs-picker">
        {onUpload && (
          <Segmented<'library' | 'upload'>
            ariaLabel="Where from"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'library', label: 'Library' },
              { value: 'upload', label: 'Upload new' },
            ]}
          />
        )}
        {tab === 'library' || !onUpload ? (
          <MediaLibrary assets={assets} usage={usage} kinds={kinds} selected={chosen} onSelectedChange={setChosen} maxSelect={multiple ? undefined : 1} />
        ) : (
          <MediaUploader
            {...rules}
            accept={rules.accept ?? (kinds ? kinds.map((k) => (k === 'document' ? 'application/pdf' : `${k}/*`)).join(',') : 'image/*')}
            multiple={multiple}
            onUpload={onUpload}
            onUploaded={(a) => {
              setChosen((c) => (multiple ? [...c, a.id] : [a.id]))
              setTab('library')
            }}
          />
        )}
      </div>
    </Modal>
  )
}
