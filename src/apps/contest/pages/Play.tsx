import { useMemo } from 'react'
import { Alert, Skeleton } from '@/kit/components/ui/Feedback'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Countdown } from '@/kit/components/ui/Countdown'
import { Tag } from '@/kit/components/ui/Badge'
import { PageBar } from '@/kit/components/nav/PageBar'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { ME } from '@/apps/contest/data'
import { QuizRunner } from '@/contest/components/QuizRunner'
import { useAnswerKeys, useContest, useMedia, useMySubmission, useQuestions } from '@/contest/hooks/useContestData'

export default function Play() {
  usePageTitle('Play')
  const toast = useToast()
  const { data: contest } = useContest()
  const questions = useQuestions()
  const media = useMedia()
  const sub = useMySubmission(ME)

  const round = contest?.rounds[0]
  const quiz = useMemo(
    () => (round && questions.data ? round.questionIds.flatMap((id) => questions.data!.filter((q) => q.id === id && q.status === 'published')) : undefined),
    [round, questions.data],
  )
  const finished = sub.data !== undefined && sub.data.status !== 'in-progress'
  const keys = useAnswerKeys(finished && quiz ? quiz.map((q) => q.id) : [])
  const lookup = (id: string) => media.data?.find((a) => a.id === id)
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })

  return (
    <>
      <PageBar eyebrow={round?.title ?? 'Quiz'} title={contest?.title ?? 'Contest'} actions={contest && <Tag tone="success">{contest.status}</Tag>}>
        <p className="lead">Playing as Kai Moreau, a demo participant. Your answers are saved as you go.</p>
      </PageBar>
      <div className="container cs-play">
        <Card>
          {!quiz || !sub.data ? (
            <div aria-busy="true">
              <Skeleton height="14rem" radius="0.75rem" />
            </div>
          ) : quiz.length === 0 ? (
            <Alert tone="info" title="No questions are open yet">
              The back office has to publish questions first.
            </Alert>
          ) : (
            <QuizRunner
              key={ME}
              title={round?.title}
              questions={quiz}
              answers={sub.data.answers}
              status={sub.data.status}
              scores={sub.data.scores}
              answerKeys={keys.data}
              media={lookup}
              upload={(file, o) => media.upload(file, { ...o, uploadedBy: ME })}
              onAnswer={(a) => void sub.saveAnswer(a).catch(fail('Your answer was not saved'))}
              onSubmit={() =>
                void sub
                  .submit()
                  .then(() => toast.push({ tone: 'success', title: 'Answers submitted', description: 'Your score is on the result page.' }))
                  .catch(fail('Could not submit'))
              }
            />
          )}
        </Card>
        <aside className="cs-play-side">
          {round && (
            <Card>
              <CardHead title="This round closes in" />
              <Countdown to={round.closesAt} variant="blocks" doneLabel="This round is closed" />
            </Card>
          )}
          <Card>
            <CardHead title="How it works" />
            <ul className="cs-tips">
              <li>Answers save by themselves. You can close the page and come back.</li>
              <li>Some questions have a timer. When it ends, the answer locks.</li>
              <li>Review your answers on the last screen, then submit.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  )
}
