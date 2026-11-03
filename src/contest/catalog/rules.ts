import { prop, type ContestDoc } from './define.ts'

export const ruleDocs: ContestDoc[] = [
  {
    id: 'scoring',
    name: 'scoreAnswer',
    group: 'rules',
    kind: 'utility',
    summary: 'Compares one answer with its key and says how many points it earns, and why. Pure functions: the same code scores a real submission, the "Try an answer" box, and a dry run.',
    source: 'contest/lib/scoring.ts',
    exports: ['scoreAnswer', 'scoreSubmission', 'totalPoints', 'totalMax', 'normalizeText', 'matchAccepted'],
    imports: ['scoreAnswer', 'scoreSubmission', 'totalPoints', 'totalMax'],
    props: [
      prop('question', 'Pick<Question, "points" | "type">', 'Only the points are needed.', { required: true }),
      prop('key', 'AnswerKey | null', 'The key. A missing key, or a manual key, gives 0 points and `auto: false`.', { required: true }),
      prop('answer', 'AnswerValue | null', 'The answer given.', { required: true }),
    ],
    example: `const r = scoreAnswer(question, key, answer)
// { points: 7.5, max: 10, auto: true, reason: '3 of 4 pairs are right.' }
const all = scoreSubmission(questions, keys, submission.answers)`,
    notes: [
      'Choice: all-or-nothing, or partial credit for a multiple choice (right picks minus wrong picks). Text: any accepted wording, each with its own credit. Number: within a tolerance. Ordering: all or nothing. Matching: points per right pair.',
      'Text is compared after `normalizeText`: capitals, accents, punctuation and extra spaces are ignored as far as the key says.',
    ],
  },
  {
    id: 'question-types',
    name: 'questionTypes',
    group: 'rules',
    kind: 'utility',
    summary: 'The ten question types and what to do with them: labels and icons, a blank question and key for a type, key checks, "is it answered?", converting a question to another type, and a stable shuffle.',
    source: 'contest/lib/questionTypes.ts',
    exports: ['QUESTION_TYPES', 'typeInfo', 'newQuestion', 'blankKey', 'keyProblems', 'isAnswered', 'shuffled', 'optionsOf', 'convertQuestion', 'describeKey'],
    imports: ['QUESTION_TYPES', 'newQuestion', 'blankKey', 'keyProblems', 'convertQuestion'],
    example: `const q = newQuestion('single', 'q9')
const key = blankKey(q)
keyProblems(q, key) // ['No correct option is marked.']`,
    notes: ['`keyProblems` is what the answer key editor shows as "things to fix"; the question bank uses it for the "Answer key" column.'],
  },
  {
    id: 'audience',
    name: 'audienceOf',
    group: 'rules',
    kind: 'utility',
    summary: 'Who an announcement reaches. The composer\'s "N people will get this" and the backend that sends use the same function. Disqualified people are never reached.',
    source: 'contest/lib/audience.ts',
    exports: ['audienceOf', 'describeAudience', 'teamsOf', 'SEGMENTS'],
    imports: ['audienceOf', 'describeAudience', 'teamsOf'],
    example: `audienceOf({ kind: 'segment', segment: 'team', team: 'Comets' }, participants, submissions) // ['p1', 'p4', 'p7', 'p10']
describeAudience({ kind: 'segment', segment: 'team', team: 'Comets' }) // 'Team Comets'`,
    notes: ['Segments: not started, in progress, finished, and one team. "Chosen people" takes ids.'],
  },
  {
    id: 'templates',
    name: 'renderTemplate',
    group: 'rules',
    kind: 'utility',
    summary: 'Merge fields in announcements: `{{name}}`, `{{team}}` and `{{contest}}` are filled for each recipient.',
    source: 'contest/lib/templates.ts',
    exports: ['renderTemplate', 'findUnknownFields', 'TEMPLATE_FIELDS', 'SAMPLE_VARS'],
    imports: ['renderTemplate', 'findUnknownFields'],
    example: `renderTemplate('Hi {{name}}, welcome to {{contest}}!', { name: 'Kai', contest: 'Aurora Cup' }) // 'Hi Kai, welcome to Aurora Cup!'
findUnknownFields('Hi {{nmae}}') // ['nmae']`,
    notes: ['A missing value uses a neutral fallback ("there", "your team"). An unknown field stays as typed, so a typo is visible.'],
  },
  {
    id: 'announcement-problems',
    name: 'announcementProblems',
    group: 'rules',
    kind: 'utility',
    summary: 'What stops an announcement from going out, in words: no title, no message, no channel, nobody in the audience, an unknown merge field, a schedule in the past.',
    source: 'contest/lib/announcements.ts',
    example: `const problems = announcementProblems(draft, reach.length)
if (problems.length === 0) await send(draft.id)`,
  },
  {
    id: 'ranking',
    name: 'rankParticipants',
    group: 'rules',
    kind: 'utility',
    summary: 'Rankings: everyone who submitted, best first, with ties sharing a place (1, 2, 2, 4); teams by the average of their members; and how many places each person moved between two rankings.',
    source: 'contest/lib/ranking.ts',
    exports: ['rankParticipants', 'rankTeams', 'rankChanges', 'isPending'],
    imports: ['rankParticipants', 'rankTeams', 'rankChanges'],
    example: `const rows = rankParticipants(participants, submissions)
const teams = rankTeams(rows)
const moved = rankChanges(before, rows) // { p3: 2, p5: -1 }`,
    notes: ['People who are disqualified or still answering are not ranked. `pending` on a row counts answers that wait for a reviewer; `isPending(score)` is the test.'],
  },
  {
    id: 'invites',
    name: 'parseInvites',
    group: 'rules',
    kind: 'utility',
    summary: 'Reads a pasted list of people, one per line, and says which lines are fine and why the others are not.',
    source: 'contest/lib/invites.ts',
    exports: ['parseInvites', 'INVITE_PROBLEMS'],
    imports: ['parseInvites'],
    example: `const { lines, valid } = parseInvites('ada@example.com\nBo Tanaka <bo@example.com>, Orbit', existingEmails)
// valid: [{ name: 'Ada', email: 'ada@example.com' }, { name: 'Bo Tanaka', email: 'bo@example.com', team: 'Orbit' }]`,
    notes: ['A line has a problem when it has no e-mail address, a bad one, one that is already in the contest, or one that appeared on an earlier line.'],
  },
  {
    id: 'audit-rules',
    name: 'diffEntry',
    group: 'rules',
    kind: 'utility',
    summary: 'The audit trail as plain functions: what an entry changed field by field, whether it is sensitive, whether it can be reverted and what a revert would also undo, how to filter, group and count the trail by day, and how to export it.',
    source: 'contest/lib/audit.ts',
    exports: ['ENTITY_LABEL', 'ACTION_LABEL', 'ENTITY_GROUPS', 'EMPTY_FILTER', 'sensitivity', 'revertRule', 'relatedTo', 'revertedBy', 'laterChanges', 'formatValue', 'diffEntry', 'filterAudit', 'isFiltered', 'groupByDay', 'activityByDay', 'localDate', 'actorsOf', 'auditToCsv', 'findEntry'],
    imports: ['diffEntry', 'revertRule', 'sensitivity', 'filterAudit', 'auditToCsv'],
    example: `diffEntry(entry)
// [{ label: 'Points', kind: 'changed', from: '15', to: '20' }, { label: 'Options', kind: 'changed', detail: ['Added: Mars'] }]
revertRule(entry) // { can: false, why: 'Changes to people and scores are kept for the record and cannot be reverted yet.' }
filterAudit(entries, { ...EMPTY_FILTER, actor: 'Ada', sensitiveOnly: true }, Date.now())
auditToCsv(entries) // 'Time,Who,Kind,Id,Action,What,Sensitive\n…'`,
    notes: [
      'Sensitive entries: a deletion, a revert, any change to the version gate (an emergency says so), a new pack, a decision that suspends or disqualifies, and a person disqualified.',
      '`revertRule` follows the in-memory adapter: questions, answer keys, media and the contest can be reverted; the rest is kept for the record. A revert cannot be reverted.',
      'An export cannot run anything when it is opened in a spreadsheet: a cell that starts with `=`, `+`, `-` or `@` gets an apostrophe in front.',
    ],
  },
  {
    id: 'pack-rules',
    name: 'diffPack',
    group: 'rules',
    kind: 'utility',
    summary: 'Content packs as plain functions: which approved questions can go into a pack, what a pack would hold, how the bank has moved since a pack was made, how many weeks of the daily shows each topic can feed, and what is wrong with a pack before it is published.',
    source: 'contest/lib/packs.ts',
    exports: ['QUESTIONS_PER_SHOW', 'THIN_WEEKS', 'topicOf', 'isPackable', 'activePack', 'itemsFor', 'diffPack', 'driftCount', 'coverage', 'packProblems', 'buildPack', 'restoreItems', 'countsByPack'],
    imports: ['diffPack', 'coverage', 'packProblems', 'buildPack'],
    example: `isPackable(question, topics, key) // approved, has a topic that is not archived, nothing left to fix
const diff = diffPack(activePack(packs)!, bank, keys, topics)
// { added: [q40], changed: [q3, q9], withdrawn: [{ item, question: q43 }], archived: [q28], unchanged: 17 }
coverage(topics, bank, keys, pack, program)[0] // { topic, available: 6, served: 5, levels: […], showsPerWeek: 1, weeks: 0, state: 'thin' }`,
    notes: [
      'A pack pins every question to the `updatedAt` it had. A later edit does not change what the pack serves; it shows as "edited since" until a new pack is published.',
      'A question that was returned to review or deleted but is still in the pack in force is the worst kind of drift: players can still get it.',
      'Runway is the number of questions the pack serves for a topic divided by six per show and the daily shows of that topic each week. Less than four weeks is thin.',
    ],
  },
  {
    id: 'gate-rules',
    name: 'verdictOf',
    group: 'rules',
    kind: 'utility',
    summary: 'The version gate as plain functions: what a build is told, how many players that touches, what is wrong with a gate, what a change would do before it is saved, and which gate is in force at a given time.',
    source: 'contest/lib/gate.ts',
    exports: ['STORES', 'VERDICT_TEXT', 'storeName', 'verdictOf', 'verdictFor', 'canPlay', 'usageImpact', 'stopped', 'percent', 'parseBuilds', 'gateProblems', 'reviewGate', 'gateInForce'],
    imports: ['verdictOf', 'usageImpact', 'gateProblems', 'reviewGate'],
    example: `verdictOf({ minBuild: 380, recommendedBuild: 388, blockedBuilds: [383] }, 383) // 'blocked'
verdictOf(rule, 379) // 'required'
verdictOf(rule, 385) // 'recommended'
usageImpact(rule, usage) // { total: 4800, ok: 2568, recommended: 2121, required: 49, blocked: 64 }
reviewGate(current, draft, usage, Date.now(), shows) // { stores: [{ newlyStopped: 1112, … }], needsConfirm: true, reasons: ['App Store: 1,112 more players (23.2%) could not play.'], timing: [] }`,
    notes: [
      'A blocked build is stopped even above the minimum. Below the minimum it must update. Below the suggested build it plays, with a prompt it can close.',
      'A gate is refused when the suggested build is below the minimum, when the minimum or the suggested build is above the newest build in the store (everybody would be locked out), when every build in the store is blocked, when the link is not https, or when the message is empty.',
      'A change needs a confirmation when it is an emergency or when a store would stop a tenth of its players or more. A start time from half an hour before a show until it ends is flagged.',
    ],
  },
  {
    id: 'moderation-rules',
    name: 'groupReports',
    group: 'rules',
    kind: 'utility',
    summary: 'Reports and moderation as plain functions: which open reports are one case, how urgent a case is and why, what the data says about a player or a question, how reliable a reporter has been, the next step on the ladder, and what a decision does.',
    source: 'contest/lib/moderation.ts',
    exports: ['REASONS', 'ACTIONS', 'SLA_DAYS', 'DECISION_NOTE_MIN', 'MAX_SUSPENSION_DAYS', 'actionsFor', 'caseKey', 'isOpen', 'groupReports', 'ageDays', 'reporterRecord', 'playerSignals', 'questionSignals', 'strikesOf', 'priorityOf', 'byPriority', 'activeSuspension', 'suggestAction', 'decisionProblem', 'consequences', 'applyDecision'],
    imports: ['groupReports', 'priorityOf', 'playerSignals', 'suggestAction', 'decisionProblem'],
    example: `const cases = groupReports(reports) // open reports about one target are one case
const signals = playerSignals('p7', submissions, participants)
// [{ label: 'Very fast answers', detail: '10 of 10 answers took 3 seconds or less. Other players took 28 seconds at the median.', strength: 3 }]
priorityOf(cases[0], { reports, violations, signals, now })
// { level: 'urgent', score: 9, factors: [{ label: 'Cheating is serious', points: 3 }, …], overdue: true }
suggestAction(cases[0], { violations, signals }) // { action: 'suspend', days: 3, why: 'Strong evidence: a short suspension.' }`,
    notes: [
      'Priority adds up: how serious the reason is (1 to 3), one point per extra person who reported (up to 3), the strength of the signs (up to 4), earlier violations (up to 2), waiting time (1 after 2 days, 2 after 7) and minus one when every reporter was often wrong. Every point has a sentence.',
      'The ladder is warning, 3 days, 7 days, disqualification. Strong data moves one step up. A cheating signal needs wrong answers that few others gave: a popular wrong answer is not a fingerprint.',
      'A case is overdue after 1 day (urgent), 2 (high), 5 (medium) or 10 days (low).',
    ],
  },
  {
    id: 'review-rules',
    name: 'reviewActions',
    group: 'rules',
    kind: 'utility',
    summary: 'The review of questions as plain functions: the stage a question is in, what a given person can do to it (and why not), the question after an action, a dry run of an action on many questions, and the counts of the views.',
    source: 'contest/lib/review.ts',
    exports: ['STAGES', 'ACTIONS', 'DEFAULT_POLICY', 'stageOf', 'stageName', 'statusFor', 'reviewOf', 'waitingDays', 'isWaiting', 'isStale', 'reviewActions', 'applyReview', 'bulkPlan', 'waitsForMe', 'inView', 'VIEWS', 'reviewCounts', 'neighbour', 'reviewFlags'],
    imports: ['reviewActions', 'applyReview', 'bulkPlan', 'reviewCounts'],
    example: `reviewActions(question, key, { actor: 'Ada' })
// [{ action: 'preapprove', enabled: false, why: 'You wrote this question. Someone else has to pre-approve it.', primary: true }, …]
const next = applyReview(question, 'return', { actor: 'Cleo' }, Date.now(), key, 'Add a second source.')
const { ok, skipped } = bulkPlan(selected, 'approve', keys, { actor: 'Ada' })`,
    notes: [
      'The stages are draft, pending, pre-approved, approved, returned and trashed. Only an approved question is published (`statusFor`); without a review record the stage follows the status.',
      'Four eyes: nobody pre-approves or approves a question they wrote, and the final approval comes from someone other than the first reviewer. With `policy.twoStep` off, one reviewer approves.',
      'A return or a withdrawal needs a reason of at least five characters. An approved question cannot be trashed: withdraw it first. The in-memory adapter also refuses to withdraw or trash a question that is in a show that has not finished.',
    ],
  },
  {
    id: 'program-rules',
    name: 'occurrences',
    group: 'rules',
    kind: 'utility',
    summary: 'The weekly program as plain functions: every show of the coming days as a dated occurrence, its state (upcoming, soon, live, done), what a change does to the people who registered, and what is wrong with the program.',
    source: 'contest/lib/program.ts',
    exports: ['occurrences', 'nextOccurrence', 'showState', 'weekDates', 'changesBetween', 'impactOf', 'registeredFor', 'worstSeverity', 'programChecks', 'seatsSummary', 'newSlot', 'occurrenceKey', 'slotLabel', 'startTime', 'weekdayName', 'WEEKDAYS'],
    imports: ['occurrences', 'showState', 'impactOf', 'programChecks'],
    example: `occurrences(program, Date.now(), 7) // [{ key: 'd2@2026-11-03', date: '2026-11-03', at: 1793725200000, … }]
impactOf(saved, draft, registrations, Date.now())
// [{ severity: 'confirm', message: '864 people registered for the next Tue 20:00 show … It would be moved.', registered: 1301 }]
programChecks(draft) // [{ level: 'error', slotId: 'f', text: 'The daily shows give 800 seats, but the final has room for 500.' }]`,
    notes: [
      'A show that has started is `blocked`; a show people registered for needs a confirmation (`confirm`); the rest is `free`. Only the shows of the next 14 days count.',
      'Times are read on the wall clock of the program\'s time zone, so a daily show at 20:00 stays at 20:00 across summer time.',
    ],
  },
  {
    id: 'zoned-time',
    name: 'zonedInstant',
    group: 'rules',
    kind: 'utility',
    summary: 'Wall-clock time in a named time zone, with no library: the instant at which a zone\'s clock reads a date and time, what a clock reads at an instant, and small calendar steps.',
    source: 'contest/lib/zoned.ts',
    exports: ['zonedParts', 'zoneOffsetMin', 'zonedInstant', 'zonedDate', 'addDays', 'weekdayOf', 'instantOn', 'clockIn'],
    imports: ['zonedInstant', 'instantOn', 'clockIn'],
    example: `instantOn('2026-11-03', '20:00', 'Europe/Istanbul') // 1793725200000 (17:00 UTC)
clockIn(1793725200000, 'Europe/Istanbul') // '20:00'`,
    notes: ['Uses `Intl.DateTimeFormat`, so the zones and their summer-time rules come from the browser or Node. A time that does not exist (the hour skipped when the clocks go forward) resolves to the same clock time one hour earlier, so a show never disappears.'],
  },
  {
    id: 'dates',
    name: 'dayLabel',
    group: 'rules',
    kind: 'utility',
    summary: 'Small date helpers for lists of messages: "Today", "Yesterday" or the date, "5 min ago", and the time of day.',
    source: 'contest/lib/dates.ts',
    exports: ['dayLabel', 'relativeTime', 'timeLabel'],
    imports: ['dayLabel', 'relativeTime', 'timeLabel'],
    example: `dayLabel(n.createdAt) // 'Today'
relativeTime(n.createdAt) // '5 min ago'`,
    notes: ['`now` is a parameter, so a test or a demo can fix the clock.'],
  },
  {
    id: 'media-rules',
    name: 'validateMediaFile',
    group: 'rules',
    kind: 'utility',
    summary: 'Checks a file against upload rules (type, size, picture dimensions, length) and answers with a sentence a person can act on. Also formats sizes and times.',
    source: 'contest/lib/mediaRules.ts',
    exports: ['validateMediaFile', 'describeAccept', 'formatBytes', 'formatDuration'],
    imports: ['validateMediaFile', 'formatBytes', 'formatDuration'],
    example: `const problem = await validateMediaFile(file, { accept: 'image/*', maxMb: 5, minWidth: 800 })
// null, or 'photo.png is 640 px wide; the smallest allowed is 800 px.'`,
  },
  {
    id: 'media-usage',
    name: 'mediaUsage',
    group: 'rules',
    kind: 'utility',
    summary: 'How many questions use each media file, counting the prompt and every option. Feed it to MediaLibrary so a file in use says so, and a delete warns.',
    source: 'contest/lib/usage.ts',
    exports: ['mediaUsage', 'mediaIdsOf'],
    imports: ['mediaUsage', 'mediaIdsOf'],
    example: `const usage = mediaUsage(questions) // { 'm-rainbow': 2, 'm-peaks': 1 }
<MediaLibrary assets={assets} usage={usage} />`,
  },
  {
    id: 'crop-maths',
    name: 'visibleWindow',
    group: 'rules',
    kind: 'utility',
    summary: 'The maths behind cropping: what part of a picture a box of a given shape shows, how a crop and a focal point turn with the picture, and how to fit a shape inside a crop. All positions are fractions of the rotated picture.',
    source: 'contest/lib/crop.ts',
    exports: ['visibleWindow', 'rotateCrop', 'fitAspect', 'currentCrop', 'rotatedAspect'],
    imports: ['visibleWindow', 'rotateCrop', 'fitAspect', 'currentCrop'],
    example: `// A square box over a wide crop slides toward the focal point
const rect = visibleWindow(16 / 9, { x: 0, y: 0, w: 1, h: 1 }, { x: 0.8, y: 0.5 }, 1)`,
  },
]
