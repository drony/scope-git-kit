/**
 * Who an announcement reaches. Pure functions, so the composer's "reaches N people" counter and the backend that actually
 * sends agree by construction.
 */
import type { Audience, Id, Participant, Submission } from '../data/types'

export type Segment = Extract<Audience, { kind: 'segment' }>['segment']

export const SEGMENTS: Array<{ value: Segment; label: string; description: string }> = [
  { value: 'not-started', label: 'Not started yet', description: 'People who have not answered anything.' },
  { value: 'in-progress', label: 'In progress', description: 'People who started but did not submit.' },
  { value: 'finished', label: 'Finished', description: 'People who submitted their answers.' },
  { value: 'team', label: 'One team', description: 'Everyone in a team you choose.' },
]

/** The ids of the people an audience contains. Disqualified people are never reached. */
export function audienceOf(audience: Audience, participants: Participant[], submissions: Submission[]): Id[] {
  const active = participants.filter((p) => p.status !== 'disqualified')
  switch (audience.kind) {
    case 'all':
      return active.map((p) => p.id)
    case 'people':
      return active.filter((p) => audience.ids.includes(p.id)).map((p) => p.id)
    case 'segment':
      return active
        .filter((p) => {
          const sub = submissions.find((s) => s.participantId === p.id)
          if (audience.segment === 'team') return Boolean(audience.team) && p.team === audience.team
          if (audience.segment === 'not-started') return !sub || sub.answers.length === 0
          if (audience.segment === 'in-progress') return sub?.status === 'in-progress' && sub.answers.length > 0
          return sub?.status === 'submitted' || sub?.status === 'reviewed'
        })
        .map((p) => p.id)
  }
}

/** The audience in words, for lists and previews: "Everyone", "Team Comets", "3 people". */
export function describeAudience(audience: Audience): string {
  switch (audience.kind) {
    case 'all':
      return 'Everyone'
    case 'people':
      return `${audience.ids.length} ${audience.ids.length === 1 ? 'person' : 'people'}`
    case 'segment':
      return audience.segment === 'team' ? (audience.team ? `Team ${audience.team}` : 'One team') : SEGMENTS.find((s) => s.value === audience.segment)!.label
  }
}

/** The distinct team names of a group of people, sorted. */
export const teamsOf = (participants: Participant[]): string[] => [...new Set(participants.flatMap((p) => (p.team ? [p.team] : [])))].sort()
