import { PageHero } from '@/kit/components/ui/Section'
import { ThemeEditor } from '@/kit/components/theme/ThemeEditor'
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
        lead="Change colors, radius, fonts and defaults. The whole site updates live. When it looks right, copy the JSON (or save it to the project): src/apps/contest/settings/app.config.json is the only file that changes."
      />
      <section className="section">
        <div className="container">
          <aside className="card" aria-label="Theme editor">
            <ThemeEditor />
          </aside>
        </div>
      </section>
    </>
  )
}
