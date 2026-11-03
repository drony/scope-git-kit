import { prop, type ContestDoc } from './define.ts'

export const dataDocs: ContestDoc[] = [
  {
    id: 'contest-provider',
    name: 'ContestProvider',
    group: 'data',
    summary: 'Gives the data hooks their backend. Contest components themselves never read it: they take props.',
    source: 'contest/context/ContestContext.tsx',
    exports: ['ContestProvider', 'useContestAdapter'],
    imports: ['ContestProvider'],
    props: [
      prop('adapter', 'ContestAdapter', 'The backend: `createMemoryAdapter(seed)` for demos, your own implementation in production.', { required: true }),
      prop('children', 'ReactNode', 'The app.', { required: true }),
    ],
    example: `const adapter = createMemoryAdapter(seed)

<ContestProvider adapter={adapter}>
  <App />
</ContestProvider>`,
    notes: ['`useContestAdapter()` returns the adapter and throws a clear error outside the provider.'],
  },
  {
    id: 'contest-adapter',
    name: 'ContestAdapter',
    group: 'data',
    kind: 'type',
    summary: 'Everything a contest app needs from a backend, as one typed interface. A real backend implements it; the in-memory adapter is the one that ships.',
    source: 'contest/data/adapter.ts',
    example: `const adapter: ContestAdapter = {
  listQuestions: () => fetch('/api/questions').then((r) => r.json()),
  // …every other method of the interface
}`,
    notes: [
      'Each write takes an optional `actor`: the name written into the audit trail.',
      '`revert(auditId)` puts an entity back the way it was before an entry. Only entries that kept a `before` snapshot can be reverted.',
      '`sendAnnouncement` fills the merge fields for each recipient, writes the in-app notifications and records how many people each channel reached (`Announcement.delivery`).',
      '`inviteParticipants` adds people as "invited" and skips an e-mail address that is already in the contest.',
    ],
  },
  {
    id: 'create-memory-adapter',
    name: 'createMemoryAdapter',
    group: 'data',
    kind: 'utility',
    summary: 'A ContestAdapter that keeps everything in memory and in localStorage. It behaves like a backend: calls are asynchronous, writes leave an audit trail, submissions are scored from the answer keys, and uploads report progress and can fail.',
    source: 'contest/data/memoryAdapter.ts',
    props: [
      prop('seed', 'ContestState', 'The starting data.', { required: true }),
      prop('storageKey', 'string | null', 'localStorage key for the saved state. `null` keeps it in memory only.', { default: "'contest.state'" }),
      prop('latencyMs', 'number', 'Pretend network delay for every call.', { default: '120' }),
      prop('uploadFailureRate', 'number', 'Share of uploads (0 to 1) that fail at the end, to see the error and retry states.', { default: '0' }),
      prop('actor', 'string', 'Name written into the audit trail when a call does not pass one.', { default: "'Admin'" }),
    ],
    example: `const adapter = createMemoryAdapter(seed, { latencyMs: 200, uploadFailureRate: 0.2 })
adapter.reset() // back to the seed`,
    notes: [
      'Returned objects are copies, so changing one never changes the stored state.',
      '`reset()` and `setUploadFailureRate(rate)` exist for demos and tests.',
      'There is no timer: a scheduled announcement that is due is sent the next time announcements or notifications are read. A real backend would use a job.',
      'Push reaches nobody who is still "invited" (no device yet), which gives the delivery report something to show.',
      'A submission becomes "reviewed" when no answer is left waiting for a person.',
    ],
  },
  {
    id: 'use-resource',
    name: 'useResource',
    group: 'data',
    kind: 'hook',
    summary: 'Loads one thing and keeps it in state, with `loading`, `error`, `reload` and `mutate`. The small base the other contest hooks are built on.',
    source: 'contest/hooks/useResource.ts',
    props: [
      prop('load', '() => Promise<T>', 'Fetches the value.', { required: true }),
      prop('deps', 'unknown[]', 'Loads again when one of these changes.', { default: '[]' }),
      prop('options', '{ pollMs?: number }', 'With `pollMs` it asks again every that many milliseconds, for news that arrives from elsewhere.', { default: '{}' }),
    ],
    example: `const { data, loading, error, mutate } = useResource(() => api.listQuestions())
await mutate(() => api.deleteQuestion(id)) // runs the change, then reloads`,
    notes: ['`reload` keeps the old data on screen while it loads. `mutate` rejects with the original error so the caller can show it next to its form.'],
  },
  {
    id: 'use-packs',
    name: 'usePacks',
    group: 'data',
    kind: 'hook',
    summary: 'The topics and every pack, with `publish`, `restore` and `saveTopic`. Each write loads the snapshot again and rejects with a sentence when it is not allowed.',
    source: 'contest/hooks/useContestData.ts',
    props: [],
    example: `const { data, publish, restore, saveTopic } = usePacks()
await publish({ topics: ['science', 'geography'], note: 'The new geography questions.' }, 'Ada')
await restore('pack-r3', 'The new pack had a problem.', 'Ada')`,
    notes: ['The server builds the pack from the approved questions: `publish` only chooses topics. It refuses an archived topic, a topic with no approved question, a note that is too short and a pack equal to the one in force.'],
  },
  {
    id: 'use-gate',
    name: 'useGate',
    group: 'data',
    kind: 'hook',
    summary: 'The version gate in force, the one that starts later (if any), and how many players use each build, with `save`. Saving sends a new revision; the server keeps the list of builds the store offers.',
    source: 'contest/hooks/useContestData.ts',
    props: [prop('pollMs', 'number', 'Ask again every this many milliseconds. 0 means once.', { default: '0' })],
    example: `const { data, save } = useGate(4000)
const rule = gateInForce(data.current, data.next, Date.now())
await save({ ...draft, message: 'Please update.' }, { confirmed: true }, 'Ada')`,
    notes: ['`save` rejects with a sentence when the gate is not allowed: a minimum above the newest build, a link that is not https, a change that needs a confirmation.'],
  },
  {
    id: 'use-moderation',
    name: 'useModeration',
    group: 'data',
    kind: 'hook',
    summary: 'The reports, the violations and who is working on which case, with `claim`, `release` and `resolve`. Every write loads the snapshot again.',
    source: 'contest/hooks/useContestData.ts',
    props: [prop('pollMs', 'number', 'Ask again every this many milliseconds. 0 means once.', { default: '0' })],
    example: `const { data, claim, release, resolve } = useModeration()
await claim('player:p7', 'Ada')
const { resolved, violation } = await resolve('player:p7', { action: 'suspend', days: 3, note: 'Answers within a second.' }, 'Ada')`,
    notes: ['`resolve` rejects with a sentence when the decision is not allowed: someone else holds the case, the reason is too short, the question is in a show that has not finished. Show it in a toast.'],
  },
  {
    id: 'use-questions',
    name: 'useQuestions',
    group: 'data',
    kind: 'hook',
    summary: 'The questions, with `save`, `remove` and `review`. Needs a ContestProvider.',
    source: 'contest/hooks/useContestData.ts',
    props: [],
    example: `const { data: questions = [], save, remove, review } = useQuestions()
await save({ ...question, points: 20 }, 'Ada')
const { changed, skipped } = await review(['q34', 'q35'], 'preapprove', undefined, 'Ada')`,
    notes: ['`review` does a review action (see `reviewActions`) to many questions. It resolves with what changed and what was left out, each with a reason; only a failure of the call itself rejects.'],
  },
  {
    id: 'use-answer-keys',
    name: 'useAnswerKeys',
    group: 'data',
    kind: 'hook',
    summary: 'The answer keys of the given questions, by question id, with `save`.',
    source: 'contest/hooks/useContestData.ts',
    props: [prop('questionIds', 'string[]', 'Which keys to load. They load again when the list changes.', { required: true })],
    example: `const { data: keys = {}, save } = useAnswerKeys(questions.map((q) => q.id))
await save('q1', key, 'Ada')`,
  },
  {
    id: 'use-media',
    name: 'useMedia',
    group: 'data',
    kind: 'hook',
    summary: 'The media library, with `upload`, `update` and `remove`. `upload` takes the same options as `MediaUploader` passes, so progress and cancel just work.',
    source: 'contest/hooks/useContestData.ts',
    props: [],
    example: `const { data: assets = [], upload, update, remove } = useMedia()
<MediaUploader onUpload={(file, o) => upload(file, o)} />`,
  },
  {
    id: 'use-program',
    name: 'useProgram',
    group: 'data',
    kind: 'hook',
    summary: 'The weekly program, with `save`. Saving sends a new revision; the server decides the revision number and refuses a change to a show that is on air, or a change to a show people registered for unless `confirmed` is true.',
    source: 'contest/hooks/useContestData.ts',
    props: [],
    example: `const { data: program, save } = useProgram()
await save(draft, { confirmed: true })`,
    notes: ['`save` rejects with a sentence a person can read: show it in a toast. See `impactOf` and `programChecks` for the same rules without a server.'],
  },
  {
    id: 'use-registrations',
    name: 'useRegistrations',
    group: 'data',
    kind: 'hook',
    summary: 'How many people registered for each show, by occurrence key (`slotId@YYYY-MM-DD`).',
    source: 'contest/hooks/useContestData.ts',
    props: [prop('pollMs', 'number', 'Ask again every this many milliseconds. 0 means once.', { default: '0' })],
    example: `const { data: registrations = {} } = useRegistrations(5000)
registrations[occurrenceKey(slot.id, '2026-11-03')] // 864`,
  },
  {
    id: 'use-episodes',
    name: 'useEpisodes',
    group: 'data',
    kind: 'hook',
    summary: 'The weekly shows, with `save`. Reading them is also what sends reminders that are due.',
    source: 'contest/hooks/useContestData.ts',
    props: [prop('pollMs', 'number', 'Ask again every this many milliseconds. 0 means once.', { default: '0' })],
    example: `const { data: episodes = [], save } = useEpisodes(5000)`,
  },
  {
    id: 'use-live',
    name: 'useLive',
    group: 'data',
    kind: 'hook',
    summary: 'The live show now, or null. It asks again every few hundred milliseconds and the adapter works the state up to the server clock each time. `send` sends a command.',
    source: 'contest/hooks/useContestData.ts',
    props: [prop('pollMs', 'number', 'Ask again every this many milliseconds.', { default: '400' })],
    example: `const { data: live, send } = useLive()
await send({ type: 'start' })`,
  },
  {
    id: 'use-live-show',
    name: 'useLiveShow',
    group: 'data',
    kind: 'hook',
    summary: 'Everything a screen needs to show the live show: its state, the context the state machine needs, a `send` for commands, and the server clock.',
    source: 'contest/hooks/useLiveShow.ts',
    props: [prop('pollMs', 'number', 'Ask again every this many milliseconds.', { default: '400' })],
    example: `const { live, ctx, send, now } = useLiveShow()
if (live && ctx) return <LiveStage state={live} ctx={ctx} now={now} … />`,
  },
  {
    id: 'use-live-simulation',
    name: 'useLiveSimulation',
    group: 'data',
    kind: 'hook',
    summary: 'Pretend players for a demo: bots join the lobby one by one and answer each question after a think time that depends on the bot and the question. A fixed seed gives the same crowd every time.',
    source: 'contest/hooks/useLiveSimulation.ts',
    props: [
      prop('live', 'LiveState | null', 'The live show now.', { required: true }),
      prop('ctx', 'LiveContext | null', 'The show, the questions and the keys.', { required: true }),
      prop('enabled', 'boolean', 'Switches the bots on.', { required: true }),
      prop('count', 'number', 'How many bots.', { default: '24' }),
      prop('seed', 'number', 'Makes the crowd repeatable.', { default: '11' }),
    ],
    example: `useLiveSimulation(live, ctx, simulate)`,
    notes: ['Bots talk to the adapter directly. A real show has no use for this: real players answer from their own screens.'],
  },
  {
    id: 'use-surveys',
    name: 'useSurveys',
    group: 'data',
    kind: 'hook',
    summary: 'The surveys, with `save`. useSurveyResponses gives the answers (all, or one survey\'s) with `submit`. usePrefs gives one person\'s notification preferences with `save`.',
    source: 'contest/hooks/useContestData.ts',
    exports: ['useSurveys', 'useSurveyResponses', 'usePrefs'],
    imports: ['useSurveys', 'useSurveyResponses', 'usePrefs'],
    props: [
      prop('surveyId', 'string', 'For `useSurveyResponses`: only this survey.'),
      prop('participantId', 'string', 'For `usePrefs`: whose preferences.'),
    ],
    example: `const { data: surveys = [] } = useSurveys()
const { submit } = useSurveyResponses(survey.id)
const { data: prefs, save } = usePrefs(me.id)`,
  },
  {
    id: 'use-rank-replay',
    name: 'useRankReplay',
    group: 'data',
    kind: 'hook',
    summary: 'What changed since I last looked, for a ranking: it shows the ranking the person saw last time, then moves to the current one, so rows slide into their new places.',
    source: 'contest/hooks/useRankReplay.ts',
    props: [
      prop('ranked', 'RankedRow[]', 'The current ranking, best first.', { required: true }),
      prop('storageKey', 'string', 'Tells rankings apart in this browser, for example "public" and "admin".', { required: true }),
      prop('pauseMs', 'number', 'How long the old ranking stays before it moves.', { default: '700' }),
    ],
    example: `const ranked = rankParticipants(people, submissions)
const { rows, changes } = useRankReplay(ranked, 'public')
<Leaderboard rows={rows} changes={changes} />`,
    notes: ['`changes` is how many places each person gained (positive) or lost since the last visit. It is undefined the first time.'],
  },
  {
    id: 'use-my-submission',
    name: 'useMySubmission',
    group: 'data',
    kind: 'hook',
    summary: "One participant's own submission, created on first use, with `saveAnswer` and `submit`. Submitting locks it and scores it from the keys.",
    source: 'contest/hooks/useContestData.ts',
    props: [prop('participantId', 'string', 'Whose submission.', { required: true })],
    example: `const { data: submission, saveAnswer, submit } = useMySubmission(me.id)`,
  },
  {
    id: 'use-contest',
    name: 'useContest',
    group: 'data',
    kind: 'hook',
    summary: 'The remaining read hooks: the contest itself, participants, all submissions, announcements, notifications and the audit trail. Each returns `data`, `loading`, `error` and its own save calls.',
    source: 'contest/hooks/useContestData.ts',
    exports: ['useContest', 'useParticipants', 'useSubmissions', 'useAnnouncements', 'useNotifications', 'useAudit'],
    imports: ['useContest', 'useParticipants', 'useSubmissions', 'useAnnouncements', 'useNotifications', 'useAudit'],
    props: [
      prop('recipientId', 'string', 'For `useNotifications`: whose notifications.'),
      prop('pollMs', 'number', 'For `useNotifications` (default 4000), `useAnnouncements` and `useSubmissions` (default 0, off): ask again every that many milliseconds.'),
    ],
    example: `const { data: contest } = useContest()
const { data: audit = [], revert } = useAudit()
const { data: notes = [], markRead } = useNotifications(me.id)`,
    notes: ['`useAudit().revert(id, actor)` puts an entity back the way it was before that entry. The revert is a new entry with `of` set to the entry it reverted.', '`useParticipants()` also gives `invite(people)`; `useSubmissions()` gives `saveScore`; `useAnnouncements()` gives `save` and `send`.'],
  },
]
