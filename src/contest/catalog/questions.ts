import { prop, type ContestDoc } from './define.ts'

const media = prop('media', '(id: string) => MediaAsset | undefined', 'Looks up a media file by id, to show pictures and sounds. Without it, attachments are left out.')
const upload = prop('upload', 'UploadHandler', 'Sends a file for an upload question. Without it the upload box stays switched off.')

export const questionDocs: ContestDoc[] = [
  {
    id: 'question-view',
    name: 'QuestionView',
    group: 'questions',
    summary: 'One question as the participant sees it: type, points and timer, prompt, pictures, hint, the answer input, then the result banner.',
    source: 'contest/components/QuestionView.tsx',
    props: [
      prop('question', 'Question', 'The question to show.', { required: true }),
      prop('value', 'AnswerValue | null', 'The answer typed so far.', { required: true }),
      prop('onChange', '(value: AnswerValue) => void', 'Called on every change of the answer.', { required: true }),
      prop('state', "'open' | 'answered' | 'correct' | 'wrong' | 'timeout' | 'locked'", 'Open and answered can be edited; the others lock the input and show a banner.', { default: "'open'" }),
      prop('answerKey', 'AnswerKey | null', 'Shows what was right once the question is locked. Pass it only after the answer is final.'),
      prop('earned', 'number', 'Points earned, shown in the banner of a finished question.'),
      media,
      upload,
      prop('secondsLeft', 'number', 'Seconds left. Shows a timer; it turns red under 10 seconds.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<QuestionView
  question={question}
  value={answer}
  onChange={setAnswer}
  state={locked ? 'correct' : 'open'}
  answerKey={locked ? key : undefined}
  earned={locked ? 10 : undefined}
/>`,
    notes: [
      'It never reads or sends data. The same component shows the real quiz and the preview in the editor, so they cannot drift apart.',
      'The hint is hidden once the question is finished.',
    ],
  },
  {
    id: 'answer-input',
    name: 'AnswerInput',
    group: 'questions',
    summary: 'The right answer input for any question type. ChoiceAnswer, TextAnswer, NumericAnswer, OrderingAnswer, MatchingAnswer and UploadAnswer are the six inputs it picks from.',
    source: 'contest/components/Answers.tsx',
    exports: ['AnswerInput', 'ChoiceAnswer', 'TextAnswer', 'NumericAnswer', 'OrderingAnswer', 'MatchingAnswer', 'UploadAnswer'],
    imports: ['AnswerInput'],
    props: [
      prop('question', 'Question', 'The question to answer.', { required: true }),
      prop('value', 'AnswerValue | null', 'The current answer.', { required: true }),
      prop('onChange', '(value: AnswerValue) => void', 'Called with the new answer.', { required: true }),
      prop('disabled', 'boolean', 'Locks the input.'),
      prop('reveal', 'AnswerKey | null', 'After the answer is locked: marks right and wrong parts and shows the right answer.'),
      media,
      upload,
    ],
    example: `<AnswerInput question={question} value={value} onChange={setValue} />
{/* Or pick the input yourself: */}
<ChoiceAnswer question={choiceQuestion} value={value} onChange={setValue} />`,
    notes: [
      'Choice questions use native radio buttons and checkboxes, so the keyboard works. Ordering lists are reordered with the handle, or with Space and the arrow keys.',
      'Number answers keep what the person typed ("3." stays "3.") while the answer holds the parsed number. A comma works as a decimal mark.',
      'An ordering question starts shuffled (the same way every time for the same question).',
    ],
  },
  {
    id: 'question-quick-editor',
    name: 'QuestionQuickEditor',
    group: 'questions',
    summary: 'Write a question and its answer in one place. Type the question, type the options, tick the right one next to it: the answer key is made as you go. Level, time and points start from sensible defaults.',
    source: 'contest/components/QuestionQuickEditor.tsx',
    props: [
      prop('question', 'Question', 'The question being written.', { required: true }),
      prop('answerKey', 'AnswerKey | null', 'The key. Null is fine: the editor makes a blank one that fits.', { required: true }),
      prop('onChange', '(question: Question, key: AnswerKey) => void', 'Called with the question and its key on every change. They are always in step.', { required: true }),
      prop('media', '(id: string) => MediaAsset | undefined', 'Looks up attached media.'),
      prop('onPickMedia', "(target: { kind: 'prompt' } | { kind: 'option'; id: string }) => void", 'Shows picture buttons: open your media picker.'),
      prop('knownTags', 'string[]', 'Topics used elsewhere, offered while typing.', { default: '[]' }),
      prop('reviewer', 'string', 'Written into "I checked the answer" on the source.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<QuestionQuickEditor question={draft.q} answerKey={draft.key} onChange={(q, key) => setDraft({ q, key })} knownTags={tags} />`,
    notes: [
      'Enter adds an option, Backspace on an empty option removes it, the arrow keys move between options, and a list pasted into an option becomes many options (start the right one with *).',
      'Changing the level changes points and time too, unless the writer set their own. Source, hint, explanation, pictures and partial credit wait under "More".',
      '`readiness` and `tidy` (in `lib/quick.ts`) say what is missing and drop the empty option rows when a question is finished.',
    ],
  },
  {
    id: 'question-import',
    name: 'QuestionImport',
    group: 'questions',
    summary: 'Write or paste many questions at once. Blocks are split by a blank line: the first line is the question, the lines below are options, a * marks the right one. The list is read as you type.',
    source: 'contest/components/QuestionImport.tsx',
    props: [
      prop('open', 'boolean', 'Shows the dialog.', { required: true }),
      prop('onClose', '() => void', 'Called when the dialog is cancelled or finished.', { required: true }),
      prop('onImport', '(items: Array<{ question: Question; key: AnswerKey }>) => void | Promise<void>', 'Called with the questions that were read, as drafts.', { required: true }),
    ],
    example: `<QuestionImport open={importing} onClose={() => setImporting(false)} onImport={(items) => saveAll(items)} />`,
    notes: ['See `parseQuestions` for the format: `Answer: B`, `Tags: space`, `Level: 3` lines are understood too.'],
  },
  {
    id: 'question-composer',
    name: 'QuestionComposer',
    group: 'questions',
    summary: 'The form for one question: type, prompt, media, options, points, time limit, tags, hint and explanation. It saves nothing; it hands every change to `onChange`.',
    source: 'contest/components/QuestionComposer.tsx',
    props: [
      prop('question', 'Question', 'The question being edited.', { required: true }),
      prop('onChange', '(question: Question) => void', 'Called with the whole updated question.', { required: true }),
      prop('media', '(id: string) => MediaAsset | undefined', 'Looks up attached media to show thumbnails.'),
      prop('onPickMedia', "(target: { kind: 'prompt' } | { kind: 'option'; id: string }) => void", 'Open your media picker for the chosen target, then call `onChange` with the result. Leave out to hide the buttons.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<QuestionComposer
  question={draft}
  onChange={setDraft}
  media={lookup}
  onPickMedia={(target) => setPicking(target)}
/>`,
    notes: [
      'Changing the type keeps the prompt, points, tags and media and builds the fields the new type needs (see `convertQuestion`).',
      'The answer key is a separate editor, `AnswerKeyEditor`, because the key is back-office only.',
    ],
  },
  {
    id: 'answer-options-editor',
    name: 'AnswerOptionsEditor',
    group: 'questions',
    summary: 'Add, remove, reorder and rename the options of a question. Each option can have a picture and a note shown after answering.',
    source: 'contest/components/AnswerOptionsEditor.tsx',
    props: [
      prop('options', 'ChoiceOption[]', 'The options.', { required: true }),
      prop('onChange', '(options: ChoiceOption[]) => void', 'Called with the new list.', { required: true }),
      prop('label', 'string', 'Names the list for screen readers, for example "Answer options".', { required: true }),
      prop('idPrefix', 'string', 'Prefix for new option ids, so ids stay unique per list.', { default: "'o'" }),
      prop('min', 'number', 'Fewest options. Remove buttons switch off at this count.', { default: '2' }),
      prop('max', 'number', 'Most options. The add button switches off at this count.', { default: '8' }),
      prop('onPickMedia', '(optionId: string) => void', 'Shows a picture button on each row and calls this to attach one.'),
      prop('media', '(id: string) => MediaAsset | undefined', 'Looks up pictures for the thumbnails.'),
      prop('feedback', 'boolean', 'Adds a note field to each option.'),
      prop('addLabel', 'string', 'Text of the add button.', { default: "'Add option'" }),
    ],
    example: `<AnswerOptionsEditor label="Answer options" options={q.options} onChange={(options) => setQ({ ...q, options })} feedback />`,
    notes: ['Built on the kit `SortableList`, so rows can be dragged or moved with the keyboard.'],
  },
  {
    id: 'answer-key-editor',
    name: 'AnswerKeyEditor',
    group: 'questions',
    summary: 'The back-office editor for the answer key: right options, accepted wordings, number and tolerance, right order, matching pairs, or a rubric. It warns when the key no longer fits and has a "Try an answer" box.',
    source: 'contest/components/AnswerKeyEditor.tsx',
    props: [
      prop('question', 'Question', 'The question the key belongs to.', { required: true }),
      prop('value', 'AnswerKey | null', 'The key being edited, or null when there is none yet.', { required: true }),
      prop('onChange', '(key: AnswerKey) => void', 'Called with the new key.', { required: true }),
      prop('media', '(id: string) => MediaAsset | undefined', 'Looks up pictures for the "Try an answer" box.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<AnswerKeyEditor question={question} value={key} onChange={saveKey} />`,
    notes: [
      '"Try an answer" scores a sample answer with the same `scoreAnswer` that scores real submissions, and shows why it got those points. Nothing is saved.',
      'A text key can accept several wordings, each with its own share of the points, and ignore capitals, accents and punctuation.',
    ],
  },
  {
    id: 'question-preview',
    name: 'QuestionPreview',
    group: 'questions',
    summary: 'The question exactly as a participant sees it, on a phone, tablet or desktop frame, with a state scrubber: open, answered, right, wrong, time up, locked.',
    source: 'contest/components/QuestionPreview.tsx',
    props: [
      prop('question', 'Question', 'The question to preview.', { required: true }),
      prop('answerKey', 'AnswerKey | null', 'Used to fill in the right and wrong answers of the scrubber states.'),
      prop('media', '(id: string) => MediaAsset | undefined', 'Looks up attached media.'),
      prop('initialState', "'open' | 'answered' | 'correct' | 'wrong' | 'timeout' | 'locked'", 'The state shown first.', { default: "'open'" }),
      prop('device', "'phone' | 'tablet' | 'desktop'", 'The device frame shown first.', { default: "'phone'" }),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<SplitPane
  start={<QuestionComposer question={q} onChange={setQ} />}
  end={<QuestionPreview question={q} answerKey={key} />}
/>`,
    notes: ['Pair it with `QuestionComposer` in a `SplitPane`: the preview updates as you type.', 'You can answer in the "Open" state; the preview then switches to "Answered".'],
  },
  {
    id: 'question-bank',
    name: 'QuestionBank',
    group: 'questions',
    summary: 'All questions in a searchable, sortable, filterable table: type, points, time, status, whether the answer key is complete, and tags.',
    source: 'contest/components/QuestionBank.tsx',
    props: [
      prop('questions', 'Question[]', 'The questions.', { required: true }),
      prop('keys', 'Record<string, AnswerKey>', 'The answer keys by question id, to show which questions still need one.'),
      prop('selectedId', 'string | null', 'The question open in the editor; its title is highlighted.'),
      prop('onSelect', '(id: string) => void', 'Called when a question title is clicked.', { required: true }),
      prop('onAdd', '() => void', 'Shows a "New question" button.'),
      prop('onDuplicate', '(question: Question) => void', 'Shows a duplicate button on each row.'),
      prop('onDelete', '(question: Question) => void', 'Shows a delete button on each row. Ask for confirmation in your handler.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<QuestionBank questions={questions} keys={keys} selectedId={openId} onSelect={setOpenId} onAdd={addQuestion} />`,
    notes: ['It is the kit `DataGrid`, so column sorting, resizing, density and column visibility come with it. The layout is remembered in this browser.'],
  },
  {
    id: 'quiz-runner',
    name: 'QuizRunner',
    group: 'questions',
    summary: "The participant's whole quiz: one question at a time, a question map, per-question timers, a save indicator, an overview before submitting, and the result afterwards.",
    source: 'contest/components/QuizRunner.tsx',
    props: [
      prop('questions', 'Question[]', 'The questions in play order.', { required: true }),
      prop('answers', 'Answer[]', 'The answers saved so far. Read once, when the runner mounts; give it a new `key` to start over.'),
      prop('onAnswer', '(answer: Answer) => void', 'Called a moment after the person stops changing an answer, and when they leave the question.', { required: true }),
      prop('onSubmit', '() => void', 'Called when the person confirms the submit dialog.', { required: true }),
      prop('status', "'in-progress' | 'submitted' | 'reviewed'", 'Anything but in-progress locks every question and shows the result.', { default: "'in-progress'" }),
      prop('scores', 'Record<string, Score>', 'Points per question, shown after submitting.'),
      prop('answerKeys', 'Record<string, AnswerKey>', 'Answer keys. Pass them only after submitting: they reveal the right answers.'),
      prop('media', '(id: string) => MediaAsset | undefined', 'Looks up attached media.'),
      upload,
      prop('title', 'string', 'Heading of the quiz.', { default: "'Quiz'" }),
      prop('saveDelay', 'number', 'Milliseconds to wait after the last change before `onAnswer`.', { default: '700' }),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `const { data: submission, saveAnswer, submit } = useMySubmission(me.id)

<QuizRunner
  key={me.id}
  questions={questions}
  answers={submission.answers}
  status={submission.status}
  scores={submission.scores}
  onAnswer={saveAnswer}
  onSubmit={submit}
/>`,
    notes: [
      'A question with a time limit counts down while it is on screen. When time runs out the answer is saved and locked.',
      'It keeps its own copy of the answers so typing never waits for the network. Leaving the page saves what is waiting.',
      'Wrap it in `ContestProvider` only if you use the data hooks; the runner itself takes props only.',
    ],
  },
]
