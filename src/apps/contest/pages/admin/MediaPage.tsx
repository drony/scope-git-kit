import { useMemo, useState } from 'react'
import { Upload } from 'lucide-react'
import { Switch } from '@/kit/components/forms/Controls'
import { Modal } from '@/kit/components/overlays/Modal'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Button } from '@/kit/components/ui/Button'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { MediaLibrary } from '@/contest/components/MediaLibrary'
import { MediaModeration } from '@/contest/components/MediaModeration'
import { MediaUploader } from '@/contest/components/MediaUploader'
import { MediaViewer } from '@/contest/components/MediaViewer'
import type { Id } from '@/contest/data/types'
import { useMedia, useParticipants, useQuestions } from '@/contest/hooks/useContestData'
import { mediaUsage } from '@/contest/lib/usage'
import { adapter } from '@/apps/contest/data'

export default function MediaPage() {
  usePageTitle('Media')
  const toast = useToast()
  const media = useMedia()
  const questions = useQuestions()
  const people = useParticipants()
  const assets = media.data ?? []
  const usage = useMemo(() => mediaUsage(questions.data ?? []), [questions.data])
  const [tab, setTab] = useState<'library' | 'review'>('library')
  const [viewing, setViewing] = useState<Id | null>(null)
  const [uploading, setUploading] = useState(false)
  const [flaky, setFlaky] = useState(false)

  const index = assets.findIndex((a) => a.id === viewing)
  const current = index >= 0 ? assets[index] : undefined
  const waiting = assets.filter((a) => a.moderation === 'pending' || a.moderation === 'flagged').length
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })

  return (
    <Card>
      <CardHead
        title="Media"
        actions={
          tab === 'library' && (
            <Button size="sm" variant={uploading ? 'plain' : 'primary'} onClick={() => setUploading((v) => !v)}>
              <Upload aria-hidden="true" /> {uploading ? 'Close upload' : 'Upload'}
            </Button>
          )
        }
      />
      <Tabs
        ariaLabel="Media"
        value={tab}
        onChange={(id) => setTab(id as 'library' | 'review')}
        items={[
          { id: 'library', label: 'Library' },
          { id: 'review', label: 'Review queue', count: waiting || undefined },
        ]}
        panels={{
          library: (
            <>
              {uploading && (
                <div className="cs-upload-panel">
                  <MediaUploader accept="image/*,audio/*,video/*,application/pdf" maxMb={8} onUpload={(file, o) => media.upload(file, o)} />
                  <Switch
                    checked={flaky}
                    onChange={(on) => {
                      setFlaky(on)
                      adapter.setUploadFailureRate(on ? 0.5 : 0)
                    }}
                    label="Simulate failing uploads"
                    description="Half of the uploads fail at the end, so you can see the error and the retry button."
                  />
                </div>
              )}
              {!media.data ? (
                <div aria-busy="true">
                  <Skeleton height="14rem" radius="0.75rem" />
                </div>
              ) : (
                <MediaLibrary
                  assets={assets}
                  usage={usage}
                  onOpen={(a) => setViewing(a.id)}
                  onDelete={(list) =>
                    void media
                      .remove(list.map((a) => a.id))
                      .then(() => toast.push({ tone: 'success', title: `${list.length} file${list.length === 1 ? '' : 's'} deleted` }))
                      .catch(fail('Could not delete'))
                  }
                />
              )}
            </>
          ),
          review: !media.data ? (
            <Skeleton height="14rem" radius="0.75rem" />
          ) : (
            <MediaModeration assets={assets} uploaderName={(id) => people.data?.find((p) => p.id === id)?.name} onModerate={(asset, moderation) => void media.update({ ...asset, moderation }).catch(fail('Could not save the decision'))} />
          ),
        }}
      />
      <Modal open={Boolean(current)} onClose={() => setViewing(null)} size="lg" title="Media details">
        {current && (
          <MediaViewer
            asset={current}
            usage={usage[current.id] ?? 0}
            onPrev={index > 0 ? () => setViewing(assets[index - 1].id) : undefined}
            onNext={index < assets.length - 1 ? () => setViewing(assets[index + 1].id) : undefined}
            onSave={(a) =>
              void media
                .update(a)
                .then(() => toast.push({ tone: 'success', title: 'Media saved', key: 'media-saved' }))
                .catch(fail('Could not save'))
            }
          />
        )}
      </Modal>
    </Card>
  )
}
