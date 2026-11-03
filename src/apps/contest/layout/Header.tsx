import { NavLink, useNavigate } from 'react-router-dom'
import { ME } from '@/apps/contest/data'
import { SiteHeader } from '@/kit/components/nav/SiteHeader'
import { NotificationCenter } from '@/contest/components/NotificationCenter'
import { useNotifications } from '@/contest/hooks/useContestData'
import { Logo } from './Logo'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/play', label: 'Play' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/announcements', label: 'News' },
  { to: '/admin', label: 'Back office' },
  { to: '/components', label: 'Components' },
]

export function Header() {
  const navigate = useNavigate()
  const notes = useNotifications(ME)
  return (
    <SiteHeader
      brand={<Logo />}
      actions={
        <NotificationCenter notifications={notes.data ?? []} onRead={(ids) => void notes.markRead(ids)} onOpen={(n) => n.href && navigate(n.href)} />
      }
    >
      <ul className="cs-nav">
        {LINKS.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </SiteHeader>
  )
}
