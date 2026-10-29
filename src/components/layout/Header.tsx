import { useCallback, useState } from 'react'
import { LifeBuoy, LogOut, Menu as MenuIcon, Palette, X, ChartPie, CalendarDays } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { Menu, type MenuEntry } from '@/components/overlays/Menu'
import { MegaMenu } from './MegaMenu'
import { MobileNav } from './MobileNav'

function UserMenu() {
  const { user, logout } = useAuth()
  if (!user) return null
  const entries: MenuEntry[] = [
    {
      type: 'custom',
      id: 'who',
      node: (
        <div className="menu-user">
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
      ),
    },
    { type: 'separator', id: 's1' },
    { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <ChartPie aria-hidden="true" /> },
    { id: 'calendar', label: 'Calendar', to: '/calendar', icon: <CalendarDays aria-hidden="true" /> },
    { id: 'settings', label: 'Theme & settings', to: '/settings', icon: <Palette aria-hidden="true" /> },
    { id: 'help', label: 'Help center', to: '/help', icon: <LifeBuoy aria-hidden="true" /> },
    { type: 'separator', id: 's2' },
    { id: 'logout', label: 'Sign out', onSelect: logout, icon: <LogOut aria-hidden="true" />, danger: true },
  ]
  return (
    <Menu
      entries={entries}
      trigger={
        <button type="button" className="nav-avatar" aria-label="Account menu">
          <Avatar name={user.name} size={36} />
        </button>
      }
    />
  )
}

export function Header() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <header className="site-header">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="container nav">
        <Logo />
        <nav className="nav-main" aria-label="Primary">
          <MegaMenu />
        </nav>
        <div className="nav-actions">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <ButtonLink to="/login" variant="plain" size="sm" className="nav-signin">
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" size="sm" arrow className="nav-get">
                Get started
              </ButtonLink>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon
            className="nav-burger"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
          </Button>
        </div>
      </div>
      <MobileNav open={mobileOpen} onClose={closeMobile} />
    </header>
  )
}
