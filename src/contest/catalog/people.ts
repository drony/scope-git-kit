import { prop, type ContestDoc } from './define.ts'

export const peopleDocs: ContestDoc[] = [
  {
    id: 'participant-table',
    name: 'ParticipantTable',
    group: 'people',
    summary: 'Everyone in the contest in a searchable, sortable table: status, team, how far they got and their score. Tick rows to message them together.',
    source: 'contest/components/ParticipantTable.tsx',
    props: [
      prop('participants', 'Participant[]', 'The people.', { required: true }),
      prop('submissions', 'Submission[]', 'Adds the answers and score columns.'),
      prop('onOpen', '(participant: Participant) => void', 'Called when a name is clicked.', { required: true }),
      prop('selectedId', 'string | null', 'The person open in the drawer; the name is highlighted.'),
      prop('onInvite', '() => void', 'Shows an "Invite people" button.'),
      prop('onMessage', '(people: Participant[]) => void', 'Shows a "Message them" button when rows are ticked.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<ParticipantTable participants={people} submissions={submissions} onOpen={(p) => setOpenId(p.id)} onInvite={() => setInviting(true)} />`,
    notes: ['It is the kit `DataGrid`, so sorting, resizing, density and column visibility come with it. Ticked rows are reported through `onCheckedChange`.'],
  },
  {
    id: 'participant-drawer',
    name: 'ParticipantDrawer',
    group: 'people',
    summary: 'One person in a side sheet: status, a note, what they did and when, their score and rank, and a link to their answers.',
    source: 'contest/components/ParticipantDrawer.tsx',
    props: [
      prop('participant', 'Participant | null', 'The person to show. The drawer is open while this is set.', { required: true }),
      prop('submission', 'Submission', 'Their submission, for the score and the timeline.'),
      prop('rank', 'number', 'Their place on the leaderboard, when they have one.'),
      prop('onClose', '() => void', 'Called when the drawer is closed.', { required: true }),
      prop('onSave', '(participant: Participant) => void', 'Called with the changed person.', { required: true }),
      prop('onReview', '(submission: Submission) => void', 'Shows a "Review the answers" button.'),
      prop('now', 'Date', 'Replaces the clock, for tests and demos.'),
    ],
    example: `<ParticipantDrawer participant={open} submission={sub} rank={rank} onClose={() => setOpenId(null)} onSave={(p) => void people.save(p)} />`,
    notes: ['Changing the status to "disqualified" asks first. A disqualified person leaves the leaderboard and every audience.', 'Edits stay in a draft until "Save changes".'],
  },
  {
    id: 'invite-dialog',
    name: 'InviteDialog',
    group: 'people',
    summary: 'Paste a list of people and invite them in one go. The list is read as you type, and every line that is wrong says why.',
    source: 'contest/components/InviteDialog.tsx',
    props: [
      prop('open', 'boolean', 'Shows the dialog.', { required: true }),
      prop('onClose', '() => void', 'Called when the dialog is cancelled or finished.', { required: true }),
      prop('existingEmails', 'string[]', 'Addresses already in the contest, so a repeat is caught before it is sent.'),
      prop('onInvite', '(people: InvitePerson[]) => void | Promise<void>', 'Called with the lines that read fine. The dialog closes after it finishes.', { required: true }),
    ],
    example: `<InviteDialog open={inviting} onClose={() => setInviting(false)} existingEmails={people.map((p) => p.email)} onInvite={(list) => people.invite(list)} />`,
    notes: ['Accepted lines: `ada@example.com`, `Ada Lindqvist <ada@example.com>, Comets`, `Ada Lindqvist, ada@example.com, Comets`. See `parseInvites`.'],
  },
  {
    id: 'submission-review',
    name: 'SubmissionReview',
    group: 'people',
    summary: 'Look at what a participant answered next to the answer key, see the points the key gave and why, and change them. Written answers and photos are scored with the rubric.',
    source: 'contest/components/SubmissionReview.tsx',
    props: [
      prop('questions', 'Question[]', 'The questions of the submission, in order.', { required: true }),
      prop('submission', 'Submission', 'The submission to review.', { required: true }),
      prop('answerKeys', 'Record<string, AnswerKey>', 'The answer keys by question id.', { required: true }),
      prop('participantName', 'string', 'Shown in the heading.'),
      prop('media', '(id: string) => MediaAsset | undefined', 'Looks up uploaded files, to show the photo that was answered.'),
      prop('onScore', '(questionId: string, score: Score) => void', 'Called with the score the reviewer saved. The review then moves to the next answer that needs a person.', { required: true }),
      prop('initialQuestionId', 'string', 'Opens this question first, instead of the first answer that is waiting.'),
      prop('reviewer', 'string', 'Written into every score saved here.', { default: "'Reviewer'" }),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<SubmissionReview
  key={submission.id}
  questions={questions}
  submission={submission}
  answerKeys={keys}
  participantName="Bo Tanaka"
  onScore={(qid, score) => void submissions.saveScore(submission.id, qid, score)}
/>`,
    notes: [
      'A score saved here is `auto: false` and carries the reviewer and the note. "Use the key\'s score" puts the automatic score back.',
      '`Ctrl+Enter` (`⌘+Enter` on a Mac) saves from anywhere in the scoring box.',
      'The question map colours each answer: waiting for a person, scored by the key, or scored by a reviewer.',
    ],
  },
  {
    id: 'rubric-scorer',
    name: 'RubricScorer',
    group: 'people',
    summary: 'Score an answer by criteria: one slider per criterion, with a running total.',
    source: 'contest/components/RubricScorer.tsx',
    props: [
      prop('rubric', 'RubricCriterion[]', 'The criteria from the answer key.', { required: true }),
      prop('value', 'Record<string, number>', 'Points per criterion, by id. A criterion that is missing counts as 0.', { required: true }),
      prop('onChange', '(value: Record<string, number>) => void', 'Called with the new points.', { required: true }),
      prop('disabled', 'boolean', 'Locks the sliders.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<RubricScorer rubric={key.rubric} value={points} onChange={setPoints} />`,
    notes: ['Keyboard: arrow keys change the points by one, Page Up and Page Down in larger steps, Home and End jump to 0 and to the full points. "Full marks" and "Zero" set every criterion at once.'],
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    group: 'people',
    summary: 'The ranking as a list: place with medal colours, name, a bar for the points, and an arrow for the places gained or lost. When the order changes, the rows slide to their new places.',
    source: 'contest/components/Leaderboard.tsx',
    props: [
      prop('rows', 'RankedRow[]', 'The ranking, best first. See `rankParticipants`.', { required: true }),
      prop('teams', 'TeamRow[]', 'Adds a People / Teams switch. See `rankTeams`.'),
      prop('highlightId', 'string', 'The row of the person looking at the board: highlighted and tagged "You".'),
      prop('changes', 'Record<string, number>', 'Places moved since the last ranking, by id: positive is up. See `rankChanges`.'),
      prop('limit', 'number', 'Shows only the best N rows.'),
      prop('onOpen', '(row: RankedRow) => void', 'Makes a row clickable.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `const ranked = rankParticipants(people, submissions)
const { rows, changes } = useRankReplay(ranked, 'public')

<Leaderboard rows={rows} teams={rankTeams(ranked)} highlightId={me.id} changes={changes} />`,
    notes: ['Ties share a place and the next place is skipped (1, 2, 2, 4). "+?" next to the points means some answers still wait for a reviewer.', 'The slide uses `useFlip`, which skips the motion for people who prefer reduced motion.'],
  },
  {
    id: 'podium',
    name: 'Podium',
    group: 'people',
    summary: 'The first three of a ranking on a podium: first in the middle and tallest, second on the left, third on the right.',
    source: 'contest/components/Podium.tsx',
    props: [prop('rows', 'RankedRow[]', 'The ranking, best first. Only the first three are shown.', { required: true }), prop('className', 'string', 'Extra classes.')],
    example: `<Podium rows={rankParticipants(people, submissions)} />`,
  },
  {
    id: 'score-heat-grid',
    name: 'ScoreHeatGrid',
    group: 'people',
    summary: 'Who got what: a person on every row, a question in every column, each cell coloured by the share of the points it earned. The hardest question is tagged.',
    source: 'contest/components/ScoreHeatGrid.tsx',
    props: [
      prop('questions', 'Question[]', 'One column each, in order.', { required: true }),
      prop('rows', 'Array<{ id: string; name: string; scores: Record<string, Score | undefined> }>', 'One row per person, with their scores by question id.', { required: true }),
      prop('onOpen', '(participantId: string, questionId: string) => void', 'Makes a scored cell clickable, to open that answer.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<ScoreHeatGrid questions={asked} rows={ranked.map((r) => ({ id: r.id, name: r.name, scores: subOf(r.id).scores }))} onOpen={openAnswer} />`,
    notes: ['Answers that wait for a reviewer are hatched and are left out of "hardest". The bottom row shows the share of people with full marks on each question.'],
  },
]
