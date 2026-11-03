import { ME } from '@/apps/contest/data'
import { PollCard } from '@/contest/components/PollCard'
import type { LiveState } from '@/contest/data/types'
import { useSurveyResponses, useSurveys } from '@/contest/hooks/useContestData'
import type { LiveContext } from '@/contest/lib/live'

/** The poll of the slot on stage: Kai votes with one tap, then sees how everyone voted. */
export function LivePoll({ live, ctx }: { live: LiveState; ctx: LiveContext }) {
  const slot = ctx.episode.slots[live.index]
  const surveyId = slot?.kind === 'poll' ? slot.surveyId : ''
  const surveys = useSurveys()
  const responses = useSurveyResponses(surveyId)
  const survey = surveys.data?.find((s) => s.id === surveyId)
  const q = survey?.questions[0]
  if (!survey || !q) return null
  const mine = responses.data?.find((r) => r.participantId === ME && r.episodeId === ctx.episode.id)
  const counts: Record<string, number> = {}
  for (const r of responses.data ?? []) if (r.episodeId === ctx.episode.id && typeof r.answers[q.id] === 'string') counts[r.answers[q.id] as string] = (counts[r.answers[q.id] as string] ?? 0) + 1
  return <PollCard survey={survey} voted={mine ? (mine.answers[q.id] as string) : undefined} counts={counts} onVote={(option) => void responses.submit({ surveyId, episodeId: ctx.episode.id, participantId: ME, answers: { [q.id]: option } })} />
}
