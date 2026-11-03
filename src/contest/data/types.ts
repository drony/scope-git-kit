/**
 * The data model of a contest platform. Plain types: no React, no fetching.
 *
 * Contest components take these shapes through props. Where they come from (the in-memory adapter, a real backend) is the
 * app's business; see `adapter.ts`.
 */

export type Id = string
/** ISO 8601 date-time string. */
export type IsoDate = string

/* ---- Contest ------------------------------------------------------------------------------------------------- */

export type ContestStatus = 'draft' | 'live' | 'judging' | 'closed'

export interface Prize {
  id: Id
  place: number
  title: string
  description?: string
}

export interface Round {
  id: Id
  title: string
  opensAt: IsoDate
  closesAt: IsoDate
  /** Questions in play order. */
  questionIds: Id[]
}

export interface Contest {
  id: Id
  title: string
  tagline: string
  status: ContestStatus
  startsAt: IsoDate
  endsAt: IsoDate
  rounds: Round[]
  prizes: Prize[]
}

/* ---- Questions ----------------------------------------------------------------------------------------------- */

export type QuestionType =
  | 'single'
  | 'multiple'
  | 'truefalse'
  | 'image-choice'
  | 'short'
  | 'long'
  | 'number'
  | 'ordering'
  | 'matching'
  | 'upload'

export type QuestionStatus = 'draft' | 'ready' | 'published'

/** One choice, ordering item or matching side. `mediaId` makes it an image or audio option. */
export interface ChoiceOption {
  id: Id
  label: string
  mediaId?: Id
  /** Shown to the participant after answering, for this option. */
  feedback?: string
}

interface QuestionBase {
  id: Id
  prompt: string
  /** Media shown with the prompt (image, audio, video). */
  mediaIds: Id[]
  points: number
  timeLimitSec?: number
  hint?: string
  /** Shown after the answer is locked. */
  explanation?: string
  tags: string[]
  status: QuestionStatus
  updatedAt: IsoDate
}

export type ChoiceQuestion = QuestionBase & { type: 'single' | 'multiple' | 'truefalse' | 'image-choice'; options: ChoiceOption[] }
export type TextQuestion = QuestionBase & { type: 'short' | 'long'; maxLength?: number }
export type NumberQuestion = QuestionBase & { type: 'number'; unit?: string }
export type OrderingQuestion = QuestionBase & { type: 'ordering'; items: ChoiceOption[] }
export type MatchingQuestion = QuestionBase & { type: 'matching'; left: ChoiceOption[]; right: ChoiceOption[] }
export type UploadQuestion = QuestionBase & { type: 'upload'; accept: string; maxMb: number; maxFiles: number }

export type Question = ChoiceQuestion | TextQuestion | NumberQuestion | OrderingQuestion | MatchingQuestion | UploadQuestion

/* ---- Answer keys (back office only) --------------------------------------------------------------------------- */

export interface AcceptedText {
  id: Id
  text: string
  /** Fraction of the points this wording earns, 0 to 1. */
  credit: number
}

export interface RubricCriterion {
  id: Id
  label: string
  maxPoints: number
}

export type AnswerKey =
  | { type: 'choice'; correct: Id[]; /** Award a share of the points for a partly right multiple choice. */ partialCredit: boolean }
  | { type: 'text'; accepted: AcceptedText[]; caseSensitive: boolean; ignoreAccents: boolean; ignorePunctuation: boolean }
  | { type: 'number'; value: number; tolerance: number }
  | { type: 'ordering'; order: Id[] }
  | { type: 'matching'; pairs: Record<Id, Id> }
  /** Uploads and long answers: a person scores them. */
  | { type: 'manual'; rubric: RubricCriterion[] }

/* ---- Answers, submissions and scores -------------------------------------------------------------------------- */

export type AnswerValue =
  | { type: 'choice'; selected: Id[] }
  | { type: 'text'; text: string }
  | { type: 'number'; value: number | null }
  | { type: 'ordering'; order: Id[] }
  | { type: 'matching'; pairs: Record<Id, Id> }
  | { type: 'upload'; mediaIds: Id[] }

export interface Answer {
  questionId: Id
  value: AnswerValue
  answeredAt: IsoDate
  /** Seconds spent on the question. */
  spentSec?: number
}

export interface Score {
  points: number
  max: number
  /** True when the system scored it from the key; false when a person did or overrode it. */
  auto: boolean
  note?: string
  reviewer?: string
  /** Points per rubric criterion, when a person scored the answer with a rubric. */
  breakdown?: Record<Id, number>
}

export type SubmissionStatus = 'in-progress' | 'submitted' | 'reviewed'

export interface Submission {
  id: Id
  contestId: Id
  participantId: Id
  startedAt: IsoDate
  submittedAt?: IsoDate
  status: SubmissionStatus
  answers: Answer[]
  /** Keyed by question id. */
  scores: Record<Id, Score>
}

/* ---- People --------------------------------------------------------------------------------------------------- */

export type ParticipantStatus = 'invited' | 'active' | 'finished' | 'disqualified'

export interface Participant {
  id: Id
  name: string
  email: string
  team?: string
  status: ParticipantStatus
  joinedAt?: IsoDate
  note?: string
}

/* ---- Media ---------------------------------------------------------------------------------------------------- */

export type MediaKind = 'image' | 'audio' | 'video' | 'document'
export type ModerationState = 'pending' | 'approved' | 'rejected' | 'flagged'

export interface MediaAsset {
  id: Id
  kind: MediaKind
  name: string
  url: string
  mime: string
  sizeBytes: number
  width?: number
  height?: number
  durationSec?: number
  alt?: string
  caption?: string
  tags: string[]
  /** Focal point in 0 to 1, so a crop keeps the subject. */
  focal?: { x: number; y: number }
  /** Non-destructive crop and rotation: the original file is never changed. */
  transform?: { x: number; y: number; w: number; h: number; rotate: 0 | 90 | 180 | 270 }
  moderation: ModerationState
  uploadedBy?: Id
  createdAt: IsoDate
}

/* ---- Communication -------------------------------------------------------------------------------------------- */

export type Channel = 'in-app' | 'email' | 'push'

export type Audience =
  | { kind: 'all' }
  | { kind: 'segment'; segment: 'not-started' | 'in-progress' | 'finished' | 'team'; team?: string }
  | { kind: 'people'; ids: Id[] }

export interface Announcement {
  id: Id
  title: string
  body: string
  audience: Audience
  channels: Channel[]
  pinned: boolean
  status: 'draft' | 'scheduled' | 'sent'
  scheduledAt?: IsoDate
  sentAt?: IsoDate
  /** Filled in when it is sent: how many people each channel reached, and why some were missed. */
  delivery?: Partial<Record<Channel, { sent: number; failed: number; reason?: string }>>
}

export type NotificationKind = 'announcement' | 'score' | 'deadline' | 'system'

export interface Notification {
  id: Id
  recipientId: Id
  kind: NotificationKind
  title: string
  body: string
  createdAt: IsoDate
  readAt?: IsoDate
  href?: string
}

/* ---- History -------------------------------------------------------------------------------------------------- */

export type AuditEntity = 'contest' | 'question' | 'answer-key' | 'media' | 'score' | 'announcement' | 'participant'

export interface AuditEntry {
  id: Id
  at: IsoDate
  actor: string
  entity: AuditEntity
  entityId: Id
  action: 'create' | 'update' | 'delete' | 'publish' | 'revert'
  summary: string
  /** Snapshots, so an entry can be reverted. */
  before?: unknown
  after?: unknown
}

/** Everything a contest holds. The seed and the in-memory adapter use this shape. */
export interface ContestState {
  contest: Contest
  questions: Question[]
  answerKeys: Record<Id, AnswerKey>
  media: MediaAsset[]
  participants: Participant[]
  submissions: Submission[]
  announcements: Announcement[]
  notifications: Notification[]
  audit: AuditEntry[]
}
