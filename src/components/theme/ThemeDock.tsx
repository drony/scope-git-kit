import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ExternalLink, Palette, X } from 'lucide-react'
import { useConfig } from '@/context/ConfigContext'
import { Button } from '@/components/ui/Button'
import { ThemeEditor } from './ThemeEditor'

/**
 * Floating "Theme" button that opens the editor beside the page, so changes can be judged
 * on the real screen. It is a design-time tool and only mounts on the dev server.
 */
export function ThemeDock() {
  const { panelOpen, setPanelOpen, dirty } = useConfig()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!panelOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanelOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panelOpen, setPanelOpen])

  if (!import.meta.env.DEV || pathname === '/settings') return null

  if (!panelOpen) {
    return (
      <button type="button" className="dock-fab" onClick={() => setPanelOpen(true)} aria-label="Open theme and settings">
        <Palette size={16} aria-hidden="true" />
        Theme
        {dirty && <span className="dot dot-warning" aria-label="Unsaved changes" />}
      </button>
    )
  }

  return (
    <aside className="dock" aria-label="Theme and settings">
      <div className="dock-head">
        <h2 style={{ fontSize: '1.0625rem' }}>Theme & settings</h2>
        <div className="row" style={{ gap: '0.25rem' }}>
          <Link to="/settings" className="btn btn-plain btn-small btn-icon" aria-label="Open the full settings page" onClick={() => setPanelOpen(false)}>
            <ExternalLink aria-hidden="true" />
          </Link>
          <Button variant="plain" size="sm" icon onClick={() => setPanelOpen(false)} aria-label="Close theme panel">
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="dock-body">
        <ThemeEditor />
      </div>
    </aside>
  )
}
