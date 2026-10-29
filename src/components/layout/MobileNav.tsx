import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NAV } from '@/config/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button, ButtonLink } from '@/components/ui/Button'

/** Full-width menu under the header on small screens. */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="mobile-nav" id="mobile-nav">
      <nav aria-label="Mobile">
        <ul>
          {NAV.map((entry) =>
            entry.mega ? (
              <li key={entry.id}>
                <details>
                  <summary>{entry.label}</summary>
                  <div className="mobile-group">
                    {entry.mega.columns.map((col) => (
                      <div key={col.title}>
                        <span className="eyebrow">{col.title}</span>
                        <ul>
                          {col.items.map((item) => (
                            <li key={item.id}>
                              <Link to={item.to} className="mobile-link">
                                {item.icon && <item.icon size={16} aria-hidden="true" />}
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              </li>
            ) : (
              <li key={entry.id}>
                <Link to={entry.to ?? '/'} className="mobile-top">
                  {entry.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
      <div className="mobile-cta">
        {user ? (
          <>
            <ButtonLink to="/dashboard" block arrow>
              Open dashboard
            </ButtonLink>
            <Button variant="ghost" block onClick={logout}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <ButtonLink to="/register" block arrow>
              Get started
            </ButtonLink>
            <ButtonLink to="/login" variant="ghost" block>
              Sign in
            </ButtonLink>
          </>
        )}
      </div>
    </div>
  )
}
