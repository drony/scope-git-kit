import { ME } from '@/apps/contest/data'
import { PageBar } from '@/kit/components/nav/PageBar'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AnnouncementFeed } from '@/contest/components/AnnouncementFeed'
import { useAnnouncements, useContest, useParticipants } from '@/contest/hooks/useContestData'

export default function Announcements() {
  usePageTitle('News')
  const announcements = useAnnouncements(5000)
  const { data: contest } = useContest()
  const { data: people } = useParticipants()
  const me = people?.find((p) => p.id === ME)

  return (
    <>
      <PageBar eyebrow="From the organisers" title="News and announcements">
        <p className="lead">Everything the organisers sent, newest first. Pinned messages stay on top.</p>
      </PageBar>
      <div className="container cs-news">
        {announcements.data ? <AnnouncementFeed announcements={announcements.data} vars={{ name: me?.name.split(' ')[0], team: me?.team, contest: contest?.title }} /> : <Skeleton height="10rem" radius="0.75rem" />}
      </div>
    </>
  )
}
