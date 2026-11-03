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
