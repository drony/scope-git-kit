import { useCallback, useState } from 'react'
import { LifeBuoy, LogOut, Menu as MenuIcon, Palette, X, ChartPie, CalendarDays } from 'lucide-react'
import { useAuth } from '@/apps/finscope/context/AuthContext'
import { Avatar } from '@/kit/components/ui/Avatar'
import { Button, ButtonLink } from '@/kit/components/ui/Button'
import { Logo } from '@/apps/finscope/layout/Logo'
import { Menu, type MenuEntry } from '@/kit/components/overlays/Menu'
import { NAV } from '@/apps/finscope/config/navigation'
import { MegaMenu } from '@/kit/components/nav/MegaMenu'
import { SiteHeader } from '@/kit/components/nav/SiteHeader'
import { ThemeToggle } from '@/kit/components/theme/ThemeToggle'
import { MegaSide } from './MegaSide'
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
    <SiteHeader
      brand={<Logo />}
      actions={
        <>
          <ThemeToggle />
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
        </>
      }
      below={<MobileNav open={mobileOpen} onClose={closeMobile} />}
    >
      <MegaMenu entries={NAV} renderSide={(ctx) => <MegaSide {...ctx} />} />
    </SiteHeader>
  )
}
