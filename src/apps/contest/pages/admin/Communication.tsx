import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Megaphone, Plus, Smartphone, Bell } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { SplitPane } from '@/kit/components/ui/SplitPane'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AnnouncementComposer } from '@/contest/components/AnnouncementComposer'
import { ChannelPreview } from '@/contest/components/ChannelPreview'
import { DeliveryStatus } from '@/contest/components/DeliveryStatus'
import type { Announcement, Channel, Id } from '@/contest/data/types'
import { useAnnouncements, useContest, useParticipants, useSubmissions } from '@/contest/hooks/useContestData'
import { describeAudience } from '@/contest/lib/audience'
import { dayLabel, timeLabel } from '@/contest/lib/dates'

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const TONE: Record<Announcement['status'], Tone> = { draft: 'neutral', scheduled: 'warning', sent: 'success' }
const ICON: Record<Channel, typeof Bell> = { 'in-app': Bell, email: Mail, push: Smartphone }

export default function Communication() {
  usePageTitle('Announcements')
  const toast = useToast()
  const announcements = useAnnouncements(5000)
  const { data: contest } = useContest()
  const { data: people = [] } = useParticipants()
  const { data: submissions = [] } = useSubmissions()
  const list = announcements.data
  const location = useLocation()
  const navigate = useNavigate()
  const [openId, setOpenId] = useState<Id | null>(null)
  const [draft, setDraft] = useState<Announcement | null>(null)

  const saved = list?.find((a) => a.id === openId)
  const dirty = Boolean(draft) && !same(draft, saved)
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })
  const open = (a: Announcement) => {
    setOpenId(a.id)
    setDraft(structuredClone(a))
  }
  const fresh = (): Announcement => ({
    id: `an${Math.max(0, ...(list ?? []).map((a) => Number(a.id.slice(2)) || 0)) + 1}`,
    title: '',
    body: '',
    audience: { kind: 'all' },
    channels: ['in-app'],
    pinned: false,
    status: 'draft',
  })

  // "Message them" in the participants table arrives here with the chosen people: start a new announcement for them.
  const chosen = (location.state as { audienceIds?: Id[] } | null)?.audienceIds
  useEffect(() => {
    if (!chosen?.length || !list) return
    const a = fresh()
    open({ ...a, audience: { kind: 'people', ids: chosen } })
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen?.join('|'), Boolean(list)])

  const order = (a: Announcement) => (a.status === 'sent' ? 1 : 0)
  const sorted = [...(list ?? [])].sort((a, b) => order(a) - order(b) || (b.sentAt ?? b.scheduledAt ?? '').localeCompare(a.sentAt ?? a.scheduledAt ?? ''))

  const save = async () => {
    if (!draft) return
    try {
      await announcements.save(draft)
      toast.push({ tone: 'success', title: draft.status === 'scheduled' ? 'Announcement scheduled' : 'Draft saved', key: 'comm-saved' })
    } catch (e) {
      fail('Could not save')(e)
    }
  }
  const sendNow = async () => {
    if (!draft) return
    try {
      await announcements.save({ ...draft, status: 'draft', scheduledAt: undefined })
      const sent = await announcements.send(draft.id)
      setDraft(structuredClone(sent))
      toast.push({ tone: 'success', title: 'Announcement sent', description: 'People with the app open see it in their bell within seconds.' })
    } catch (e) {
      fail('Could not send')(e)
    }
  }

  return (
    <div className="cs-comm">
      <Card>
        <CardHead
          title="Announcements"
          actions={
            <Button size="sm" onClick={() => open(fresh())}>
              <Plus aria-hidden="true" /> New announcement
            </Button>
          }
        />
        {!list ? (
          <Skeleton height="8rem" radius="0.75rem" />
        ) : sorted.length === 0 ? (
          <EmptyState icon={<Megaphone size={20} aria-hidden="true" />} title="Nothing written yet" />
        ) : (
          <ul className="cs-comm-list">
            {sorted.map((a) => (
              <li key={a.id}>
                <button type="button" aria-current={a.id === openId ? 'true' : undefined} onClick={() => open(a)}>
                  <span className="cs-comm-title">{a.title || <em>Untitled announcement</em>}</span>
                  <Tag tone={TONE[a.status]}>{a.status}</Tag>
                  <span className="cs-comm-meta">{describeAudience(a.audience)}</span>
                  <span className="cs-comm-icons">
                    {a.channels.map((c) => {
                      const Icon = ICON[c]
                      return <Icon key={c} aria-label={c} size={14} />
                    })}
                  </span>
                  <span className="cs-comm-meta">{a.sentAt ? `Sent ${dayLabel(a.sentAt)}` : a.scheduledAt ? `${dayLabel(a.scheduledAt)} ${timeLabel(a.scheduledAt)}` : 'Not sent'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {draft ? (
        <Card className="cs-editor">
          <CardHead
            title={draft.title || 'New announcement'}
            actions={
              draft.status !== 'sent' && (
                <>
                  <Button variant="plain" size="sm" onClick={() => (saved ? open(saved) : (setDraft(null), setOpenId(null)))}>
                    {saved ? 'Discard changes' : 'Discard'}
                  </Button>
                  <Button size="sm" disabled={!dirty} onClick={() => void save()}>
                    Save
                  </Button>
                </>
              )
            }
          />
          <SplitPane
            storageKey="contest.comm"
            label="Resize the editor and the preview"
            initial={0.55}
            start={<AnnouncementComposer value={draft} onChange={setDraft} participants={people} submissions={submissions} onSend={() => void sendNow()} />}
            end={
              <div className="cs-comm-side">
                {draft.status === 'sent' && (
                  <section>
                    <h4>Delivery</h4>
                    <DeliveryStatus delivery={draft.delivery} />
                  </section>
                )}
                <section>
                  <h4>How it looks</h4>
                  <ChannelPreview title={draft.title} body={draft.body} channels={draft.channels} contest={contest?.title} />
                </section>
              </div>
            }
          />
        </Card>
      ) : (
        <Card>
          <EmptyState icon={<Megaphone size={20} aria-hidden="true" />} title="Pick an announcement, or write a new one">
            Choose who gets it, which channels carry it, and see each channel's preview before you send.
          </EmptyState>
        </Card>
      )}
    </div>
  )
}
