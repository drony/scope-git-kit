import { useState } from 'react'
import { Megaphone, UserPlus } from 'lucide-react'
import { DataGrid } from '@/kit/components/grid/DataGrid'
import type { FilterDef, GridColumn } from '@/kit/components/grid/types'
import { Avatar } from '@/kit/components/ui/Avatar'
import { Button } from '@/kit/components/ui/Button'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import type { Id, Participant, ParticipantStatus, Submission } from '../data/types'
import { teamsOf } from '../lib/audience'

interface ParticipantTableProps {
  participants: Participant[]
  /** Adds the answers and score columns. */
  submissions?: Submission[]
  /** Called when a name is clicked. */
  onOpen: (participant: Participant) => void
  /** The person open in the drawer; the name is highlighted. */
  selectedId?: Id | null
  /** Shows an "Invite people" button. */
  onInvite?: () => void
  /** Shows a "Message them" button when rows are ticked. */
  onMessage?: (people: Participant[]) => void
  className?: string
}

const TONE: Record<ParticipantStatus, Tone> = { invited: 'neutral', active: 'accent', finished: 'success', disqualified: 'error' }
const STATUSES: ParticipantStatus[] = ['invited', 'active', 'finished', 'disqualified']

/**
 * Everyone in the contest in a searchable, sortable table: status, team, how far they got and their score. Tick rows to
 * message them together; click a name to open the person.
 */
export function ParticipantTable({ participants, submissions = [], onOpen, selectedId, onInvite, onMessage, className }: ParticipantTableProps) {
  const [checked, setChecked] = useState<string[]>([])
  const subOf = (p: Participant) => submissions.find((s) => s.participantId === p.id)
  const score = (p: Participant) => {
    const s = subOf(p)
    return s && s.status !== 'in-progress' ? Math.round(Object.values(s.scores).reduce((n, x) => n + x.points, 0) * 100) / 100 : null
  }

  const filters: FilterDef<Participant>[] = [
    { id: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })), test: (p, v) => p.status === v },
    { id: 'team', label: 'Team', options: teamsOf(participants).map((t) => ({ value: t, label: t })), test: (p, v) => p.team === v },
  ]
  const columns: GridColumn<Participant>[] = [
    {
      id: 'name',
      header: 'Participant',
      locked: true,
      minWidth: 220,
      value: (p) => p.name,
      render: (p) => (
        <button type="button" className="cs-person" aria-current={selectedId === p.id ? 'true' : undefined} onClick={() => onOpen(p)}>
          <Avatar name={p.name} size={26} />
          <span>{p.name}</span>
        </button>
      ),
    },
    { id: 'email', header: 'E-mail', value: (p) => p.email },
    { id: 'team', header: 'Team', value: (p) => p.team ?? '' },
    { id: 'status', header: 'Status', value: (p) => p.status, render: (p) => <Tag tone={TONE[p.status]}>{p.status}</Tag> },
    { id: 'answered', header: 'Answers', noSum: true, value: (p) => subOf(p)?.answers.length ?? 0 },
    { id: 'score', header: 'Score', noSum: true, value: (p) => score(p), render: (_p, v) => (v === null ? '—' : String(v)) },
  ]
  const ticked = participants.filter((p) => checked.includes(p.id))

  return (
    <div className={className}>
      <DataGrid
        title="Participants"
        storageKey="contest.participants"
        rows={participants}
        rowId={(p) => p.id}
        columns={columns}
        filters={filters}
        searchText={(p) => `${p.name} ${p.email} ${p.team ?? ''}`}
        defaultDensity="compact"
        onCheckedChange={setChecked}
        actions={
          <>
            {onMessage && ticked.length > 0 && (
              <Button variant="plain" size="sm" onClick={() => onMessage(ticked)}>
                <Megaphone aria-hidden="true" /> Message {ticked.length} {ticked.length === 1 ? 'person' : 'people'}
              </Button>
            )}
            {onInvite && (
              <Button size="sm" onClick={onInvite}>
                <UserPlus aria-hidden="true" /> Invite people
              </Button>
            )}
          </>
        }
      />
    </div>
  )
}
