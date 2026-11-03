import { prop, type ContestDoc } from './define.ts'

export const surveyDocs: ContestDoc[] = [
  {
    id: 'nps-scale',
    name: 'NpsScale',
    group: 'surveys',
    summary: 'The standard 0 to 10 scale in three coloured bands: critics (0–6), passives (7–8) and promoters (9–10). RatingScale (five stars), LikertScale (5 or 7 points) and SurveyQuestionInput (the right input for any survey question) live in the same file.',
    source: 'contest/components/SurveyInputs.tsx',
    exports: ['NpsScale', 'RatingScale', 'LikertScale', 'SurveyQuestionInput'],
    imports: ['NpsScale', 'RatingScale', 'LikertScale', 'SurveyQuestionInput'],
    props: [
      prop('value', 'number', 'The chosen number.'),
      prop('onChange', '(value: number) => void', 'Called with the number.', { required: true }),
      prop('disabled', 'boolean', 'Locks the scale.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<NpsScale value={score} onChange={setScore} />
<LikertScale points={7} low="Far too easy" high="Far too hard" value={v} onChange={setV} />
<SurveyQuestionInput question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />`,
    notes: ['Every scale is a set of real radio buttons: arrow keys move between them and a screen reader hears the ends of the scale.', '`LikertScale` also takes `points` (5 or 7), `low` and `high`.'],
  },
  {
    id: 'poll-card',
    name: 'PollCard',
    group: 'surveys',
    summary: 'A one-tap poll for a break: tap an option and the bars open with how everyone voted. Results stay hidden until the person votes.',
    source: 'contest/components/PollCard.tsx',
    props: [
      prop('survey', 'Survey', 'A survey whose first question is a choice.', { required: true }),
      prop('voted', 'string', 'The option this person picked, once they voted.'),
      prop('counts', 'Record<string, number>', 'How many votes each option has. Shown after the vote.'),
      prop('onVote', '(optionId: string) => void', 'Called with the option that was tapped.', { required: true }),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<PollCard survey={poll} voted={mine} counts={counts} onVote={(id) => submit({ surveyId: poll.id, answers: { q1: id } })} />`,
    notes: ['The vote cannot be changed. Hiding the results until the vote keeps people from copying the crowd.'],
  },
  {
    id: 'survey-runner',
    name: 'SurveyRunner',
    group: 'surveys',
    summary: 'A survey one question at a time, with a progress bar and a Skip on every optional question. After the last question, a thank-you screen.',
    source: 'contest/components/SurveyRunner.tsx',
    props: [
      prop('survey', 'Survey', 'The survey to run.', { required: true }),
      prop('onSubmit', '(answers: Record<string, SurveyAnswer>) => void | Promise<void>', 'Called once with every answer when the person finishes. Skipped questions are left out.', { required: true }),
      prop('thanks', 'ReactNode', 'Shown on the thank-you screen, for example a link back.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<SurveyRunner survey={survey} onSubmit={(answers) => submit({ surveyId: survey.id, answers })} />`,
  },
  {
    id: 'survey-builder',
    name: 'SurveyBuilder',
    group: 'surveys',
    summary: 'Builds a short survey from templates or from nothing: six kinds of question, drag to reorder, optional switches. A checker says what hurts answer quality: more than five questions, leading wording, a changed NPS sentence, too few options.',
    source: 'contest/components/SurveyBuilder.tsx',
    props: [
      prop('survey', 'Survey', 'The survey being built.', { required: true }),
      prop('onChange', '(survey: Survey) => void', 'Called with the whole updated survey.', { required: true }),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<SurveyBuilder survey={draft} onChange={setDraft} />`,
    notes: ['The checks come from `surveyProblems`. Short surveys and neutral words get more honest answers.'],
  },
  {
    id: 'survey-results',
    name: 'SurveyResults',
    group: 'surveys',
    summary: 'What the answers say, question by question: the NPS with its bands and trend over the shows, averages and bars for scales and choices, and the open answers as a list.',
    source: 'contest/components/SurveyResults.tsx',
    props: [
      prop('survey', 'Survey', 'The survey.', { required: true }),
      prop('responses', 'SurveyResponse[]', 'All responses. Only this survey\'s are used.', { required: true }),
      prop('episodes', 'Episode[]', 'Names the shows on the trend of an NPS question.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<SurveyResults survey={survey} responses={responses} episodes={episodes} />`,
  },
]
