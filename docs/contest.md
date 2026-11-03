# The contest layer

`src/contest` is a second reusable layer, built on the kit, for contest platforms: questions and answers, answer keys, media,
announcements and notifications, participants, scoring and rankings. **Contest Scope** (`src/apps/contest`) is the demo app that
shows it working. Finscope, the first app, does not use it.

```
kit      no domain knowledge                         (copy it anywhere)
contest  contest components + data layer, kit only   (copy kit + contest into a contest project)
apps     pages, layout, theme and seed, per product
```

`npm run check:layers` enforces this: `src/contest` imports the kit and npm packages, never an app.

## Run it

```bash
npm run dev:contest      # http://localhost:5173
```

The demo's data lives in the browser (memory and `localStorage`). The footer button **Reset demo data** starts again from the seed.
The seed is anchored to today, so "yesterday", countdowns and schedules always make sense.

## The data model

Plain types in `src/contest/data/types.ts`: no React, no fetching.

| Area | Types |
| --- | --- |
| Contest | `Contest`, `Round`, `Prize` |
| Questions | `Question` (ten types: single, multiple, true or false, picture choice, short, long, number, ordering, matching, upload), `ChoiceOption` |
| Answer keys (back office only) | `AnswerKey`: choice, text (accepted wordings with credit), number (with tolerance), ordering, matching, manual (rubric) |
| Answers | `Answer`, `AnswerValue`, `Submission`, `Score` (points, `auto`, note, reviewer, rubric `breakdown`) |
| People | `Participant` (invited, active, finished, disqualified) |
| Media | `MediaAsset` (with a non-destructive crop, focal point and moderation state) |
| Communication | `Announcement` (audience, channels, schedule, delivery report), `Notification`, `Audience` |
| History | `AuditEntry` (with `before` and `after` snapshots) |

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
announcements (`saveAnnouncement`, `sendAnnouncement`), notifications, and the audit trail (`listAudit`, `revert`).

### What the in-memory adapter does, and where it stops

`createMemoryAdapter` behaves like a backend: calls are asynchronous, return copies and write an audit trail; submissions are
scored from the answer keys; uploads report progress and can fail. Its limits are deliberate:

- **No timer.** A scheduled announcement that is due is sent the next time announcements or notifications are read. A real backend
  would use a job.
- **Push needs a device.** Push does not reach people who are still "invited" (they never opened the app). The delivery report
  shows that miss and its reason.
- **A submission is "reviewed"** when no answer waits for a person. An answer waits when its score is `auto: false` and has no
  `reviewer`.
- **Reverting** works for questions, answer keys, media and the contest. Participant, score and announcement entries are logged
  but cannot be reverted yet.

## Components by family

Every component takes props, fetches nothing, is built from kit components and is listed in the
[component reference](./components/README.md) with props, an example and notes.

| Family | Components | Reference |
| --- | --- | --- |
| Questions and answers | `QuestionComposer`, `AnswerOptionsEditor`, `AnswerKeyEditor`, `QuestionPreview`, `QuestionView`, `AnswerInput`, `QuestionBank`, `QuizRunner` | [Questions & answers](./components/contest-questions.md) |
| Media | `MediaUploader`, `MediaLibrary`, `MediaViewer`, `MediaPicker`, `CroppedImage`, `ImageCropper`, `MediaModeration` | [Media](./components/contest-media.md) |
| Announcements and notifications | `AnnouncementComposer`, `ChannelPreview`, `DeliveryStatus`, `AnnouncementFeed`, `NotificationCenter` | [Announcements & notifications](./components/contest-communication.md) |
| Participants and scoring | `ParticipantTable`, `ParticipantDrawer`, `InviteDialog`, `SubmissionReview`, `RubricScorer`, `Leaderboard`, `Podium`, `ScoreHeatGrid` | [Participants & scoring](./components/contest-people.md) |
| Data and hooks | `ContestProvider`, `ContestAdapter`, `createMemoryAdapter`, the data hooks, `useRankReplay` | [Data & hooks](./components/contest-data.md) |
| Pure functions | scoring, question types, upload rules, crop maths, audiences, merge fields, rankings, invite parsing, dates | [Scoring & rules](./components/contest-rules.md) |

Ideas worth knowing about:

- **One answer input.** The quiz, the preview in the editor, the "Try an answer" box and the review screen all use `AnswerInput`, so
  they cannot drift apart.
- **Try before you publish.** `AnswerKeyEditor` scores a sample answer with the same `scoreAnswer` that scores real submissions.
- **One audience function.** `audienceOf` counts "N people will get this" in the composer and picks the recipients in the backend.
- **Non-destructive media.** A crop, rotation and focal point are numbers on the `MediaAsset`; `CroppedImage` draws the right part.
- **Keyboard first** where people work fast: the moderation wall (A, R, F, Z), the rubric sliders, `Ctrl+Enter` to save a score.

## The Contest Scope app

| Route | What it shows |
| --- | --- |
| `/` | Home |
| `/play` | The quiz for the demo participant (`ME` in `src/apps/contest/data.ts`), saved as you go |
| `/leaderboard`, `/announcements` | The participant's view of the ranking and the news; the bell in the header shows notifications |
| `/admin/questions` | Question bank, editor with live preview, answer keys |
| `/admin/media` | Media library, upload, viewer with crop, review queue |
| `/admin/participants` | Table, participant drawer, invite by pasting a list |
| `/admin/submissions` | Review answers next to the key, change points, score by rubric |
| `/admin/announcements` | Write, preview per channel, schedule and send; delivery report |
| `/admin/results` | Podium, leaderboard, heat grid, score spread |
| `/components` | Live examples and the API reference of this layer |
| `/settings` | The theme editor; this app has its own theme in `settings/app.config.json` |

## Use it in another project

Copy `src/kit` and `src/contest` into your project, install the kit's dependencies, import `@/kit/styles/index.css` and
`@/contest/styles/index.css`, wrap the app in `ConfigProvider`, `ToastProvider` and `ContestProvider`, and write a `ContestAdapter`
for your backend. The contest layer adds no dependencies of its own.
