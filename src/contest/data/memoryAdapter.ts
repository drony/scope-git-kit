import { storage } from '@/kit/lib/storage'
import { audienceOf } from '../lib/audience'
import { episodeResultOf, liveReduce, openLobby, tick, type LiveContext } from '../lib/live'
import { allowed, defaultPrefs } from '../lib/prefs'
import { ACTIONS, DEFAULT_POLICY, applyReview, stageOf, statusFor, type ReviewPolicy } from '../lib/review'
import { dueReminders } from '../lib/reminders'
import { ACTIONS as MODERATION_ACTIONS, REASONS, activeSuspension, applyDecision, decisionProblem, groupReports } from '../lib/moderation'
import { activePack, buildPack, packProblems, restoreItems } from '../lib/packs'
import { canPlay, gateInForce, gateProblems, reviewGate, storeName, verdictFor } from '../lib/gate'
import { impactOf, occurrences, programChecks, worstSeverity } from '../lib/program'
import { isPending } from '../lib/ranking'
import { scoreSubmission } from '../lib/scoring'
import { renderTemplate } from '../lib/templates'
import type { ContestAdapter, UploadOptions } from './adapter'
import type {
  Announcement,
  Answer,
  AnswerKey,
  AuditEntry,
  Channel,
  Contest,
  ContestState,
  Id,
  MediaAsset,
  MediaKind,
  Notification,
  NotificationCategory,
  NotificationPrefs,
  Participant,
  Question,
  ReviewAction,
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
  /** Name written into the audit trail when a call does not pass one. It is also who a review action is done by. */
  actor?: string
  /** The rules of the question review: one or two reviewers, and how many days make a waiting question stale. */
  reviewPolicy?: ReviewPolicy
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
  const { storageKey = 'contest.state', latencyMs = 120, now = () => new Date(), actor: defaultActor = 'Admin', reviewPolicy = DEFAULT_POLICY } = options
  let failureRate = options.uploadFailureRate ?? 0

  const load = (): ContestState => {
    const raw = storageKey ? storage.get(storageKey) : null
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Partial<ContestState>
        return { ...clone(seed), ...saved, episodes: saved.episodes ?? [], surveys: saved.surveys ?? [], surveyResponses: saved.surveyResponses ?? [], prefs: saved.prefs ?? [], live: saved.live ?? null } as ContestState
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

  /** A gate that was scheduled becomes the gate in force when its time comes. */
  const promoteGate = () => {
    if (state.nextGate && gateInForce(state.gate, state.nextGate, now().getTime()) === state.nextGate) {
      state.gate = state.nextGate
      state.nextGate = undefined
      persist()
    }
  }

  /** One review action on one question. Throws a sentence a person can read when it cannot be done. */
  const reviewOne = (id: Id, action: ReviewAction, who: string, note?: string) => {
    const i = state.questions.findIndex((q) => q.id === id)
    if (i < 0) throw new Error('The question no longer exists.')
    const before = state.questions[i]
    if (action === 'withdraw' || action === 'trash') {
      const show = state.episodes.find((e) => e.status !== 'finished' && e.slots.some((s) => s.kind === 'question' && s.questionId === id))
      if (show) throw new Error(`It is in ${show.title}, which is ${show.status}. Take it out of the line-up first.`)
    }
    const next = applyReview(before, action, { actor: who, policy: reviewPolicy }, now().getTime(), state.answerKeys[id], note)
    state.questions[i] = next
    log({ actor: who, entity: 'question', entityId: id, action: action === 'approve' ? 'publish' : 'update', summary: `${ACTIONS[action].past}: "${short(before.prompt)}"`, before: clone(before), after: clone(next) })
  }

  const submissionFor = (participantId: Id): Submission => {
    let sub = state.submissions.find((s) => s.participantId === participantId)
    if (!sub) {
      sub = { id: nextId('sub'), contestId: state.contest.id, participantId, startedAt: iso(), status: 'in-progress', answers: [], scores: {} }
      state.submissions.push(sub)
    }
    return sub
  }

  const prefsOf = (id: Id): NotificationPrefs => state.prefs.find((p) => p.participantId === id) ?? defaultPrefs(id)
  const varsOf = (p: Participant) => ({ name: p.name.split(' ')[0], team: p.team ?? '', contest: state.contest.title })

  /**
   * Sends one message to a group of people over some channels, honouring each person's preferences. In-app messages become
   * notifications. Returns how many people each channel reached, missed, held back (quiet hours, digest) or skipped (turned off).
   */
  const deliver = (people: Participant[], channels: Channel[], category: NotificationCategory, critical: boolean, make: (p: Participant) => Omit<Notification, 'id' | 'recipientId' | 'createdAt'>, at: string) => {
    const delivery: NonNullable<Announcement['delivery']> = {}
    for (const channel of channels) {
      let sent = 0
      let failed = 0
      let held = 0
      let skipped = 0
      for (const p of people) {
        const verdict = allowed(prefsOf(p.id), category, channel, new Date(at), critical)
        if (verdict === 'off') skipped += 1
        else if (verdict === 'held') held += 1
        // Push needs a device, and a person who was invited but never opened the app has none.
        else if (channel === 'push' && p.status === 'invited') failed += 1
        else {
          sent += 1
          if (channel === 'in-app') state.notifications.unshift({ id: nextId('n'), recipientId: p.id, createdAt: at, ...make(p) })
        }
      }
      delivery[channel] = {
        sent,
        failed,
        ...(held ? { held } : {}),
        ...(skipped ? { skipped } : {}),
        ...(failed ? { reason: 'Invited but never opened the app, so there is no device to notify.' } : held ? { reason: 'Held for quiet hours or the daily digest.' } : {}),
      }
    }
    return delivery
  }

  /** Sends an announcement now. */
  const send = (a: Announcement, actor?: string) => {
    const ids = audienceOf(a.audience, state.participants, state.submissions)
    const people = ids.flatMap((id) => state.participants.filter((p) => p.id === id))
    a.status = 'sent'
    a.sentAt = iso()
    a.scheduledAt = undefined
    a.delivery = deliver(people, a.channels, 'announcement', false, (p) => ({ kind: 'announcement', title: renderTemplate(a.title, varsOf(p)), body: renderTemplate(a.body, varsOf(p)), href: '/announcements' }), a.sentAt)
    log({ actor, entity: 'announcement', entityId: a.id, action: 'publish', summary: `Sent announcement "${short(a.title)}" to ${people.length} ${people.length === 1 ? 'person' : 'people'}` })
  }

  /**
   * There is no timer here: scheduled announcements and show reminders that are due go out the next time someone reads.
   * A reminder reaches everybody who is not disqualified, over the channels it names.
   */
  const sendDue = () => {
    let changed = false
    for (const a of state.announcements.filter((x) => x.status === 'scheduled' && x.scheduledAt && x.scheduledAt <= iso())) {
      send(a, 'Scheduler')
      changed = true
    }
    for (const ep of state.episodes) {
      for (const r of dueReminders(ep, now().getTime())) {
        const people = state.participants.filter((p) => p.status !== 'disqualified')
        const starting = r.offsetMin === 0
        r.sentAt = iso()
        r.delivery = deliver(people, r.channels, 'episode', starting, () => ({ kind: 'deadline', title: starting ? `${ep.title} is starting now` : `${ep.title} starts soon`, body: starting ? 'The lobby is open. Join now.' : `Live at ${new Date(ep.startsAt).toLocaleString('en', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.`, href: '/live' }), r.sentAt)
        log({ actor: 'Scheduler', entity: 'episode', entityId: ep.id, action: 'publish', summary: `Sent the reminder "${r.offsetMin} min before" for ${short(ep.title)}` })
        changed = true
      }
    }
    if (changed) persist()
  }

  const liveCtx = (): LiveContext | null => {
    const ep = state.live ? state.episodes.find((e) => e.id === state.live!.episodeId) : undefined
    return ep ? { episode: ep, questions: state.questions, keys: state.answerKeys } : null
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
      const who = actor ?? defaultActor
      if (!before && !saved.review) saved.review = { stage: stageOf(saved), author: who, since: iso(), history: [{ at: iso(), actor: who, action: 'create', from: stageOf(saved), to: stageOf(saved) }] }
      else if (saved.review && statusFor(saved.review.stage) !== saved.status) {
        // the status was set by hand in the editor: the review follows it, and says so
        const from = saved.review.stage
        const to = stageOf({ ...saved, review: undefined })
        saved.review = { ...saved.review, stage: to, since: iso(), preapprovedBy: undefined, note: undefined, history: [...saved.review.history, { at: iso(), actor: who, action: 'edit', from, to, note: 'Status set in the editor' }] }
      }
      if (i >= 0) state.questions[i] = saved
      else state.questions.push(saved)
      log({ actor, entity: 'question', entityId: saved.id, action: before ? (saved.status === 'published' && before.status !== 'published' ? 'publish' : 'update') : 'create', summary: `${before ? 'Edited' : 'Created'} question "${short(saved.prompt)}"`, before, after: clone(saved) })
      persist()
      return wait(saved)
    },
    async reviewQuestions(ids, action: ReviewAction, options = {}, actor) {
      const who = actor ?? defaultActor
      const changed: Id[] = []
      const skipped: { id: Id; reason: string }[] = []
      for (const id of ids) {
        try {
          reviewOne(id, action, who, options.note)
          changed.push(id)
        } catch (e) {
          skipped.push({ id, reason: e instanceof Error ? e.message : 'It could not be changed.' })
        }
      }
      if (changed.length) persist()
      return wait({ changed, skipped })
    },

    async getPacks() {
      return wait({ topics: state.topics, packs: state.packs })
    },
    async publishPack(request, actor) {
      const who = actor ?? defaultActor
      const note = request.note.trim()
      if (note.length < 5) throw new Error('Say what changed, in a few words.')
      const topicIds = [...new Set(request.topics)]
      const active = activePack(state.packs)
      const error = packProblems(topicIds, state.questions, state.answerKeys, state.topics, state.program, active).find((p) => p.level === 'error')
      if (error) throw new Error(error.text)
      const revision = Math.max(0, ...state.packs.map((p) => p.revision)) + 1
      const pack = buildPack(topicIds, state.questions, state.answerKeys, state.topics, { id: `pack-r${revision}`, revision, at: iso(), by: who, note })
      for (const p of state.packs) if (!p.retiredAt) p.retiredAt = pack.createdAt
      state.packs.push(pack)
      log({ actor: who, entity: 'pack', entityId: pack.id, action: 'publish', summary: `Published pack revision ${revision} with ${pack.items.length} questions`, before: active ? clone(active) : undefined, after: clone(pack) })
      persist()
      return wait({ topics: state.topics, packs: state.packs })
    },
    async restorePack(packId, note, actor) {
      const who = actor ?? defaultActor
      const old = state.packs.find((p) => p.id === packId)
      if (!old) throw new Error('That pack no longer exists.')
      if (note.trim().length < 5) throw new Error('Say why, in a few words.')
      const { items, dropped } = restoreItems(old, state.questions)
      const live = items.filter((i) => state.topics.find((t) => t.id === i.topic && !t.archived))
      const left = dropped + (items.length - live.length)
      if (live.length === 0) throw new Error('Nothing in that pack can be served any more.')
      const revision = Math.max(0, ...state.packs.map((p) => p.revision)) + 1
      const topicIds = old.topics.filter((id) => state.topics.find((t) => t.id === id && !t.archived))
      const pack = { id: `pack-r${revision}`, revision, createdAt: iso(), createdBy: who, note: `Restores revision ${old.revision}${left ? ` (${left} question${left === 1 ? '' : 's'} left out)` : ''}: ${note.trim()}`, topics: topicIds, items: live }
      const active = activePack(state.packs)
      for (const p of state.packs) if (!p.retiredAt) p.retiredAt = pack.createdAt
      state.packs.push(pack)
      log({ actor: who, entity: 'pack', entityId: pack.id, action: 'publish', summary: `Restored pack revision ${old.revision} as revision ${revision}`, before: active ? clone(active) : undefined, after: clone(pack) })
      persist()
      return wait({ topics: state.topics, packs: state.packs })
    },
    async saveTopic(topic, actor) {
      const who = actor ?? defaultActor
      const name = topic.name.trim()
      if (!/^[a-z][a-z0-9-]{1,30}$/.test(topic.id)) throw new Error('The id is a tag: lower-case letters, digits and dashes, starting with a letter.')
      if (name.length < 2) throw new Error('Give the topic a name.')
      const i = state.topics.findIndex((t) => t.id === topic.id)
      const before = i >= 0 ? clone(state.topics[i]) : undefined
      const saved = { id: topic.id, name, archived: Boolean(topic.archived) }
      if (i >= 0) state.topics[i] = saved
      else state.topics.push(saved)
      log({ actor: who, entity: 'topic', entityId: saved.id, action: before ? 'update' : 'create', summary: `${before ? (before.archived !== saved.archived ? (saved.archived ? 'Archived' : 'Restored') : 'Renamed') : 'Created'} topic ${saved.name}`, before, after: clone(saved) })
      persist()
      return wait({ topics: state.topics, packs: state.packs })
    },

    async getGate() {
      promoteGate()
      return wait({ current: state.gate, next: state.nextGate, usage: state.builds })
    },
    async saveGate(gate, options = {}, actor) {
      const who = actor ?? defaultActor
      promoteGate()
      const t = now().getTime()
      const before = clone(state.gate)
      // the server owns the list of builds the store offers, the revision and the time
      const stores = gate.stores.map((g) => ({ ...g, blockedBuilds: [...g.blockedBuilds].sort((a, b) => a - b), availableBuilds: before.stores.find((s) => s.store === g.store)?.availableBuilds ?? g.availableBuilds }))
      const emergency = Boolean(gate.emergency)
      const draft = { ...clone(gate), stores, emergency, effectiveAt: emergency ? undefined : gate.effectiveAt || undefined }
      const error = gateProblems(draft, state.builds).find((p) => p.level === 'error')
      if (error) throw new Error(error.text)
      const shows = occurrences(state.program, t, 3).map((o) => ({ title: 'the live show', at: o.at, endsAt: o.endsAt }))
      const review = reviewGate(before, draft, state.builds, t, shows)
      if (!review.changed) throw new Error('Nothing changed.')
      if (review.needsConfirm && !options.confirmed) throw new Error(review.reasons[0] ? `${review.reasons[0]} Confirm the change to save it.` : 'Confirm the change to save it.')
      const saved = { ...draft, revision: Math.max(before.revision, state.nextGate?.revision ?? 0) + 1, savedAt: iso(), savedBy: who }
      const later = !emergency && saved.effectiveAt && Date.parse(saved.effectiveAt) > t
      if (later) state.nextGate = saved
      else {
        state.gate = saved
        state.nextGate = undefined
      }
      if (emergency && state.live) {
        // an emergency also takes people on stopped builds out of the show that is on air
        const out = (id: Id) => {
          const client = state.participants.find((p) => p.id === id)?.client
          return client ? !canPlay(verdictFor(saved, client.store, client.build)) : false
        }
        state.live = { ...state.live, joined: state.live.joined.filter((id) => !out(id)), waiting: state.live.waiting.filter((id) => !out(id)) }
      }
      log({ actor: who, entity: 'gate', entityId: saved.id, action: 'update', summary: `${later ? 'Scheduled' : 'Saved'} version gate revision ${saved.revision}${emergency ? ' as an emergency' : ''}`, before, after: clone(saved) })
      persist()
      return wait({ current: state.gate, next: state.nextGate, usage: state.builds })
    },

    async getModeration() {
      return wait({ reports: state.reports, violations: state.violations, claims: state.claims })
    },
    async claimCase(key, claim, actor) {
      const who = actor ?? defaultActor
      const held = state.claims[key]
      if (claim) state.claims[key] = { by: who, at: iso() }
      else if (held && held.by !== who) throw new Error(`Only ${held.by} can release this case. Take it over instead.`)
      else delete state.claims[key]
      persist()
      return wait(state.claims)
    },
    async resolveCase(key, decision, actor) {
      const who = actor ?? defaultActor
      const c = groupReports(state.reports).find((x) => x.key === key)
      if (!c) throw new Error('This case is already closed.')
      const problem = decisionProblem(c, decision, { actor: who, claim: state.claims[key] })
      if (problem) throw new Error(problem)
      const person = c.kind === 'player' ? state.participants.find((p) => p.id === c.targetId) : undefined
      const question = c.kind === 'question' ? state.questions.find((q) => q.id === c.targetId) : undefined
      if (c.kind === 'player' && !person) throw new Error('That participant no longer exists.')
      if (c.kind === 'question' && !question) throw new Error('That question no longer exists.')
      if (decision.action === 'withdraw') {
        const why = c.reasons.map((r) => REASONS[r].label.toLowerCase()).join(', ')
        reviewOne(c.targetId, 'withdraw', who, `Reported (${why}): ${decision.note.trim()}`)
      }
      const { reports, violation } = applyDecision(c, decision, who, now().getTime(), nextId('v'))
      for (const r of reports) state.reports[state.reports.findIndex((x) => x.id === r.id)] = r
      if (violation) state.violations.push(violation)
      if (person && decision.action === 'disqualify') {
        const before = clone(person)
        person.status = 'disqualified'
        log({ actor: who, entity: 'participant', entityId: person.id, action: 'update', summary: `Disqualified ${person.name}`, before, after: clone(person) })
      }
      delete state.claims[key]
      const target = person?.name ?? short(question?.prompt ?? c.targetId)
      log({ actor: who, entity: 'report', entityId: key, action: 'update', summary: `${MODERATION_ACTIONS[decision.action].past}${decision.action === 'withdraw' ? '' : ` ${target}`} (${c.reports.length} report${c.reports.length === 1 ? '' : 's'})`, before: clone(c.reports), after: clone(reports) })
      persist()
      return wait({ resolved: reports.map((r) => r.id), violation })
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

    async getProgram() {
      return wait(state.program)
    },
    async saveProgram(program, options = {}, actor) {
      const bad = programChecks(program).find((c) => c.level === 'error')
      if (bad) throw new Error(bad.text)
      const impact = impactOf(state.program, program, state.registrations, now().getTime())
      const verdict = worstSeverity(impact)
      if (verdict === 'blocked') throw new Error(impact.find((i) => i.severity === 'blocked')!.message)
      if (verdict === 'confirm' && !options.confirmed) throw new Error('People registered for these shows. Confirm the change to save it.')
      const before = clone(state.program)
      for (const item of impact) {
        // a show that moved or went away takes its registrations with it: a real backend tells those people
        if (item.change.kinds.some((k) => k === 'moved' || k === 'removed')) for (const key of Object.keys(state.registrations)) if (key.startsWith(`${item.change.slotId}@`)) delete state.registrations[key]
      }
      state.program = { ...clone(program), revision: before.revision + 1, savedAt: iso(), savedBy: actor ?? defaultActor }
      const names = impact.map((i) => i.change.label)
      log({ actor, entity: 'program', entityId: state.program.id, action: 'update', summary: impact.length ? `Saved program revision ${state.program.revision}: ${short(names.join(', '))}` : `Saved program revision ${state.program.revision}`, before, after: clone(state.program) })
      persist()
      return wait(state.program)
    },
    async listRegistrations() {
      return wait(state.registrations)
    },

    async listEpisodes() {
      sendDue()
      return wait(state.episodes)
    },
    async saveEpisode(episode, actor) {
      const i = state.episodes.findIndex((e) => e.id === episode.id)
      const before = i >= 0 ? clone(state.episodes[i]) : undefined
      if (i >= 0) state.episodes[i] = clone(episode)
      else state.episodes.push(clone(episode))
      log({ actor, entity: 'episode', entityId: episode.id, action: before ? 'update' : 'create', summary: `${before ? 'Edited' : 'Planned'} ${short(episode.title)}`, before, after: clone(episode) })
      persist()
      return wait(episode)
    },

    async getLive() {
      const ctx = liveCtx()
      if (state.live && ctx) state.live = tick(state.live, now().getTime(), ctx)
      return wait(state.live)
    },
    async sendLive(command, actor) {
      const at = now().getTime()
      if (command.type === 'open-lobby') {
        const ep = state.episodes.find((e) => e.id === command.episodeId)
        if (!ep) throw new Error('That show no longer exists.')
        state.live = openLobby(ep.id, at)
        ep.status = 'live'
        ep.packId = activePack(state.packs)?.id
        log({ actor, entity: 'episode', entityId: ep.id, action: 'publish', summary: `Opened the lobby of ${short(ep.title)}` })
        persist()
        return wait(state.live)
      }
      if (command.type === 'close') {
        state.live = null
        persist()
        return wait(null)
      }
      if (command.type === 'join') {
        const person = state.participants.find((p) => p.id === command.participantId)
        promoteGate()
        if (person?.client) {
          const verdict = verdictFor(state.gate, person.client.store, person.client.build)
          if (!canPlay(verdict)) throw new Error(`${verdict === 'blocked' ? 'This version of the app is stopped.' : 'This version of the app is too old.'} ${state.gate.message} (${storeName(person.client.store)}, build ${person.client.build}.)`)
        }
        const suspension = activeSuspension(command.participantId, state.violations, at)
        if (person?.status === 'disqualified') throw new Error('This account is disqualified and cannot join a show.')
        if (suspension) throw new Error(`This account is suspended until ${new Date(suspension.endsAt!).toLocaleDateString('en', { month: 'short', day: 'numeric' })}.`)
      }
      const ctx = liveCtx()
      if (!state.live || !ctx) throw new Error('There is no live show.')
      const was = state.live.phase
      const next = liveReduce(tick(state.live, at, ctx), { ...command, at }, ctx)
      if (next.phase === 'finished' && was !== 'finished') {
        ctx.episode.status = 'finished'
        ctx.episode.result = episodeResultOf(next, ctx)
        log({ actor, entity: 'episode', entityId: ctx.episode.id, action: 'update', summary: `Finished ${short(ctx.episode.title)} with ${next.joined.length} players` })
      }
      state.live = next
      persist()
      return wait(state.live)
    },

    async listSurveys() {
      return wait(state.surveys)
    },
    async saveSurvey(survey, actor) {
      const i = state.surveys.findIndex((x) => x.id === survey.id)
      const before = i >= 0 ? clone(state.surveys[i]) : undefined
      if (i >= 0) state.surveys[i] = clone(survey)
      else state.surveys.push(clone(survey))
      log({ actor, entity: 'survey', entityId: survey.id, action: before ? 'update' : 'create', summary: `${before ? 'Edited' : 'Created'} the survey "${short(survey.title)}"`, before, after: clone(survey) })
      persist()
      return wait(survey)
    },
    async listSurveyResponses(surveyId) {
      return wait(surveyId ? state.surveyResponses.filter((r) => r.surveyId === surveyId) : state.surveyResponses)
    },
    async submitSurveyResponse(response) {
      const survey = state.surveys.find((x) => x.id === response.surveyId)
      const saved = { ...clone(response), id: nextId('sr'), at: iso(), ...(survey?.anonymous ? { participantId: undefined } : {}) }
      state.surveyResponses.push(saved)
      persist()
      return wait(saved)
    },

    async getPrefs(participantId) {
      return wait(prefsOf(participantId))
    },
    async savePrefs(prefs) {
      const i = state.prefs.findIndex((p) => p.participantId === prefs.participantId)
      if (i >= 0) state.prefs[i] = clone(prefs)
      else state.prefs.push(clone(prefs))
      persist()
      return wait(prefs)
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

      log({ actor, entity, entityId, action: 'revert', summary: `Reverted: ${entry.summary}`, of: auditId })
      persist()
      return wait(undefined)
    },
  }

  return adapter
}
