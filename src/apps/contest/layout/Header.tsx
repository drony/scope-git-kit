import { NavLink, useNavigate } from 'react-router-dom'
import { ME } from '@/apps/contest/data'
import { SiteHeader } from '@/kit/components/nav/SiteHeader'
import { ThemeToggle } from '@/kit/components/theme/ThemeToggle'
import { NotificationCenter } from '@/contest/components/NotificationCenter'
import { useNotifications } from '@/contest/hooks/useContestData'
import { cn } from '@/kit/lib/cn'
import { Logo } from './Logo'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/play', label: 'Play' },
  { to: '/live', label: 'Live' },
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
        <>
          <ThemeToggle />
          <NotificationCenter notifications={notes.data ?? []} onRead={(ids) => void notes.markRead(ids)} onOpen={(n) => n.href && navigate(n.href)} />
        </>
      }
    >
      <ul className="nav-list">
        {LINKS.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.end} className={({ isActive }) => cn('nav-link', isActive && 'is-current')}>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </SiteHeader>
  )
}
