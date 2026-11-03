import { useContestAdapter } from '../context/ContestContext'
import type { AnswerKey, Id, MediaAsset, Participant, Question } from '../data/types'
import { useResource } from './useResource'

/** The contest itself. */
export function useContest() {
  const api = useContestAdapter()
  return useResource(() => api.getContest())
}

export function useQuestions() {
  const api = useContestAdapter()
  const res = useResource(() => api.listQuestions())
  return {
    ...res,
    save: (q: Question, actor?: string) => res.mutate(() => api.saveQuestion(q, actor)),
    remove: (id: Id, actor?: string) => res.mutate(() => api.deleteQuestion(id, actor)),
  }
}

export function useAnswerKeys(questionIds: Id[]) {
  const api = useContestAdapter()
  const res = useResource(async () => {
    const entries = await Promise.all(questionIds.map(async (id) => [id, await api.getAnswerKey(id)] as const))
    return Object.fromEntries(entries.filter(([, key]) => key)) as Record<Id, AnswerKey>
  }, [questionIds.join('|')])
  return { ...res, save: (id: Id, key: AnswerKey, actor?: string) => res.mutate(() => api.saveAnswerKey(id, key, actor)) }
}

export function useMedia() {
  const api = useContestAdapter()
  const res = useResource(() => api.listMedia())
  return {
    ...res,
    upload: (file: File, options?: Parameters<typeof api.uploadMedia>[1]) => api.uploadMedia(file, options).then((a) => res.reload().then(() => a)),
    update: (a: MediaAsset, actor?: string) => res.mutate(() => api.updateMedia(a, actor)),
    remove: (ids: Id[], actor?: string) => res.mutate(() => api.deleteMedia(ids, actor)),
  }
}

export function useParticipants() {
  const api = useContestAdapter()
  const res = useResource(() => api.listParticipants())
  return {
    ...res,
    save: (p: Participant, actor?: string) => res.mutate(() => api.saveParticipant(p, actor)),
    invite: (people: Array<{ name: string; email: string; team?: string }>, actor?: string) => res.mutate(() => api.inviteParticipants(people, actor)),
  }
}

export function useSubmissions(pollMs = 0) {
  const api = useContestAdapter()
  const res = useResource(() => api.listSubmissions(), [], { pollMs })
  return { ...res, saveScore: (...args: Parameters<typeof api.saveScore>) => res.mutate(() => api.saveScore(...args)) }
}

/** One participant's own submission, with the calls a quiz needs. */
export function useMySubmission(participantId: Id) {
  const api = useContestAdapter()
  const res = useResource(() => api.getSubmission(participantId), [participantId])
  return {
    ...res,
    saveAnswer: (answer: Parameters<typeof api.saveAnswer>[1]) => res.mutate(() => api.saveAnswer(participantId, answer)),
    submit: () => res.mutate(() => api.submit(participantId)),
  }
}

/** The announcements. Pass `pollMs` to ask again now and then, which is also what sends scheduled ones that are due. */
export function useAnnouncements(pollMs = 0) {
  const api = useContestAdapter()
  const res = useResource(() => api.listAnnouncements(), [], { pollMs })
  return {
    ...res,
    save: (...args: Parameters<typeof api.saveAnnouncement>) => res.mutate(() => api.saveAnnouncement(...args)),
    send: (id: Id, actor?: string) => res.mutate(() => api.sendAnnouncement(id, actor)),
  }
}

/** A person's notifications. They are asked for again every few seconds, so news sent from the back office shows up. */
export function useNotifications(recipientId: Id, pollMs = 4000) {
  const api = useContestAdapter()
  const res = useResource(() => api.listNotifications(recipientId), [recipientId], { pollMs })
  return { ...res, markRead: (ids: Id[]) => res.mutate(() => api.markNotificationsRead(ids)) }
}

export function useAudit() {
  const api = useContestAdapter()
  const res = useResource(() => api.listAudit())
  return { ...res, revert: (id: Id, actor?: string) => res.mutate(() => api.revert(id, actor)) }
}
