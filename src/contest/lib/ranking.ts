/**
 * Rankings. Ties share a rank and the next rank is skipped (1, 2, 2, 4), as in most sports. Pure functions: the
 * leaderboard, the podium and the results page all rank the same way.
 */
import type { Id, Participant, Score, Submission } from '../data/types'

export interface RankedRow {
  id: Id
  name: string
  team?: string
  points: number
  max: number
  rank: number
  /** Answers still waiting for a person to score them. */
  pending: number
}

export interface TeamRow {
  team: string
  /** Average points of the members, so a big team has no edge. */
  points: number
  max: number
  members: number
  rank: number
}

const round2 = (n: number) => Math.round(n * 100) / 100
export const isPending = (score: Score): boolean => !score.auto && !score.reviewer

/** Gives each row its rank. `rows` must already be sorted, best first. */
function withRanks<T extends { points: number }>(rows: T[]): Array<T & { rank: number }> {
  const out: Array<T & { rank: number }> = []
  rows.forEach((row, i) => out.push({ ...row, rank: i > 0 && rows[i - 1].points === row.points ? out[i - 1].rank : i + 1 }))
  return out
}

/** Everyone who has submitted, best first. People who are disqualified or still answering are not ranked. */
export function rankParticipants(participants: Participant[], submissions: Submission[]): RankedRow[] {
  const rows = participants.flatMap((p) => {
    const sub = submissions.find((s) => s.participantId === p.id)
    if (p.status === 'disqualified' || !sub || sub.status === 'in-progress') return []
    const scores = Object.values(sub.scores)
    return [
      {
        id: p.id,
        name: p.name,
        team: p.team,
        points: round2(scores.reduce((sum, s) => sum + s.points, 0)),
        max: scores.reduce((sum, s) => sum + s.max, 0),
        pending: scores.filter(isPending).length,
      },
    ]
  })
  rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  return withRanks(rows)
}

/** Teams ranked by the average of their ranked members. */
export function rankTeams(rows: RankedRow[]): TeamRow[] {
  const byTeam = new Map<string, RankedRow[]>()
  for (const r of rows) if (r.team) byTeam.set(r.team, [...(byTeam.get(r.team) ?? []), r])
  const teams = [...byTeam].map(([team, members]) => ({
    team,
    points: round2(members.reduce((s, m) => s + m.points, 0) / members.length),
    max: Math.max(...members.map((m) => m.max)),
    members: members.length,
  }))
  teams.sort((a, b) => b.points - a.points || a.team.localeCompare(b.team))
  return withRanks(teams)
}

/** How many places each person moved between two rankings: positive is up, 0 is the same, missing is new. */
export function rankChanges(before: Array<{ id: Id; rank: number }>, after: Array<{ id: Id; rank: number }>): Record<Id, number> {
  const was = new Map(before.map((r) => [r.id, r.rank]))
  return Object.fromEntries(after.flatMap((r) => (was.has(r.id) ? [[r.id, was.get(r.id)! - r.rank]] : [])))
}
