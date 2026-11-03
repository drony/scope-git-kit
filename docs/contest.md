# The contest layer

`src/contest` is a second reusable layer, built on the kit, for contest platforms: questions and answers, answer keys, media,
announcements and notifications, participants, scoring and rankings, and the **weekly live show** (choosing questions, the live
stage, surveys and reminders). **Contest Scope** (`src/apps/contest`) is the demo app that
shows it working. Finscope, the first app, does not use it.

```
kit      no domain knowledge                         (copy it anywhere)
contest  contest components + data layer, kit only   (copy kit + contest into a contest project)
apps     pages, layout, theme and seed, per product
```

`npm run check:layers` enforces this: `src/contest` imports the kit and npm packages, never an app.

## Run it

```bash
npm run dev:contest      # http://localhost:5174
```

The demo's data lives in the browser (memory and `localStorage`). The footer button **Reset demo data** starts again from the seed.
The seed is anchored to today, so "yesterday", countdowns and schedules always make sense.

## The data model

Plain types in `src/contest/data/types.ts`: no React, no fetching.

| Area | Types |
| --- | --- |
| Contest | `Contest`, `Round`, `Prize` |
| Questions | `Question` (ten types: single, multiple, true or false, picture choice, short, long, number, ordering, matching, upload), `ChoiceOption` |
| Content packs | `Topic`, `ContentPack` (revision, topics, pinned items), `PackItem`; a show remembers its `packId` |
| Version gate | `VersionGate` (revision, message, start time, emergency), `StoreGate` (minimum, suggested and blocked builds, update link, builds in the store), `BuildUsage`, `ClientInfo` on a participant |
| Reports and moderation | `Report` (about a player or a question), `ReportResolution`, `Violation` (warning, suspension, disqualification), `Claim` |
| Question review | `QuestionReview` (stage, author, first reviewer, reason, history), `ReviewStage`, `ReviewAction`, `ReviewEvent` |
| Answer keys (back office only) | `AnswerKey`: choice, text (accepted wordings with credit), number (with tolerance), ordering, matching, manual (rubric) |
| Answers | `Answer`, `AnswerValue`, `Submission`, `Score` (points, `auto`, note, reviewer, rubric `breakdown`) |
| People | `Participant` (invited, active, finished, disqualified) |
| Media | `MediaAsset` (with a non-destructive crop, focal point and moderation state) |
| Communication | `Announcement` (audience, channels, schedule, delivery report), `Notification`, `Audience` |
| Weekly program | `WeeklyProgram` (revision, time zone, slots), `ProgramSlot` (weekday, time, topic, quota, final seats; daily or final), registrations by occurrence key |
| Weekly show | `Episode` (slots: question, break, poll; reminders; result), `Difficulty` (1 to 5), `QuestionSource` |
| Live show | `LiveState` (phase, index, answers, scores, streaks), `LiveCommand`, `LiveEvent` |
| Surveys | `Survey`, `SurveyQuestion` (NPS, rating, Likert, choice, multiple, text), `SurveyResponse` |
| Preferences | `NotificationPrefs` (kind of message by channel, quiet hours, daily summary) |
| History | `AuditEntry` (with `before` and `after` snapshots, and `of` on a revert) |

## The backend contract

Contest components never fetch. The app gets data from a **`ContestAdapter`** (`data/adapter.ts`), usually through the hooks in
`contest/hooks` (`useQuestions`, `useMedia`, `useAnnouncements`, …), and passes it to components as props.

```tsx
<ContestProvider adapter={adapter}>   {/* createMemoryAdapter(seed) for the demo, your own in production */}
  <App />
</ContestProvider>
```

A real backend implements the same interface, so no component changes. Method families: contest, questions, answer keys, media
(upload with progress and abort), participants (including `inviteParticipants`), submissions (`saveAnswer`, `submit`, `saveScore`),
announcements (`saveAnnouncement`, `sendAnnouncement`), notifications, content packs (`getPacks`, `publishPack`, `restorePack`, `saveTopic`), the version gate (`getGate`, `saveGate`), reports (`getModeration`, `claimCase`, `resolveCase`), question review (`reviewQuestions`), the weekly program (`getProgram`, `saveProgram`,
`listRegistrations`), the weekly show (`listEpisodes`, `saveEpisode`), surveys
(`listSurveys`, `saveSurvey`, `submitSurveyResponse`, `listSurveyResponses`), notification preferences (`getPrefs`, `savePrefs`),
and the audit trail (`listAudit`, `revert`).

### The audit trail contract

Every write of the adapter is an `AuditEntry`: who (`actor`), what kind of thing (`entity`) and which one (`entityId`), what was done
(`action`: create, update, delete, publish, revert), a sentence (`summary`), and the thing before and after (`before`, `after`).
`listAudit()` returns them newest first. The trail is **append-only**: an entry is never edited or removed.

- **A revert is a new entry.** `revert(id)` puts a question, an answer key, a media file or the contest back as it was before the entry,
  and writes an entry with `of` set to the one it reverted. The old entry stays, and the screen shows it struck through with the name
  of who reverted it. A revert cannot be reverted: make the change again.
- **Not everything can be reverted.** People, scores, announcements, shows, the program, the gate, packs and topics are kept for the
  record. A change to the gate, the program or a pack is a new revision instead, so history stays whole. `revertRule` says why not.
- **A revert undoes later changes too.** It restores the snapshot from before the entry, so changes made to the same thing after it are
  lost. The panel counts them (`laterChanges`) and the confirmation says so.
- **A diff is words, not JSON.** `diffEntry` lists the fields that changed with the value before and after. A list of things with ids
  says what was added, removed and changed in it, and what changed inside an item. Times, ids and history lists are left out.
- **Sensitive entries stand out.** A deletion, a revert, a change to the gate, a new pack and a decision that suspends or disqualifies are
  marked with a shield and can be filtered ("Sensitive only") and seen in red in the activity bars.
- **The trail can leave the screen.** `auditToCsv` writes the filtered entries as CSV; a cell that a spreadsheet would read as a formula
  gets an apostrophe in front.

### The content pack contract

A **pack** is a snapshot of the approved questions of some topics, as the shows serve them. Every question in it is pinned to the
version it had (`updatedAt`), so editing the bank never changes what is served. A pack is never edited: a change is a new pack, and
the one before it is retired. A topic is a stable id (a question tag), a name for people, and an archived flag. `getPacks()` returns
the topics and every pack; `publishPack`, `restorePack` and `saveTopic` are the writes.

- **The server builds the pack.** `publishPack({ topics, note })` only chooses topics. The server takes the approved, ready
  questions of those topics (`isPackable`: approved, a topic that is not archived, nothing left to fix) and pins them. A client cannot
  put a question in by hand.
- **Publishing is checked.** An archived topic, a topic with no approved question, a note under five characters and a pack equal to
  the one in force are refused. A topic that lasts less than four weeks of its daily show, or has no question of level 4 or 5, is a
  warning (`packProblems`).
- **Drift is visible.** `diffPack` says what moved in the bank since the pack was made: approved since, edited since, and the worst
  kind, questions that were returned to review or deleted but are still served. A topic that was archived since shows too.
- **Coverage has a runway.** `coverage` counts how many weeks of the daily shows the served questions of a topic last (six
  questions per show). Thin means less than four weeks.
- **A rollback is a new pack.** `restorePack` publishes the old pack again with its pinned versions, leaving out questions that are no
  longer approved or whose topic is archived, so a rollback never serves a withdrawn question. History is never rewritten.
- **A show keeps its pack.** Opening the lobby writes the pack in force into `Episode.packId`. A real backend serves the show from
  that pack, so a pack published while the show is on air changes nothing for it. The demo still reads questions from the bank.
- **The line-up knows.** `episodeChecks` warns when a question is approved but not in the pack in force.

### The version gate contract

The gate says which builds of the app may play. It has one rule per store (App Store, TestFlight, Google Play): a **minimum** build
below which a player must update, a **suggested** build below which a player gets a prompt they can close, and **blocked** builds
that are stopped even above the minimum. Build numbers only grow, so older means lower. A participant has a `client` (store and
build); without one, no rule applies. `getGate()` returns the gate in force, the one that starts later (if any) and how many players
use each build; `saveGate(gate, { confirmed })` is the only write.

- **A gate that locks people out is refused.** A minimum or a suggested build above the newest build in the store, a suggested build
  below the minimum, every build blocked, a link that is not https and an empty message are errors (`gateProblems`). The server
  keeps the list of builds the store offers; a client cannot change it.
- **A big change needs a yes.** `reviewGate` counts the players a change would newly stop. When a store would stop a tenth of its
  players or more, or the gate is an emergency, the change is refused unless `confirmed` is true. The screen shows the same numbers
  before the save (`GateImpact`).
- **It can start later.** A start time in the future keeps the gate in force as it is and stores the new one as `next`; it takes
  over when its time comes. A start time that falls from half an hour before a show until it ends is flagged.
- **An emergency applies at once.** It ignores the start time and also takes people on stopped builds out of the live show that is on
  air. Without it, a build that is too old is stopped at the next join, never in the middle of a show.
- **Enforced at the door.** `sendLive` refuses a join from a build that may not play, with the message of the gate. A real backend
  enforces it wherever a person acts.

### The moderation contract

A player reports a player (cheating, abuse, impersonation, another rule) or a question (wrong answer, unclear, offensive). The open
reports about one target are **one case**; a decision closes all of them. `getModeration()` returns the reports, the violations and
who is working on which case in one read; `claimCase` and `resolveCase` are the writes.

- **Urgency has reasons.** `priorityOf` adds points for how serious the reason is, how many different people reported, what the data
  shows, earlier violations and how long the case waited, and each point has a sentence. A case that waited longer than its priority
  allows is overdue. There is no hidden score.
- **The data is read, not guessed.** `playerSignals` looks at the answers (answers within three seconds, wrong answers that few
  others gave and another player gave too) and `questionSignals` at how many people got a question right against its level.
- **Reporters have a record.** A reporter whose earlier reports led to action is "usually right"; one who was dismissed most of the
  time is "often wrong" and lowers the priority a point.
- **The gate is enforced at one door.** The demo checks the build of a participant when they join a live show (`/live` shows the
  update screen for the demo player). Nothing checks the real app, and the player counts per build are seed data.
- **Suspension is enforced at one door.** The adapter refuses a suspended or disqualified participant at `sendLive` (join). A real
  backend enforces it wherever a person acts. Nobody is told: a real backend would notify the reporters and the player, and offer an appeal.
- **One person at a time.** `claimCase` marks the case as being worked on. Someone else can take it over; only the person who holds
  it can release it. `resolveCase` refuses a case that someone else holds.
- **The ladder.** `suggestAction` proposes a warning, then 3 days, then 7 days, then disqualification, one step higher when the data is
  strong. The moderator can choose any action; the reason is always required.
- **A decision has consequences.** A warning, a suspension (1 to 30 days) or a disqualification is a `Violation`. A disqualified
  participant leaves the ranking and every announcement. A suspended or disqualified participant cannot join a live show (`sendLive`
  refuses with the reason). Withdrawing a question sends it back to review with the reports as the reason, and is refused while a show
  that has not finished uses it. Dismissing records nothing against anyone.

### The question review contract

A question goes from a draft to the bank in steps, and the rules sit in `lib/review.ts` as plain functions (`reviewActions`,
`applyReview`, `bulkPlan`) that the screen and the backend share. `reviewQuestions(ids, action, { note }, actor)` is the one write.

| From | Action | To | Who can do it |
| --- | --- | --- | --- |
| draft, returned | send for review | waiting | anyone, when the question is ready (see `readiness`) |
| waiting | pre-approve | pre-approved | anyone but the writer |
| pre-approved | approve | approved | anyone but the writer and the first reviewer |
| waiting, pre-approved | return (with a reason) | returned | any reviewer |
| approved | withdraw (with a reason) | returned | any reviewer, when no unfinished show uses it |
| any but approved | move to trash | trash | anyone, when no unfinished show uses it |
| trash | restore | draft | anyone |

- **Four eyes.** Nobody pre-approves or approves a question they wrote, and the final approval comes from someone other than the
  first reviewer. `ReviewPolicy.twoStep` set to `false` lets one reviewer approve.
- **Only approved is published.** `statusFor(stage)` maps a stage to the question's `status`; a question with no review record
  keeps working, its stage follows its status. Setting the status by hand in the editor is a shortcut: the review follows it and
  logs an `edit` event.
- **A return needs a reason.** A return or a withdrawal takes a `note` of at least five characters; the writer sees it.
- **Each question is checked on its own.** The call returns `{ changed, skipped }`: a question that cannot be changed (the actor
  wrote it, it is not ready to send, it is in a show that has not finished) is left out with the reason and the others are changed.
  `bulkPlan` is the same check as a dry run, so a button can say "Pre-approve 4 of 6" before anyone presses it.
- **History and undo.** Every change is an audit entry with a before and an after, so the existing `revert` puts a question back.

### The weekly program contract

The program says which shows run on which day: Monday to Saturday a daily show, and a final that the daily shows lead to. Each
slot has a start time on the wall clock of the program's time zone, a topic, a quota and, for a daily show, the number of final
seats its best players win. `occurrences(program, from, days)` turns the slots into dated shows (`slotId@YYYY-MM-DD`, the key of
the registrations); a real backend can run the same function.

`saveProgram(program, { confirmed })` is the only write, and the server holds the rules (the pure functions `impactOf` and
`programChecks` say the same thing to the screen before the save):

- **A show that is on air is locked.** Any change to it is refused.
- **A show people registered for needs a yes.** The change is refused unless `confirmed` is true. The message says how many people
  it touches (for the next show and for the coming weeks).
- **Errors are refused.** Overlapping shows, more final seats than the final has room for, a missing topic or quota.
- **The server sets the revision and the time.** A client cannot choose them.

### The live show contract

The live show has two methods. A real backend must keep **one clock**: the server's.

| Method | What it does |
| --- | --- |
| `getLive()` | Returns the show now, or `null`. The state is worked up to the server clock before it is returned, so a reader that missed a moment still sees the right phase. |
| `sendLive(command)` | Applies one `LiveCommand` (`open-lobby`, `join`, `start`, `next`, `lock`, `reveal`, `pause`, `resume`, `finish`, `close`, `answer`) and returns the new state. The server adds the time (`LiveEvent.at`); callers never choose it. |

The rules live in the pure functions of `lib/live.ts`, so a backend can run the same code (`liveReduce`, `tick`, `remainingMs`,
`scoreLive`):

- **Phases:** lobby, reading (3 s), open, locked, revealed, break, finished. The clock moves a phase on by itself when its time is
  over; the host can move it earlier.
- **The first answer counts.** It cannot be changed. An answer after the time is refused.
- **Late joiners wait.** A person who joins during a question plays from the next one.
- **Points:** a right answer earns the points of the question, reduced down to half by the time used. A wrong one earns nothing.
- **Pause** shifts the phase start by the length of the pause, so no time is lost.
- Clients ask again every few hundred milliseconds (`useLive`) and draw the countdown from the server's time.

### What the in-memory adapter does, and where it stops

`createMemoryAdapter` behaves like a backend: calls are asynchronous, return copies and write an audit trail; submissions are
scored from the answer keys; uploads report progress and can fail. Its limits are deliberate:

- **No timer.** A scheduled announcement that is due is sent the next time announcements or notifications are read. A real backend
  would use a job.
- **Push needs a device.** Push does not reach people who are still "invited" (they never opened the app). The delivery report
  shows that miss and its reason.
- **Reminders and preferences.** A reminder of a show is sent when it is due and the next read happens. Each message passes
  `allowed` first: a channel that is off skips it, quiet hours or the daily summary hold it, and a critical message ("starting
  now") ignores quiet hours.
- **Registrations leave with a moved or removed show.** The adapter deletes them; a real backend tells those people.
- **One person at a time.** The demo editor is "Ada" (`EDITOR` in `src/apps/contest/data.ts`), so the four-eyes rules show: some
  questions wait for her, some she wrote, some she pre-approved. A real backend knows the signed-in person.
- **No second player.** The live state is in memory, and the people who answer are bots (`useLiveSimulation`, seeded, so a demo
  repeats). A real show has real players on their own screens.
- **A submission is "reviewed"** when no answer waits for a person. An answer waits when its score is `auto: false` and has no
  `reviewer`.
- **Reverting** works for questions, answer keys, media and the contest. Participant, score and announcement entries are logged
  but cannot be reverted yet.

## Components by family

Every component takes props, fetches nothing, is built from kit components and is listed in the
[component reference](./components/README.md) with props, an example and notes.

| Family | Components | Reference |
| --- | --- | --- |
| Questions and answers | `QuestionQuickEditor`, `QuestionImport`, `QuestionComposer`, `AnswerOptionsEditor`, `AnswerKeyEditor`, `QuestionPreview`, `QuestionView`, `AnswerInput`, `QuestionBank`, `QuizRunner` | [Questions & answers](./components/contest-questions.md) |
| Media | `MediaUploader`, `MediaLibrary`, `MediaViewer`, `MediaPicker`, `CroppedImage`, `ImageCropper`, `MediaModeration` | [Media](./components/contest-media.md) |
| Announcements and notifications | `AnnouncementComposer`, `ChannelPreview`, `DeliveryStatus`, `AnnouncementFeed`, `NotificationCenter`, `ReminderPlanner`, `NotificationPreferences`, `PushPrimer` | [Announcements & notifications](./components/contest-communication.md) |
| Audit trail | `AuditActivity`, `AuditFilters`, `AuditFeed`, `AuditDiff`, `AuditEntryPanel` | [Audit trail](./components/contest-audit.md) |
| Content packs | `PackStatus`, `PackCoverage`, `PackDiffList`, `PackBuilder`, `PackHistory`, `TopicManager` | [Content packs](./components/contest-packs.md) |
| Version gate | `BuildLadder`, `StoreGateEditor`, `GateImpact`, `GateSimulator`, `UpdateScreen` | [Version gate](./components/contest-versions.md) |
| Reports and moderation | `CaseQueue`, `CasePanel`, `RiskSignals`, `DecisionForm`, `ViolationHistory`, `ReportLog` | [Reports & moderation](./components/contest-moderation.md) |
| Question review | `ReviewRail`, `ReviewQueue`, `ReviewBar`, `ReviewPanel`, `ReviewHistory`, `ReviewReasonDialog` | [Question review](./components/contest-review.md) |
| Weekly program | `ProgramBoard`, `SlotEditor`, `QuotaMeter`, `QualificationFlow`, `ProgramChecks`, `ProgramImpact`, `UpcomingShows` | [Weekly program](./components/contest-program.md) |
| Weekly show | `DifficultyMeter`, `TimeDial`, `SourceField`, `SourceBadge`, `QuestionPicker`, `EpisodeBuilder`, `EpisodeCard`, `RunOfShow`, `DifficultyCalibration` | [Weekly show](./components/contest-weekly.md) |
| Live show | `LiveLobby`, `LiveStage`, `HostConsole`, `AnswerDistribution`, `LiveScoreboard`, `EpisodeRecap` | [Live show](./components/contest-live.md) |
| Surveys and polls | `NpsScale`, `RatingScale`, `LikertScale`, `SurveyQuestionInput`, `PollCard`, `SurveyRunner`, `SurveyBuilder`, `SurveyResults` | [Surveys & polls](./components/contest-surveys.md) |
| Participants and scoring | `ParticipantTable`, `ParticipantDrawer`, `InviteDialog`, `SubmissionReview`, `RubricScorer`, `Leaderboard`, `Podium`, `ScoreHeatGrid` | [Participants & scoring](./components/contest-people.md) |
| Data and hooks | `ContestProvider`, `ContestAdapter`, `createMemoryAdapter`, the data hooks, `useRankReplay` | [Data & hooks](./components/contest-data.md) |
| Pure functions | scoring, question types, upload rules, crop maths, audiences, merge fields, rankings, invite parsing, dates | [Scoring & rules](./components/contest-rules.md) |

Ideas worth knowing about:

- **One answer input.** The quiz, the preview in the editor, the "Try an answer" box and the review screen all use `AnswerInput`, so
  they cannot drift apart.
- **Try before you publish.** `AnswerKeyEditor` scores a sample answer with the same `scoreAnswer` that scores real submissions.
- **One audience function.** `audienceOf` counts "N people will get this" in the composer and picks the recipients in the backend.
- **Non-destructive media.** A crop, rotation and focal point are numbers on the `MediaAsset`; `CroppedImage` draws the right part.
- **A change is told in words.** `AuditDiff` says "Points 15 → 20" and "Added: Mars", never a block of JSON, and a revert shows how many
  later changes it would undo before anyone confirms it.
- **Drift is shown, not hidden.** `PackStatus` leads with the worst thing the pack still does: serve a question that was returned to
  review. The bank can move freely because the pack pins what is served; the screen says how far they have drifted apart.
- **The effect is seen before it is saved.** `BuildLadder` colours every build by what the gate tells it, so moving the minimum
  shows at once how many players it stops, and `GateSimulator` shows the exact screen a player on any build would get.
- **A priority is explained.** `RiskSignals` lists every point of a case's priority with its reason, and what the data shows with
  how strong it is. A moderator can disagree with a number because they can read how it was made.
- **The decision shows its consequences first.** `DecisionForm` says in plain words who is affected and how ("Gus Petrov cannot join
  live shows until Nov 6") before anyone presses the button, and suggests the next step on the ladder without forcing it.
- **Nothing is skipped in silence.** A bulk action says how many questions it will change and why it leaves the others out, before
  and after it runs.
- **The reviewer sees the key.** `ReviewPanel` marks the right answer and lists what to check (no source, a source that is only
  Wikipedia, a missing level), so a question is approved on facts, not on how it looks.
- **A change is reviewed before it is saved.** `ProgramImpact` lists every changed show with what it does to the people who
  registered: safe, needs a confirmation, or locked. Editing happens on a draft; the board, the seats bar and the checks show the
  draft at once.
- **Times belong to a zone, not to the browser.** A show at 20:00 in Istanbul is 20:00 for everyone, and stays 20:00 across summer
  time (`instantOn`).
- **Difficulty is checked against reality.** A writer gives a level from 1 (Warm-up) to 5 (Finale). After 30 answers
  `DifficultyCalibration` compares it with the share of people who got it right and offers to move the question. A question that
  the best and the worst players answer alike (discrimination below 0.25) is flagged.
- **The show has a shape.** `EpisodeBuilder` draws the difficulty curve against the usual build-up and `episodeChecks` says what
  is wrong: a missing source, an answer key that is not complete, a flat curve, too many hard questions, a show that runs over its slot.
- **Sources stay behind the scenes.** An editor records where an answer was checked; `SourceBadge` shows how far to trust it.
  A question that rests only on Wikipedia gets a warning. Participants never see sources.
- **Surveys stay short.** `surveyProblems` warns above five questions and for leading words, and keeps the standard NPS sentence.
- **Write fast.** `QuestionQuickEditor` makes the answer key while the writer types the options, and `QuestionImport` reads a pasted list.
- **Keyboard first** where people work fast: the moderation wall (A, R, F, Z), the rubric sliders, `Ctrl+Enter` to save a score.

## The Contest Scope app

| Route | What it shows |
| --- | --- |
| `/` | Home |
| `/play` | The quiz for the demo participant (`ME` in `src/apps/contest/data.ts`), saved as you go |
| `/leaderboard`, `/announcements` | The participant's view of the ranking and the news; the bell in the header shows notifications |
| `/admin/questions` | Question bank, quick editor, paste many questions, answer keys, difficulty calibration |
| `/admin/audit` | The audit trail: changes per day, filters, the list of changes, one change in full with its diff and revert, and an export |
| `/admin/packs` | Content packs: the pack in force and how far the bank has moved, coverage by topic, the next pack, the history with restore, and the topics |
| `/admin/versions` | The version gate: players by build, the rule per store, the message and start time, the simulator, and the review before a save |
| `/admin/moderation` | Reports as cases: the queue by urgency, one case with its reports, evidence, record and decision, what was decided, and the violations of each player |
| `/admin/review` | Question review: views with counts, a queue, bulk actions, one question with its answer, checks and history, a reason for every return |
| `/admin/media` | Media library, upload, viewer with crop, review queue |
| `/admin/weekly` | The weekly shows: calendar, line-up with difficulty curve, question picker, run of show, reminders. The **Program** view holds the week board, the show editor, the seats to the final, checks and the review before a save |
| `/admin/host` | The host console and the player view side by side, with pretend players, scoreboard and answer bars |
| `/admin/surveys` | Build surveys, see the results and the NPS trend |
| `/live` | The player's view of the live show: lobby, stage, recap. Between shows it shows the next show and this week's program |
| `/survey/:id`, `/preferences` | Answer a survey; choose what notifications reach you |
| `/admin/participants` | Table, participant drawer, invite by pasting a list |
| `/admin/submissions` | Review answers next to the key, change points, score by rubric |
| `/admin/announcements` | Write, preview per channel, schedule and send; delivery report |
| `/admin/results` | Podium, leaderboard, heat grid, score spread |
| `/components` | Live examples and the API reference of this layer |
| `/settings` | The theme editor. The app keeps its own `settings/app.config.json`, set to the same look as Finscope |

## Use it in another project

Copy `src/kit` and `src/contest` into your project, install the kit's dependencies, import `@/kit/styles/index.css` and
`@/contest/styles/index.css`, wrap the app in `ConfigProvider`, `ToastProvider` and `ContestProvider`, and write a `ContestAdapter`
for your backend. The contest layer adds no dependencies of its own.
