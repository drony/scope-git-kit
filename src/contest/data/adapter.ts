import type {
  Announcement,
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
export interface ContestAdapter {
  getContest(): Promise<Contest>
  saveContest(contest: Contest, actor?: string): Promise<Contest>

  listQuestions(): Promise<Question[]>
  saveQuestion(question: Question, actor?: string): Promise<Question>
  deleteQuestion(id: Id, actor?: string): Promise<void>

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

  listAudit(): Promise<AuditEntry[]>
  /** Puts an entity back the way it was before the entry. Only entries that kept a `before` snapshot can be reverted. */
  revert(auditId: Id, actor?: string): Promise<void>
}
