import { Link, useParams } from 'react-router-dom'
import { ME } from '@/apps/contest/data'
import { PageBar } from '@/kit/components/nav/PageBar'
import { Card } from '@/kit/components/ui/Card'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { SurveyRunner } from '@/contest/components/SurveyRunner'
import { useEpisodes, useSurveyResponses, useSurveys } from '@/contest/hooks/useContestData'

export default function SurveyPage() {
  usePageTitle('Survey')
  const { id = '' } = useParams()
  const surveys = useSurveys()
  const responses = useSurveyResponses(id)
  const episodes = useEpisodes()
  const survey = surveys.data?.find((s) => s.id === id)
  const latest = [...(episodes.data ?? [])].filter((e) => e.status === 'finished').sort((a, b) => b.number - a.number)[0]

  return (
    <>
      <PageBar eyebrow="Two minutes" title={survey?.title ?? 'Survey'} />
      <div className="container cs-news">
        {!surveys.data ? (
          <Skeleton height="10rem" radius="0.75rem" />
        ) : !survey ? (
          <EmptyState title="This survey does not exist" />
        ) : (
          <Card>
            <SurveyRunner
              survey={survey}
              onSubmit={async (answers) => {
                await responses.submit({ surveyId: survey.id, episodeId: latest?.id, participantId: ME, answers })
              }}
              thanks={<Link className="btn btn-plain" to="/live">Back to Weekly Live</Link>}
            />
          </Card>
        )}
      </div>
    </>
  )
}
