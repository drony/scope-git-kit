import { useContestAdapter } from '../context/ContestContext'
import type { AnswerKey, Episode, Id, LiveCommand, MediaAsset, NotificationPrefs, Participant, Question, ReportDecision, ReviewAction, Survey, Topic, SurveyResponse, VersionGate, WeeklyProgram } from '../data/types'
import { useResource } from './useResource'

/** The contest itself. */
export function useContest() {
  const api = useContestAdapter()
  return useResource(() => api.getContest())
}

/**
 * The reports, the violations and the claims, with `claim`, `release` and `resolve`. Every write loads the snapshot again. `resolve`
 * resolves with the reports it closed and the violation it recorded; it rejects with a sentence when the decision is not allowed.
 */
export function useModeration(pollMs = 0) {
  const api = useContestAdapter()
  const res = useResource(() => api.getModeration(), [], { pollMs })
  return {
    ...res,
    claim: (key: string, actor?: string) => res.mutate(() => api.claimCase(key, true, actor)),
    release: (key: string, actor?: string) => res.mutate(() => api.claimCase(key, false, actor)),
    resolve: (key: string, decision: ReportDecision, actor?: string) => res.mutate(() => api.resolveCase(key, decision, actor)),
  }
}

/** The version gate in force, the one that starts later, and who uses which build. `save` rejects with a sentence when the gate is not allowed. */
export function useGate(pollMs = 0) {
  const api = useContestAdapter()
  const res = useResource(() => api.getGate(), [], { pollMs })
  return { ...res, save: (gate: VersionGate, options?: { confirmed?: boolean }, actor?: string) => res.mutate(() => api.saveGate(gate, options, actor)) }
}

/** The topics and the packs, with `publish`, `restore` and `saveTopic`. Each rejects with a sentence when it is not allowed. */
export function usePacks() {
  const api = useContestAdapter()
  const res = useResource(() => api.getPacks())
  return {
    ...res,
    publish: (request: { topics: string[]; note: string }, actor?: string) => res.mutate(() => api.publishPack(request, actor)),
    restore: (packId: Id, note: string, actor?: string) => res.mutate(() => api.restorePack(packId, note, actor)),
    saveTopic: (topic: Topic, actor?: string) => res.mutate(() => api.saveTopic(topic, actor)),
  }
}

export function useQuestions() {
  const api = useContestAdapter()
  const res = useResource(() => api.listQuestions())
  return {
    ...res,
    save: (q: Question, actor?: string) => res.mutate(() => api.saveQuestion(q, actor)),
    remove: (id: Id, actor?: string) => res.mutate(() => api.deleteQuestion(id, actor)),
    /** A review action on many questions. It resolves with what changed and what was left out, and the list reloads. */
    review: (ids: Id[], action: ReviewAction, options?: { note?: string }, actor?: string) => res.mutate(() => api.reviewQuestions(ids, action, options, actor)),
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

/** The weekly program. `save` sends a new revision: pass `confirmed` when people registered for the shows it touches. */
export function useProgram() {
  const api = useContestAdapter()
  const res = useResource(() => api.getProgram())
  return { ...res, save: (p: WeeklyProgram, options?: { confirmed?: boolean }, actor?: string) => res.mutate(() => api.saveProgram(p, options, actor)) }
}

/** How many people registered, by occurrence key (`slotId@YYYY-MM-DD`). Pass `pollMs` to see numbers change. */
export function useRegistrations(pollMs = 0) {
  const api = useContestAdapter()
  return useResource(() => api.listRegistrations(), [], { pollMs })
}

/** The weekly shows, with `save`. Pass `pollMs` to ask again now and then: that is also what sends reminders that are due. */
export function useEpisodes(pollMs = 0) {
  const api = useContestAdapter()
  const res = useResource(() => api.listEpisodes(), [], { pollMs })
  return { ...res, save: (e: Episode, actor?: string) => res.mutate(() => api.saveEpisode(e, actor)) }
}

/**
 * The live show now, or null. It asks again every `pollMs` (400 by default) and the adapter works the state up to the server's
 * clock each time, so every screen shows the same second. `send` sends a command and returns the new state.
 */
export function useLive(pollMs = 400) {
  const api = useContestAdapter()
  const res = useResource(() => api.getLive(), [], { pollMs })
  return { ...res, send: (command: LiveCommand, actor?: string) => res.mutate(() => api.sendLive(command, actor)) }
}

export function useSurveys() {
  const api = useContestAdapter()
  const res = useResource(() => api.listSurveys())
  return { ...res, save: (s: Survey, actor?: string) => res.mutate(() => api.saveSurvey(s, actor)) }
}

/** The answers to surveys. Pass a survey id for just that survey. */
export function useSurveyResponses(surveyId?: Id) {
  const api = useContestAdapter()
  const res = useResource(() => api.listSurveyResponses(surveyId), [surveyId])
  return { ...res, submit: (r: Omit<SurveyResponse, 'id' | 'at'>) => res.mutate(() => api.submitSurveyResponse(r)) }
}

/** One person's notification preferences (the defaults until they save some). */
export function usePrefs(participantId: Id) {
  const api = useContestAdapter()
  const res = useResource(() => api.getPrefs(participantId), [participantId])
  return { ...res, save: (p: NotificationPrefs) => res.mutate(() => api.savePrefs(p)) }
}
