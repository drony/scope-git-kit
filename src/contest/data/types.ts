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

/** 1 warm-up, 2 easy, 3 medium, 4 hard, 5 finale. */
export type Difficulty = 1 | 2 | 3 | 4 | 5

export type SourceKind = 'book' | 'article' | 'web' | 'dataset' | 'original'

export interface QuestionSource {
  kind: SourceKind
  title: string
  url?: string
  /** Who checked the answer against the source, and when. Missing means nobody has. */
  checkedBy?: string
  checkedAt?: IsoDate
}

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

/** Where a question is on its way to the bank. `approved` is the same as status `published`. */
export type ReviewStage = 'draft' | 'pending' | 'preapproved' | 'approved' | 'returned' | 'trashed'

export type ReviewAction = 'submit' | 'preapprove' | 'approve' | 'return' | 'withdraw' | 'trash' | 'restore'

export interface ReviewEvent {
  at: IsoDate
  actor: string
  /** What was done. `create` and `edit` are not review actions: they mark the start and a change made outside the review. */
  action: ReviewAction | 'create' | 'edit'
  from: ReviewStage
  to: ReviewStage
  /** The reason, for a return or a withdrawal. */
  note?: string
}

/** The editorial side of a question: who wrote it, who looked at it, and what was said. */
export interface QuestionReview {
  stage: ReviewStage
  author: string
  /** The first reviewer, once it is pre-approved. The final approval has to come from someone else. */
  preapprovedBy?: string
  /** Why it was returned, in the reviewer's words. */
  note?: string
  /** When it entered this stage: how long it has been waiting is worked out from this. */
  since: IsoDate
  history: ReviewEvent[]
}

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
  /** How hard the writer thinks it is. The real difficulty comes from how people answered (see `lib/stats.ts`). */
  difficulty?: Difficulty
  /** Where the answer was checked. Editors verify it; participants do not see it. */
  source?: QuestionSource
  /** The editorial review. Without it, the stage follows `status` (draft, ready is pending, published is approved). */
  review?: QuestionReview
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
  /** The app the person plays on: the store it came from and its build number. Without it, no version rule applies. */
  client?: ClientInfo
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
  delivery?: Partial<Record<Channel, { sent: number; failed: number; /** Held back by quiet hours or the daily digest. */ held?: number; /** Left out because the person turned this channel off. */ skipped?: number; reason?: string }>>
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

export type AuditEntity = 'contest' | 'question' | 'answer-key' | 'media' | 'score' | 'announcement' | 'participant' | 'episode' | 'survey' | 'program' | 'report' | 'gate' | 'pack' | 'topic'

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
  /** For a revert: the entry that was reverted. */
  of?: Id
}

/** Everything a contest holds. The seed and the in-memory adapter use this shape. */
export interface ContestState {
  /** The topics the questions are sorted into: what a pack is made of. */
  topics: Topic[]
  /** Every pack ever published, oldest first. The last one that is not retired is the one in force. */
  packs: ContentPack[]
  /** The version gate in force: the oldest builds that may play, and the ones that are stopped. */
  gate: VersionGate
  /** A gate that starts later, when the editor chose a time. It replaces `gate` when its time comes. */
  nextGate?: VersionGate
  /** How many players use each build of the app. */
  builds: BuildUsage[]
  /** Reports from players about other players and about questions, open and handled. */
  reports: Report[]
  /** What was decided about people: warnings, suspensions and disqualifications. */
  violations: Violation[]
  /** Who is working on which case, by case key (`kind:targetId`). */
  claims: Record<string, Claim>
  /** The weekly program: which shows run on which day. */
  program: WeeklyProgram
  /** How many people registered, by occurrence key (`slotId@YYYY-MM-DD`). */
  registrations: Record<string, number>
  episodes: Episode[]
  surveys: Survey[]
  surveyResponses: SurveyResponse[]
  prefs: NotificationPrefs[]
  /** The live show that is running or just finished. `null` when there is none. */
  live: LiveState | null
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

/* ---- Content packs -------------------------------------------------------------------------------------------- */

/** A topic: a stable id (a question tag), a name for people, and whether it is still used. */
export interface Topic {
  /** The tag that puts a question in the topic. It never changes: renaming changes `name` only. */
  id: string
  name: string
  /** An archived topic is hidden and no new pack serves it. */
  archived: boolean
}

/** One question in a pack, pinned to the version it had when the pack was made. */
export interface PackItem {
  questionId: Id
  topic: string
  /** The `updatedAt` of the question at that time: what the pack serves. A later edit does not change the pack. */
  version: IsoDate
  difficulty?: Difficulty
}

/** A snapshot of the approved questions of some topics, as the shows serve them. A pack is never edited: a change is a new pack. */
export interface ContentPack {
  id: Id
  revision: number
  createdAt: IsoDate
  createdBy: string
  note: string
  /** The topics it covers, also those that had no question at the time. */
  topics: string[]
  items: PackItem[]
  /** Set when a newer pack replaced it. */
  retiredAt?: IsoDate
}

/** The topics and the packs in one read. */
export interface PackSnapshot {
  topics: Topic[]
  packs: ContentPack[]
}

/* ---- Version gate --------------------------------------------------------------------------------------------- */

export type StoreId = 'app-store' | 'testflight' | 'play-store'

/** Which app a person plays on. */
export interface ClientInfo {
  store: StoreId
  build: number
}

/** The rule for one store. Build numbers only grow, so "below" means "older". */
export interface StoreGate {
  store: StoreId
  /** The oldest build that may play. Older builds see an update screen and cannot continue. */
  minBuild: number
  /** Builds from here up are current. Older builds that may still play get a prompt they can close. */
  recommendedBuild: number
  /** Builds that are stopped even though they are above the minimum, for example a build with a serious bug. */
  blockedBuilds: number[]
  /** Where "Update" goes. */
  updateUrl: string
  /** The builds the store really offers now. The server keeps this list; a minimum above the newest one would lock everybody out. */
  availableBuilds: number[]
}

export interface VersionGate {
  id: Id
  revision: number
  stores: StoreGate[]
  /** What the update screen says. */
  message: string
  /** When the gate starts to apply. Without it, at once. */
  effectiveAt?: IsoDate
  /** Applies at once and also stops people who are playing now, instead of waiting for their next join. */
  emergency: boolean
  savedAt: IsoDate
  savedBy?: string
}

/** How many players use one build, over the last week. */
export interface BuildUsage {
  store: StoreId
  build: number
  players: number
}

/** The gate in force, the one that starts later (if any), and who uses which build, in one read. */
export interface GateSnapshot {
  current: VersionGate
  next?: VersionGate
  usage: BuildUsage[]
}

/* ---- Reports and moderation ----------------------------------------------------------------------------------- */

export type ReportKind = 'player' | 'question'
export type ReportReason = 'cheating' | 'abuse' | 'impersonation' | 'other' | 'wrong-answer' | 'unclear' | 'offensive'
export type ReportAction = 'dismiss' | 'warn' | 'suspend' | 'disqualify' | 'withdraw'

/** What a moderator decided about a report, and why. */
export interface ReportResolution {
  action: ReportAction
  by: string
  at: IsoDate
  note: string
  /** For a suspension: how many days. */
  days?: number
}

/** One person's report about a player or a question. Reports about the same target are worked as one case. */
export interface Report {
  id: Id
  kind: ReportKind
  reason: ReportReason
  /** The participant or the question that was reported. */
  targetId: Id
  reporterId: Id
  at: IsoDate
  /** What the reporter wrote. */
  comment?: string
  /** Set when the report was handled. Open reports have none. */
  resolution?: ReportResolution
}

export interface Violation {
  id: Id
  participantId: Id
  action: 'warn' | 'suspend' | 'disqualify'
  reason: ReportReason
  at: IsoDate
  by: string
  note: string
  /** For a suspension: when it ends. */
  endsAt?: IsoDate
  reportIds: Id[]
}

export interface Claim {
  by: string
  at: IsoDate
}

export interface ReportDecision {
  action: ReportAction
  /** The reason, in the moderator's words. It is kept with the case. */
  note: string
  /** For a suspension: 1 to 30. */
  days?: number
}

/** Everything the moderation screen needs in one read. */
export interface ModerationSnapshot {
  reports: Report[]
  violations: Violation[]
  claims: Record<string, Claim>
}

/* ---- Weekly live contest -------------------------------------------------------------------------------------- */

/** ISO weekday: 1 is Monday, 7 is Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** One show of the weekly program. It repeats every week on its weekday. */
export interface ProgramSlot {
  id: Id
  weekday: Weekday
  /** Start time on the wall clock of the program's time zone, "HH:MM". */
  time: string
  /** Minutes the broadcast lasts. */
  lengthMin: number
  /** A daily show feeds the weekly final; the final is the show the dailies lead to. */
  kind: 'daily' | 'final'
  /** The topic of the questions (a question tag). */
  topic: string
  /** The most people who can take part. */
  quota: number
  /** Daily: how many of the best players win a seat in the final. The final has none. */
  seats: number
}

/** The recurring plan of the contest. Saving it makes a new revision. */
export interface WeeklyProgram {
  id: Id
  revision: number
  /** IANA time zone the times are read in, for example "Europe/Istanbul". */
  timezone: string
  slots: ProgramSlot[]
  savedAt: IsoDate
  savedBy?: string
}

export type EpisodeStatus = 'draft' | 'scheduled' | 'live' | 'finished'

/** One slot in the running order: a question, a break, or a one-tap poll. */
export type EpisodeSlot =
  | { id: Id; kind: 'question'; questionId: Id; /** Overrides the question's own time. */ timeSec?: number; /** Overrides the question's own points. */ points?: number }
  | { id: Id; kind: 'break'; sec: number }
  | { id: Id; kind: 'poll'; surveyId: Id }

export interface Reminder {
  id: Id
  /** Minutes before the start. 0 means "it is starting now". */
  offsetMin: number
  channels: Channel[]
  sentAt?: IsoDate
  /** How many people each channel reached when it went out. */
  delivery?: Announcement['delivery']
}

export interface QuestionResult {
  questionId: Id
  answered: number
  correct: number
  avgSec: number
  /** How many people picked each option (by option id); other answer shapes leave it empty. */
  counts: Record<Id, number>
  /** Who got it right: used to tell whether strong players did better than weak ones. */
  correctBy: Id[]
}

export interface EpisodeResult {
  participants: number
  questions: QuestionResult[]
  /** Total points by participant (or bot) id. */
  scores: Record<Id, number>
}

export interface Episode {
  id: Id
  number: number
  /** The pack the show was served from: set when its lobby opens, so a later pack does not change a show that has begun. */
  packId?: Id
  title: string
  startsAt: IsoDate
  /** Minutes the broadcast slot lasts. The running order has to fit. */
  slotMin: number
  status: EpisodeStatus
  slots: EpisodeSlot[]
  reminders: Reminder[]
  /** The survey shown after the show. */
  surveyId?: Id
  result?: EpisodeResult
}

export type LivePhase = 'lobby' | 'reading' | 'open' | 'locked' | 'revealed' | 'break' | 'finished'

export interface LiveAnswer {
  value: AnswerValue
  /** Server time in milliseconds when the answer arrived. */
  at: number
}

/** Everything about a live show at one moment. The server's clock is the only clock: times here are server times. */
export interface LiveState {
  episodeId: Id
  phase: LivePhase
  /** Index of the slot on stage. */
  index: number
  /** When the current phase began, in server milliseconds. Remaining time is always worked out from this. */
  phaseStartedAt: number
  /** When the question on stage opened for answers. */
  openedAt?: number
  /** The same for every question so far, by question id. */
  opened: Record<Id, number>
  pausedAt?: number
  joined: Id[]
  /** People who arrived during a question: they wait for the next one. */
  waiting: Id[]
  answers: Record<Id, Record<Id, LiveAnswer>>
  scores: Record<Id, number>
  streaks: Record<Id, number>
  /** Points gained on the question that was just revealed. */
  gained: Record<Id, number>
}

export type LiveCommand =
  | { type: 'open-lobby'; episodeId: Id }
  | { type: 'join'; participantId: Id }
  | { type: 'start' | 'next' | 'lock' | 'reveal' | 'pause' | 'resume' | 'finish' | 'close' }
  | { type: 'answer'; participantId: Id; value: AnswerValue }

/** A command with the server time it was received at. The adapter adds `at`; callers never choose it. */
export type LiveEvent = LiveCommand & { at: number }

/* ---- Surveys ------------------------------------------------------------------------------------------------- */

export type SurveyQuestion =
  | { id: Id; type: 'nps'; prompt: string; optional?: boolean }
  | { id: Id; type: 'rating'; prompt: string; optional?: boolean }
  | { id: Id; type: 'likert'; prompt: string; points: 5 | 7; low: string; high: string; optional?: boolean }
  | { id: Id; type: 'choice'; prompt: string; options: ChoiceOption[]; optional?: boolean }
  | { id: Id; type: 'multiple'; prompt: string; options: ChoiceOption[]; optional?: boolean }
  | { id: Id; type: 'text'; prompt: string; optional?: boolean; maxLength?: number }

/** A number (nps, rating, likert), an option id, a list of option ids, or text. */
export type SurveyAnswer = number | string | string[]

export interface Survey {
  id: Id
  title: string
  kind: 'nps' | 'pulse' | 'custom'
  questions: SurveyQuestion[]
  anonymous: boolean
  opensAt?: IsoDate
  closesAt?: IsoDate
}

export interface SurveyResponse {
  id: Id
  surveyId: Id
  episodeId?: Id
  /** Missing for an anonymous survey. */
  participantId?: Id
  at: IsoDate
  answers: Record<Id, SurveyAnswer>
}

/* ---- Notification preferences --------------------------------------------------------------------------------- */

export type NotificationCategory = 'episode' | 'results' | 'announcement' | 'survey'

export interface NotificationPrefs {
  participantId: Id
  matrix: Record<NotificationCategory, Record<Channel, boolean>>
  /** Push and e-mail wait while this lasts. "HH:mm" in 24 hours, in the given time zone. Critical messages still arrive. */
  quiet?: { from: string; to: string; timezone: string }
  /** `daily` holds non-critical e-mail and push for a once-a-day summary. */
  digest: 'off' | 'daily'
}
