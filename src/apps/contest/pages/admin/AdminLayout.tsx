import { NavLink, Outlet } from 'react-router-dom'
import { PageBar } from '@/kit/components/nav/PageBar'

const TABS = [
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/review', label: 'Review' },
  { to: '/admin/packs', label: 'Packs' },
  { to: '/admin/media', label: 'Media' },
  { to: '/admin/weekly', label: 'Weekly live' },
  { to: '/admin/host', label: 'Host' },
  { to: '/admin/surveys', label: 'Surveys' },
  { to: '/admin/participants', label: 'Participants' },
  { to: '/admin/moderation', label: 'Moderation' },
  { to: '/admin/versions', label: 'Versions' },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/communication', label: 'Announcements' },
  { to: '/admin/results', label: 'Results' },
  { to: '/admin/audit', label: 'Audit' },
]

export default function AdminLayout() {
  return (
    <>
      <PageBar eyebrow="Back office" title="Run the contest" />
      <div className="container cs-admin">
        <nav className="cs-subnav" aria-label="Back office">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {t.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </>
  )
}
