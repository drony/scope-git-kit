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
    id: 'use-questions',
    name: 'useQuestions',
    group: 'data',
    kind: 'hook',
    summary: 'The questions, with `save` and `remove`. Needs a ContestProvider.',
    source: 'contest/hooks/useContestData.ts',
    props: [],
    example: `const { data: questions = [], save, remove } = useQuestions()
await save({ ...question, points: 20 }, 'Ada')`,
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
    notes: ['`useAudit().revert(id)` puts an entity back the way it was before that entry.', '`useParticipants()` also gives `invite(people)`; `useSubmissions()` gives `saveScore`; `useAnnouncements()` gives `save` and `send`.'],
  },
]
