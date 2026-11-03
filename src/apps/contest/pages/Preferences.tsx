import { useEffect, useState } from 'react'
import { ME } from '@/apps/contest/data'
import { PageBar } from '@/kit/components/nav/PageBar'
import { Button } from '@/kit/components/ui/Button'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { NotificationPreferences } from '@/contest/components/NotificationPreferences'
import { PushPrimer } from '@/contest/components/PushPrimer'
import type { NotificationPrefs } from '@/contest/data/types'
import { usePrefs } from '@/contest/hooks/useContestData'

export default function Preferences() {
  usePageTitle('Notifications')
  const toast = useToast()
  const prefs = usePrefs(ME)
  const [draft, setDraft] = useState<NotificationPrefs | null>(null)
  const [primer, setPrimer] = useState(true)
  useEffect(() => {
    if (prefs.data && !draft) setDraft(structuredClone(prefs.data))
  }, [prefs.data, draft])
  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs.data)

  return (
    <>
      <PageBar eyebrow="Your account" title="Notifications">
        <p className="lead">Choose what reaches you, and when. Quiet hours hold push and e-mail back; the bell in the app never stops.</p>
      </PageBar>
      <div className="container cs-news">
        {!draft ? (
          <Skeleton height="14rem" radius="0.75rem" />
        ) : (
          <>
            {primer && <PushPrimer onAllow={() => { setPrimer(false); toast.push({ tone: 'info', title: 'Push is on in this demo', description: 'A real app would now ask the browser for permission.' }) }} onLater={() => setPrimer(false)} />}
            <Card>
              <CardHead
                title="What reaches you"
                actions={
                  <Button
                    size="sm"
                    disabled={!dirty}
                    onClick={() =>
                      void prefs
                        .save(draft)
                        .then(() => toast.push({ tone: 'success', title: 'Preferences saved', key: 'prefs-saved' }))
                        .catch((e: unknown) => toast.push({ tone: 'error', title: 'Could not save', description: e instanceof Error ? e.message : undefined }))
                    }
                  >
                    Save
                  </Button>
                }
              />
              <NotificationPreferences value={draft} onChange={setDraft} />
            </Card>
          </>
        )}
      </div>
    </>
  )
}
