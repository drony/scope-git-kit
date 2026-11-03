import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { InviteDialog } from '@/contest/components/InviteDialog'
import { ParticipantDrawer } from '@/contest/components/ParticipantDrawer'
import { ParticipantTable } from '@/contest/components/ParticipantTable'
import type { Id } from '@/contest/data/types'
import { useParticipants, useSubmissions } from '@/contest/hooks/useContestData'
import { rankParticipants } from '@/contest/lib/ranking'

export default function Participants() {
  usePageTitle('Participants')
  const toast = useToast()
  const navigate = useNavigate()
  const people = useParticipants()
  const subs = useSubmissions()
  const [openId, setOpenId] = useState<Id | null>(null)
  const [inviting, setInviting] = useState(false)

  const list = people.data
  const submissions = useMemo(() => subs.data ?? [], [subs.data])
  const open = list?.find((p) => p.id === openId) ?? null
  const ranking = useMemo(() => rankParticipants(list ?? [], submissions), [list, submissions])
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })

  return (
    <Card flush>
      {!list ? (
        <div aria-busy="true">
          <Skeleton height="16rem" radius="0.75rem" />
        </div>
      ) : (
        <ParticipantTable
          participants={list}
          submissions={submissions}
          selectedId={openId}
          onOpen={(p) => setOpenId(p.id)}
          onInvite={() => setInviting(true)}
          onMessage={(chosen) => navigate('/admin/communication', { state: { audienceIds: chosen.map((p) => p.id) } })}
        />
      )}

      <ParticipantDrawer
        participant={open}
        submission={submissions.find((s) => s.participantId === openId)}
        rank={ranking.find((r) => r.id === openId)?.rank}
        onClose={() => setOpenId(null)}
        onSave={(p) =>
          void people
            .save(p)
            .then(() => toast.push({ tone: 'success', title: 'Participant saved', key: 'participant-saved' }))
            .catch(fail('Could not save'))
        }
        onReview={(s) => navigate(`/admin/submissions?sub=${s.id}`)}
      />

      <InviteDialog
        open={inviting}
        onClose={() => setInviting(false)}
        existingEmails={(list ?? []).map((p) => p.email)}
        onInvite={async (chosen) => {
          const added = await people.invite(chosen)
          toast.push({ tone: 'success', title: `${added.length} ${added.length === 1 ? 'person' : 'people'} invited` })
        }}
      />
    </Card>
  )
}
