import { PageHero } from '@/kit/components/ui/Section'
import { ThemeEditor } from '@/kit/components/theme/ThemeEditor'
import { ThemePreview } from '@/demo/components/ThemePreview'
import { usePageTitle } from '@/kit/hooks/usePageTitle'

export default function Settings() {
  usePageTitle('Theme & settings')
  return (
    <>
      <PageHero
        eyebrow="Settings"
        title={
          <>
            Theme & <span className="gradient">settings</span>
          </>
        }
        lead="Change colors, radius, fonts and defaults. The whole site updates live. When it looks right, copy the JSON (or save it to the project) — src/config/app.config.json is the only file that changes."
      />
      <section className="section">
        <div className="container">
          <div className="settings-grid">
            <aside className="card settings-editor" aria-label="Theme editor">
              <ThemeEditor />
            </aside>
            <ThemePreview />
          </div>
        </div>
      </section>
    </>
  )
}
