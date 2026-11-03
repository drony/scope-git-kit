import { NavLink, Outlet } from 'react-router-dom'
import { PageBar } from '@/kit/components/nav/PageBar'

const TABS = [
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/media', label: 'Media' },
  { to: '/admin/participants', label: 'Participants' },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/communication', label: 'Announcements' },
  { to: '/admin/results', label: 'Results' },
]

export default function AdminLayout() {
  return (
    <>
      <PageBar eyebrow="Back office" title="Run the contest">
        <nav className="cs-subnav" aria-label="Back office">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </PageBar>
      <div className="container cs-admin">
        <Outlet />
      </div>
    </>
  )
}
