import type {
  Announcement,
  Episode,
  LiveCommand,
  LiveState,
  NotificationPrefs,
  ModerationSnapshot,
  GateSnapshot,
  PackSnapshot,
  ReportDecision,
  ReviewAction,
  Survey,
  VersionGate,
  Topic,
  Violation,
  SurveyResponse,
  WeeklyProgram,
  Answer,
  AnswerKey,
  AuditEntry,
  Contest,
  Id,
  MediaAsset,
  Notification,
  Participant,
  Question,
  Score,
  Submission,
} from './types'

export interface UploadOptions {
  /** Called with a fraction from 0 to 1 while the file is on its way. */
  onProgress?: (fraction: number) => void
  /** Aborting rejects the upload with an `AbortError`. */
  signal?: AbortSignal
  uploadedBy?: Id
}

/**
 * Everything a contest app needs from a backend. Contest components never call it: the app (or a hook from
 * `contest/hooks`) does, and hands the result to the components as props. A real backend implements this same interface;
 * `memoryAdapter.ts` is the one that ships, for demos and tests.
 *
 * `actor` is the name written into the audit trail.
 */
/** What a decision on a case did: the reports it closed, and the violation it recorded against a player. */
export interface ResolveResult {
  resolved: Id[]
  violation?: Violation
}

/** What a bulk review action did: the questions that changed, and the ones that were left out with the reason. */
export interface ReviewResult {
  changed: Id[]
  skipped: { id: Id; reason: string }[]
}

export interface ContestAdapter {
  getContest(): Promise<Contest>
  saveContest(contest: Contest, actor?: string): Promise<Contest>

  listQuestions(): Promise<Question[]>
  saveQuestion(question: Question, actor?: string): Promise<Question>
  deleteQuestion(id: Id, actor?: string): Promise<void>

  /**
   * Does a review action (see `lib/review.ts`) to many questions at once. Every question is checked on its own: one that cannot
   * be changed (the actor wrote it, it is in a scheduled show, it is not ready) is left out and comes back in `skipped` with the
   * reason, and the others are changed. A return or a withdrawal needs a `note`.
   */
  reviewQuestions(ids: Id[], action: ReviewAction, options?: { note?: string }, actor?: string): Promise<ReviewResult>
  /** The topics and every pack, oldest first. The last pack that is not retired is the one in force. */
  getPacks(): Promise<PackSnapshot>
  /**
   * Publishes a new pack: the approved, ready questions of the chosen topics, each pinned to the version it has now. The server
   * builds it, so a client cannot choose what goes in. It becomes the pack in force and the one before it is retired; a show that
   * has begun keeps the pack it was opened with. It refuses a topic that is archived or has no approved question, a note that is too
   * short, and a pack that would be the same as the one in force.
   */
  publishPack(request: { topics: string[]; note: string }, actor?: string): Promise<PackSnapshot>
  /**
   * Publishes a new pack that restores an older one: the same topics and pinned versions, except questions that are no longer
   * approved or whose topic is archived now, which stay out. A rollback never serves a question that was withdrawn.
   */
  restorePack(packId: Id, note: string, actor?: string): Promise<PackSnapshot>
  /** Creates a topic or changes one: its name and whether it is archived. The id never changes. Archiving changes no pack until the next one is published. */
  saveTopic(topic: Topic, actor?: string): Promise<PackSnapshot>
  /** The version gate in force, the one that starts later (if any), and how many players use each build. */
  getGate(): Promise<GateSnapshot>
  /**
   * Saves a new revision of the gate. The server decides the revision and the time, and keeps its own list of the builds the
   * store really offers. It refuses a gate with errors (see `gateProblems`: a minimum above the newest build locks everybody out)
   * and, unless `confirmed` is true, a change that stops a tenth of a store's players or more, or an emergency. A gate with a start
   * time in the future waits as `next`. An emergency applies at once and also takes people who are playing out of a live show.
   * A person on a build that may not play cannot join a live show.
   */
  saveGate(gate: VersionGate, options?: { confirmed?: boolean }, actor?: string): Promise<GateSnapshot>
  /** Every report (open and handled), the violations on record, and who is working on which case. */
  getModeration(): Promise<ModerationSnapshot>
  /**
   * Marks a case as being worked on by the actor. Taking over a case someone else claimed is allowed: the claim moves to the
   * actor. With `claim` false it releases the case; only the person who claimed it can do that.
   */
  claimCase(key: string, claim: boolean, actor?: string): Promise<ModerationSnapshot['claims']>
  /**
   * Decides a case: closes every open report about the target with the decision and its reason. A warning, a suspension or a
   * disqualification is recorded as a violation, and a disqualification changes the participant's status. Withdrawing a question
   * sends it back to review. It refuses a case someone else claimed, a reason that is too short, and a question that a show that
   * has not finished uses. A suspended participant cannot join live shows.
   */
  resolveCase(key: string, decision: ReportDecision, actor?: string): Promise<ResolveResult>
  getAnswerKey(questionId: Id): Promise<AnswerKey | null>
  saveAnswerKey(questionId: Id, key: AnswerKey, actor?: string): Promise<AnswerKey>

  listMedia(): Promise<MediaAsset[]>
  uploadMedia(file: File, options?: UploadOptions): Promise<MediaAsset>
  updateMedia(asset: MediaAsset, actor?: string): Promise<MediaAsset>
  deleteMedia(ids: Id[], actor?: string): Promise<void>

  listParticipants(): Promise<Participant[]>
  saveParticipant(participant: Participant, actor?: string): Promise<Participant>
  /** Adds people with the status "invited". A person whose e-mail is already in the contest is skipped. */
  inviteParticipants(people: Array<{ name: string; email: string; team?: string }>, actor?: string): Promise<Participant[]>

  listSubmissions(): Promise<Submission[]>
  /** A participant's submission, created on first use. */
  getSubmission(participantId: Id): Promise<Submission>
  saveAnswer(participantId: Id, answer: Answer): Promise<Submission>
  /** Locks the submission and scores every answer that can be scored from the keys. */
  submit(participantId: Id): Promise<Submission>
  saveScore(submissionId: Id, questionId: Id, score: Score, actor?: string): Promise<Submission>

  listAnnouncements(): Promise<Announcement[]>
  saveAnnouncement(announcement: Announcement, actor?: string): Promise<Announcement>
  /**
   * Marks it sent, fills the merge fields for each recipient, writes an in-app notification for every recipient (when the
   * in-app channel is on) and records how many people each channel reached. Scheduled announcements that are due go out
   * the next time announcements or notifications are read.
   */
  sendAnnouncement(id: Id, actor?: string): Promise<Announcement>

  listNotifications(recipientId: Id): Promise<Notification[]>
  markNotificationsRead(ids: Id[]): Promise<void>

  /** The weekly program: which shows run on which day. */
  getProgram(): Promise<WeeklyProgram>
  /**
   * Saves a new revision of the program. The server decides the revision number and the time. It refuses a change to a show that
   * is on air, and a change that touches a show people registered for unless `confirmed` is true. Errors in the program (see
   * `programChecks`) are refused too.
   */
  saveProgram(program: WeeklyProgram, options?: { confirmed?: boolean }, actor?: string): Promise<WeeklyProgram>
  /** How many people registered, by occurrence key (`slotId@YYYY-MM-DD`). */
  listRegistrations(): Promise<Record<string, number>>

  listEpisodes(): Promise<Episode[]>
  saveEpisode(episode: Episode, actor?: string): Promise<Episode>

  /**
   * The live show now, or null. The state is brought up to the server's clock first (reading becomes open, open becomes locked
   * when time runs out), so every caller sees the same second.
   */
  getLive(): Promise<LiveState | null>
  /** Sends one command to the live show. The adapter stamps it with its own clock: callers never choose the time. */
  sendLive(command: LiveCommand, actor?: string): Promise<LiveState | null>

  listSurveys(): Promise<Survey[]>
  saveSurvey(survey: Survey, actor?: string): Promise<Survey>
  listSurveyResponses(surveyId?: Id): Promise<SurveyResponse[]>
  submitSurveyResponse(response: Omit<SurveyResponse, 'id' | 'at'>): Promise<SurveyResponse>

  /** A person's notification preferences. Without saved ones, the defaults. */
  getPrefs(participantId: Id): Promise<NotificationPrefs>
  savePrefs(prefs: NotificationPrefs): Promise<NotificationPrefs>

  listAudit(): Promise<AuditEntry[]>
  /** Puts an entity back the way it was before the entry. Only entries that kept a `before` snapshot can be reverted. */
  revert(auditId: Id, actor?: string): Promise<void>
}
