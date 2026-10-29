import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ExternalLink, Palette, X } from 'lucide-react'
import { useConfig } from '@/kit/context/ConfigContext'
import { Button } from '@/kit/components/ui/Button'
import { ThemeEditor } from './ThemeEditor'

interface ThemeDockProps {
  /**
   * Route of a full-page theme editor (a page that renders `<ThemeEditor>`). When set, the dock links to it
   * and hides itself on that page. Leave it out if your project has no such page.
   */
  settingsPath?: string
}

/**
 * Floating "Theme" button that opens the editor beside the page, so changes can be judged
 * on the real screen. It is a design-time tool and only mounts on the dev server.
 */
export function ThemeDock({ settingsPath }: ThemeDockProps) {
  const { panelOpen, setPanelOpen, dirty } = useConfig()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!panelOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanelOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panelOpen, setPanelOpen])

  if (!import.meta.env.DEV || (settingsPath && pathname === settingsPath)) return null

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
          {settingsPath && (
            <Link to={settingsPath} className="btn btn-plain btn-small btn-icon" aria-label="Open the full settings page" onClick={() => setPanelOpen(false)}>
              <ExternalLink aria-hidden="true" />
            </Link>
          )}
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
