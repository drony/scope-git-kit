import { ButtonLink } from '@/kit/components/ui/Button'
import { Card, CardHead, Kpi } from '@/kit/components/ui/Card'
import { Meter } from '@/kit/components/ui/Feedback'
import { PageHero, Section, SectionHead } from '@/kit/components/ui/Section'
import { Tag } from '@/kit/components/ui/Badge'
import { useSite } from '@/kit/context/ConfigContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { useContest } from '@/contest/hooks/useContestData'

const FAMILIES = [
  { title: 'Questions & answers', body: 'Compose ten question types, edit the answer key on the back office, and preview exactly what a contestant sees.', to: '/admin/questions' },
  { title: 'Photos & media', body: 'Upload queue with progress and validation, a media library, a viewer, a cropper that keeps the subject in frame, and a review wall.', to: '/admin/media' },
  { title: 'Announcements & notifications', body: 'Write once, choose who gets it and where, schedule it, and preview it per channel. Participants get it as news and in the bell.', to: '/admin/announcements' },
  { title: 'People & scoring', body: 'Invite participants, review answers next to the key, score by rubric, and watch a live leaderboard and a heat grid.', to: '/admin/results' },
]

export default function Home() {
  usePageTitle('Home')
  const site = useSite()
  const { data: contest } = useContest()
  const date = (iso?: string) =>
    iso ? new Intl.DateTimeFormat(site.locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso)) : '—'

  return (
    <>
      <PageHero
        eyebrow={contest ? <Tag tone="success">{contest.status}</Tag> : undefined}
        title={
          <>
            Run a contest people <span className="gradient">talk about</span>
          </>
        }
        lead={
          contest
            ? `${contest.title}: ${contest.tagline} It runs from ${date(contest.startsAt)} to ${date(contest.endsAt)}.`
            : 'Questions, answers, photos, announcements and scoring, from one calm back office.'
        }
        actions={
          <>
            <ButtonLink to="/play" arrow>
              Play the quiz
            </ButtonLink>
            <ButtonLink to="/admin/questions" variant="plain">
              Open the back office
            </ButtonLink>
          </>
        }
      />
      <Section id="features">
        <div className="container">
          <SectionHead eyebrow="What is inside" title="Components for the whole contest" lead="Each one takes plain props, is built on the kit, and has a live example on the components page." />
          <div className="cs-grid">
            {FAMILIES.map((f) => (
              <Card key={f.title}>
                <CardHead title={f.title} actions={<Tag tone="success">ready</Tag>} />
                <p>{f.body}</p>
                <ButtonLink to={f.to} variant="plain" size="sm" arrow>
                  Open
                </ButtonLink>
              </Card>
            ))}
          </div>
        </div>
      </Section>
      <Section>
        <div className="container">
          <SectionHead eyebrow="Theme sample" title="This is the Contest Scope theme" lead="Indigo, amber and a little more room. Everything here reads from the same tokens as the Finscope theme; only the palette and style differ." />
          <div className="cs-grid">
            <Card>
              <Kpi label="Participants" value="12" sub="10 have started" />
            </Card>
            <Card>
              <Kpi label="Average score" value="68 / 100" sub="after round one" />
            </Card>
            <Card>
              <CardHead title="Round one progress" />
              <Meter value={80} label="80% of answers are in" />
            </Card>
          </div>
        </div>
      </Section>
    </>
  )
}
