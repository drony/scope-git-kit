import type { ReactNode } from 'react'
import { Quote } from 'lucide-react'
import { useFormat } from '@/lib/format'
import { portfolioSeries } from '@/lib/mock'
import { Sparkline } from '@/components/charts/Sparkline'
import { Delta } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

function Aside() {
  const fmt = useFormat()
  const { portfolio } = portfolioSeries(60)
  const first = portfolio[0].y
  const last = portfolio[portfolio.length - 1].y
  return (
    <aside className="auth-aside" aria-hidden="true">
      <div className="board">
        <div className="board-bar">
          <span className="board-meta">Net worth · 60 days</span>
          <span className="board-meta board-meta-country">Sample</span>
        </div>
        <div className="auth-figure">
          <div className="kpi">
            <span className="kpi-value">{fmt.money(last, 0)}</span>
            <span className="kpi-sub">
              <Delta value={(last / first - 1) * 100} /> since you joined
            </span>
          </div>
          <Sparkline data={portfolio.map((p) => p.y)} width={420} height={96} />
        </div>
        <div className="board-caption">
          <span>Updated this morning</span>
          <span>3 accounts</span>
        </div>
      </div>
      <figure className="auth-quote">
        <Quote size={18} aria-hidden="true" />
        <blockquote>“I used to open five apps before breakfast. Now I open one, and I already know where I stand.”</blockquote>
        <figcaption>
          <Avatar name="Maya Okafor" size={28} />
          <span>
            <strong>Maya Okafor</strong>
            <br />
            <span className="small">Product designer</span>
          </span>
        </figcaption>
      </figure>
    </aside>
  )
}

interface AuthLayoutProps {
  title: ReactNode
  lead?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Centered form beside a calm product preview. The preview is hidden on small screens. */
export function AuthLayout({ title, lead, children, footer }: AuthLayoutProps) {
  return (
    <section className="auth">
      <div className="container">
        <div className="auth-grid">
          <div className="auth-main">
            <h1>{title}</h1>
            {lead && <p className="lead">{lead}</p>}
            <div className="auth-form">{children}</div>
            {footer && <p className="auth-footer">{footer}</p>}
          </div>
          <Aside />
        </div>
      </div>
    </section>
  )
}
