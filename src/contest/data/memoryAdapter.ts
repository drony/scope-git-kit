import { storage } from '@/kit/lib/storage'
import { audienceOf } from '../lib/audience'
import { isPending } from '../lib/ranking'
import { scoreSubmission } from '../lib/scoring'
import { renderTemplate } from '../lib/templates'
import type { ContestAdapter, UploadOptions } from './adapter'
import type {
  Announcement,
  Answer,
  AnswerKey,
  AuditEntry,
  Contest,
  ContestState,
  Id,
  MediaAsset,
  MediaKind,
  Notification,
  Participant,
  Question,
  Score,
  Submission,
} from './types'

export interface MemoryAdapterOptions {
  /** localStorage key that keeps the state between visits. `null` keeps it in memory only. */
  storageKey?: string | null
  /** Pretend network delay for every call, in ms. */
  latencyMs?: number
  /** Share of uploads (0 to 1) that fail at the end, to see the error and retry states. */
  uploadFailureRate?: number
  now?: () => Date
  /** Name written into the audit trail when a call does not pass one. */
  actor?: string
}

export type MemoryAdapter = ContestAdapter & {
  /** Throws the saved state away and starts again from the seed. */
  reset(): void
  /** Sets how many uploads fail, for demos. */
  setUploadFailureRate(rate: number): void
}

const clone = <T>(value: T): T => structuredClone(value)
const short = (text: string, n = 48) => (text.length > n ? `${text.slice(0, n - 1)}…` : text)

const kindOf = (mime: string): MediaKind =>
  mime.startsWith('image/') ? 'image' : mime.startsWith('audio/') ? 'audio' : mime.startsWith('video/') ? 'video' : 'document'

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('The file could not be read.'))
    reader.readAsDataURL(file)
  })
}

function imageSize(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = url
  })
}

const abortError = () => new DOMException('The upload was cancelled.', 'AbortError')

/**
 * A `ContestAdapter` that keeps everything in memory (and in localStorage), starting from a seed. It behaves like a
 * backend: calls are asynchronous, return copies, write an audit trail, score submissions from the answer keys, and uploads
 * report progress and can fail. Use it for demos and tests; swap in a real adapter for production.
 */
export function createMemoryAdapter(seed: ContestState, options: MemoryAdapterOptions = {}): MemoryAdapter {
  const { storageKey = 'contest.state', latencyMs = 120, now = () => new Date(), actor: defaultActor = 'Admin' } = options
  let failureRate = options.uploadFailureRate ?? 0

  const load = (): ContestState => {
    const raw = storageKey ? storage.get(storageKey) : null
    if (raw) {
      try {
        return JSON.parse(raw) as ContestState
      } catch {
        /* fall through to the seed */
      }
    }
    return clone(seed)
  }

  let state = load()
  let counter = now().getTime()
  const nextId = (prefix: string): Id => `${prefix}-${(counter++).toString(36)}`
  const iso = () => now().toISOString()
  const persist = () => {
    if (storageKey) storage.set(storageKey, JSON.stringify(state))
  }
  const wait = <T>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(clone(value)), latencyMs))

  const log = (entry: Omit<AuditEntry, 'id' | 'at' | 'actor'> & { actor?: string }) => {
    state.audit.unshift({ id: nextId('au'), at: iso(), ...entry, actor: entry.actor ?? defaultActor })
  }

  const submissionFor = (participantId: Id): Submission => {
    let sub = state.submissions.find((s) => s.participantId === participantId)
    if (!sub) {
      sub = { id: nextId('sub'), contestId: state.contest.id, participantId, startedAt: iso(), status: 'in-progress', answers: [], scores: {} }
      state.submissions.push(sub)
    }
    return sub
  }

  /** Sends an announcement now: one in-app notification per recipient, and a count per channel. */
  const send = (a: Announcement, actor?: string) => {
    const ids = audienceOf(a.audience, state.participants, state.submissions)
    const people = ids.flatMap((id) => state.participants.filter((p) => p.id === id))
    a.status = 'sent'
    a.sentAt = iso()
    a.scheduledAt = undefined
    const delivery: NonNullable<Announcement['delivery']> = {}
    for (const channel of a.channels) {
      // Push needs a device, and a person who was invited but never opened the app has none.
      const missed = channel === 'push' ? people.filter((p) => p.status === 'invited').length : 0
      delivery[channel] = { sent: people.length - missed, failed: missed, ...(missed ? { reason: 'Invited but never opened the app, so there is no device to notify.' } : {}) }
    }
    a.delivery = delivery
    if (a.channels.includes('in-app')) {
      for (const p of people) {
        const vars = { name: p.name.split(' ')[0], team: p.team ?? '', contest: state.contest.title }
        state.notifications.unshift({ id: nextId('n'), recipientId: p.id, kind: 'announcement', title: renderTemplate(a.title, vars), body: renderTemplate(a.body, vars), createdAt: a.sentAt, href: '/announcements' })
      }
    }
    log({ actor, entity: 'announcement', entityId: a.id, action: 'publish', summary: `Sent announcement "${short(a.title)}" to ${people.length} ${people.length === 1 ? 'person' : 'people'}` })
  }

  /** There is no timer here: a scheduled announcement that is due goes out the next time someone reads. */
  const sendDue = () => {
    const due = state.announcements.filter((a) => a.status === 'scheduled' && a.scheduledAt && a.scheduledAt <= iso())
    for (const a of due) send(a, 'Scheduler')
    if (due.length) persist()
  }

  const adapter: MemoryAdapter = {
    reset() {
      state = clone(seed)
      if (storageKey) storage.remove(storageKey)
    },
    setUploadFailureRate(rate) {
      failureRate = Math.min(1, Math.max(0, rate))
    },

    async getContest() {
      return wait(state.contest)
    },
    async saveContest(contest, actor) {
      const before = clone(state.contest)
      state.contest = clone(contest)
      log({ actor, entity: 'contest', entityId: contest.id, action: before.status !== contest.status && contest.status === 'live' ? 'publish' : 'update', summary: `Saved the contest "${short(contest.title)}"`, before, after: clone(contest) })
      persist()
      return wait(state.contest)
    },

    async listQuestions() {
      return wait(state.questions)
    },
    async saveQuestion(question, actor) {
      const i = state.questions.findIndex((q) => q.id === question.id)
      const before = i >= 0 ? clone(state.questions[i]) : undefined
      const saved = { ...clone(question), updatedAt: iso() } as Question
      if (i >= 0) state.questions[i] = saved
      else state.questions.push(saved)
      log({ actor, entity: 'question', entityId: saved.id, action: before ? (saved.status === 'published' && before.status !== 'published' ? 'publish' : 'update') : 'create', summary: `${before ? 'Edited' : 'Created'} question "${short(saved.prompt)}"`, before, after: clone(saved) })
      persist()
      return wait(saved)
    },
    async deleteQuestion(id, actor) {
      const question = state.questions.find((q) => q.id === id)
      if (!question) return wait(undefined)
      const before = { question: clone(question), key: clone(state.answerKeys[id] ?? null) }
      state.questions = state.questions.filter((q) => q.id !== id)
      delete state.answerKeys[id]
      state.contest.rounds.forEach((r) => (r.questionIds = r.questionIds.filter((q) => q !== id)))
      log({ actor, entity: 'question', entityId: id, action: 'delete', summary: `Deleted question "${short(question.prompt)}"`, before })
      persist()
      return wait(undefined)
    },

    async getAnswerKey(questionId) {
      return wait(state.answerKeys[questionId] ?? null)
    },
    async saveAnswerKey(questionId, key, actor) {
      const before = clone(state.answerKeys[questionId] ?? null)
      state.answerKeys[questionId] = clone(key)
      const q = state.questions.find((x) => x.id === questionId)
      log({ actor, entity: 'answer-key', entityId: questionId, action: before ? 'update' : 'create', summary: `${before ? 'Changed' : 'Set'} the answer key of "${short(q?.prompt ?? questionId)}"`, before, after: clone(key) })
      persist()
      return wait(state.answerKeys[questionId])
    },

    async listMedia() {
      return wait(state.media)
    },
    async uploadMedia(file: File, opts: UploadOptions = {}) {
      const steps = 8
      for (let i = 1; i <= steps; i++) {
        if (opts.signal?.aborted) throw abortError()
        await new Promise((r) => setTimeout(r, Math.max(30, (latencyMs * 4) / steps)))
        if (opts.signal?.aborted) throw abortError()
        opts.onProgress?.(i / steps)
      }
      if (Math.random() < failureRate) throw new Error('The upload failed (simulated network error). Try again.')
      const url = file.size <= 4 * 1024 * 1024 ? await readAsDataUrl(file) : URL.createObjectURL(file)
      const kind = kindOf(file.type)
      const size = kind === 'image' ? await imageSize(url) : null
      const asset: MediaAsset = {
        id: nextId('media'),
        kind,
        name: file.name,
        url,
        mime: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        ...(size ?? {}),
        tags: [],
        moderation: opts.uploadedBy ? 'pending' : 'approved',
        uploadedBy: opts.uploadedBy,
        createdAt: iso(),
      }
      state.media.unshift(asset)
      log({ entity: 'media', entityId: asset.id, action: 'create', summary: `Uploaded ${kind} "${short(asset.name)}"`, after: { ...asset, url: '(file)' } })
      persist()
      return wait(asset)
    },
    async updateMedia(asset, actor) {
      const i = state.media.findIndex((m) => m.id === asset.id)
      if (i < 0) throw new Error('That media file no longer exists.')
      const before = clone(state.media[i])
      state.media[i] = clone(asset)
      // The file does not change in an edit, so the history keeps the details only, not a copy of the file.
      log({ actor, entity: 'media', entityId: asset.id, action: 'update', summary: `Edited media "${short(asset.name)}"`, before: { ...before, url: '(file)' }, after: { ...clone(asset), url: '(file)' } })
      persist()
      return wait(state.media[i])
    },
    async deleteMedia(ids, actor) {
      const gone = state.media.filter((m) => ids.includes(m.id))
      state.media = state.media.filter((m) => !ids.includes(m.id))
      for (const m of gone) log({ actor, entity: 'media', entityId: m.id, action: 'delete', summary: `Deleted media "${short(m.name)}"`, before: clone(m) })
      persist()
      return wait(undefined)
    },

    async listParticipants() {
      return wait(state.participants)
    },
    async saveParticipant(participant, actor) {
      const i = state.participants.findIndex((p) => p.id === participant.id)
      const before = i >= 0 ? clone(state.participants[i]) : undefined
      if (i >= 0) state.participants[i] = clone(participant)
      else state.participants.push(clone(participant))
      const changed = before && before.status !== participant.status ? `${participant.name} is now ${participant.status}` : `Edited ${participant.name}`
      log({ actor, entity: 'participant', entityId: participant.id, action: before ? 'update' : 'create', summary: changed, before, after: clone(participant) })
      persist()
      return wait(participant)
    },
    async inviteParticipants(people, actor) {
      const known = new Set(state.participants.map((p) => p.email.toLowerCase()))
      const added: Participant[] = []
      for (const person of people) {
        const email = person.email.trim()
        if (!email || known.has(email.toLowerCase())) continue
        known.add(email.toLowerCase())
        const p: Participant = { id: nextId('p'), name: person.name.trim() || email, email, team: person.team?.trim() || undefined, status: 'invited' }
        state.participants.push(p)
        added.push(p)
      }
      if (added.length) log({ actor, entity: 'participant', entityId: added[0].id, action: 'create', summary: `Invited ${added.length} ${added.length === 1 ? 'person' : 'people'}` })
      persist()
      return wait(added)
    },

    async listSubmissions() {
      return wait(state.submissions)
    },
    async getSubmission(participantId) {
      const sub = submissionFor(participantId)
      persist()
      return wait(sub)
    },
    async saveAnswer(participantId, answer: Answer) {
      const sub = submissionFor(participantId)
      if (sub.status !== 'in-progress') throw new Error('This submission is locked.')
      const i = sub.answers.findIndex((a) => a.questionId === answer.questionId)
      if (i >= 0) sub.answers[i] = clone(answer)
      else sub.answers.push(clone(answer))
      persist()
      return wait(sub)
    },
    async submit(participantId) {
      const sub = submissionFor(participantId)
      // Questions a person has to score are only part of the submission when the participant answered them.
      const answered = new Set(sub.answers.map((a) => a.questionId))
      const questions = state.questions.filter((q) => q.status === 'published' && (state.answerKeys[q.id]?.type !== 'manual' || answered.has(q.id)))
      const results = scoreSubmission(questions, state.answerKeys, sub.answers)
      for (const [qid, r] of Object.entries(results)) {
        const score: Score = { points: r.points, max: r.max, auto: r.auto, note: r.reason }
        sub.scores[qid] = score
      }
      sub.status = Object.values(sub.scores).some(isPending) ? 'submitted' : 'reviewed'
      sub.submittedAt = iso()
      const p = state.participants.find((x) => x.id === participantId)
      if (p) p.status = 'finished'
      persist()
      return wait(sub)
    },
    async saveScore(submissionId, questionId, score, actor) {
      const sub = state.submissions.find((s) => s.id === submissionId)
      if (!sub) throw new Error('That submission no longer exists.')
      const before = clone(sub.scores[questionId] ?? null)
      sub.scores[questionId] = clone(score)
      // Once nobody has to score anything any more, the submission counts as reviewed.
      if (sub.status !== 'in-progress') sub.status = Object.values(sub.scores).some(isPending) ? 'submitted' : 'reviewed'
      log({ actor, entity: 'score', entityId: `${submissionId}:${questionId}`, action: 'update', summary: `Scored ${score.points}/${score.max} for ${state.participants.find((p) => p.id === sub.participantId)?.name ?? sub.participantId}`, before, after: clone(score) })
      persist()
      return wait(sub)
    },

    async listAnnouncements() {
      sendDue()
      return wait(state.announcements)
    },
    async saveAnnouncement(announcement, actor) {
      const i = state.announcements.findIndex((a) => a.id === announcement.id)
      const before = i >= 0 ? clone(state.announcements[i]) : undefined
      if (i >= 0) state.announcements[i] = clone(announcement)
      else state.announcements.unshift(clone(announcement))
      log({ actor, entity: 'announcement', entityId: announcement.id, action: before ? 'update' : 'create', summary: `${before ? 'Edited' : 'Drafted'} announcement "${short(announcement.title)}"`, before, after: clone(announcement) })
      persist()
      return wait(announcement)
    },
    async sendAnnouncement(id, actor) {
      const a = state.announcements.find((x) => x.id === id)
      if (!a) throw new Error('That announcement no longer exists.')
      send(a, actor)
      persist()
      return wait(a)
    },

    async listNotifications(recipientId): Promise<Notification[]> {
      sendDue()
      return wait(state.notifications.filter((n) => n.recipientId === recipientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    },
    async markNotificationsRead(ids) {
      for (const n of state.notifications) if (ids.includes(n.id) && !n.readAt) n.readAt = iso()
      persist()
      return wait(undefined)
    },

    async listAudit() {
      return wait(state.audit)
    },
    async revert(auditId, actor) {
      const entry = state.audit.find((e) => e.id === auditId)
      if (!entry) throw new Error('That history entry no longer exists.')
      const { entity, entityId, action, before } = entry

      if (entity === 'question') {
        if (action === 'create') {
          state.questions = state.questions.filter((q) => q.id !== entityId)
          delete state.answerKeys[entityId]
        } else if (action === 'delete') {
          const snap = before as { question: Question; key: AnswerKey | null }
          state.questions.push(clone(snap.question))
          if (snap.key) state.answerKeys[entityId] = clone(snap.key)
        } else if (before) {
          const i = state.questions.findIndex((q) => q.id === entityId)
          if (i >= 0) state.questions[i] = clone(before as Question)
        } else throw new Error('This entry cannot be reverted.')
      } else if (entity === 'answer-key') {
        if (before) state.answerKeys[entityId] = clone(before as AnswerKey)
        else delete state.answerKeys[entityId]
      } else if (entity === 'media') {
        if (action === 'create') state.media = state.media.filter((m) => m.id !== entityId)
        else if (action === 'delete') state.media.unshift(clone(before as MediaAsset))
        else if (before) {
          const i = state.media.findIndex((m) => m.id === entityId)
          if (i >= 0) state.media[i] = { ...clone(before as MediaAsset), url: state.media[i].url }
        } else throw new Error('This entry cannot be reverted.')
      } else if (entity === 'contest' && before) {
        state.contest = clone(before as Contest)
      } else throw new Error('This entry cannot be reverted.')

      log({ actor, entity, entityId, action: 'revert', summary: `Reverted: ${entry.summary}` })
      persist()
      return wait(undefined)
    },
  }

  return adapter
}
