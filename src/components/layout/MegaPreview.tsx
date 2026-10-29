import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { MegaPreview as Kind, NavLink } from '@/config/navigation'
import { useFormat } from '@/lib/format'
import { useLang } from '@/lib/i18n'
import { today } from '@/lib/date'
import { ASSETS, NEWS, assetStats, eventsForMonth, portfolioSeries, type AssetClass } from '@/lib/mock'
import { CASH_ROWS, baseCash } from '@/lib/finance'
import { HELP_ARTICLES } from '@/lib/helpData'
import { Sparkline } from '@/components/charts/Sparkline'
import { Delta } from '@/components/ui/Badge'

/* One small, live-looking preview per kind. They use the same sample data as the real pages. */

function Assets({ cls }: { cls?: AssetClass }) {
  const fmt = useFormat()
  const list = ASSETS.filter((a) => !cls || a.cls === cls)
    .map((a) => ({ a, s: assetStats(a) }))
    .sort((x, y) => Math.abs(y.s.change1d) - Math.abs(x.s.change1d))
    .slice(0, 3)
  return (
    <ul className="mega-assets">
      {list.map(({ a, s }) => (
        <li key={a.symbol}>
          <span className="mono">{a.symbol}</span>
          <span className="muted">{fmt.money(a.price, a.decimals > 2 ? a.decimals : a.price > 1000 ? 0 : 2)}</span>
          <Sparkline data={s.spark} width={48} height={20} fill={false} />
          <Delta value={s.change1d} />
        </li>
      ))}
    </ul>
  )
}

function Portfolio() {
  const fmt = useFormat()
  const { portfolio } = portfolioSeries(30)
  const first = portfolio[0].y
  const last = portfolio[portfolio.length - 1].y
  return (
    <div className="mega-figure">
      <div className="row spread">
        <strong className="mono">{fmt.money(last, 0)}</strong>
        <Delta value={(last / first - 1) * 100} />
      </div>
      <Sparkline data={portfolio.map((p) => p.y)} width={260} height={56} />
    </div>
  )
}

function Events() {
  const fmt = useFormat()
  const now = today()
  const all = eventsForMonth(now.getFullYear(), now.getMonth()).sort((a, b) => a.date.getTime() - b.date.getTime())
  const upcoming = all.filter((e) => e.date >= now)
  const list = (upcoming.length ? upcoming : all).slice(0, 3)
  return (
    <ul className="mega-events">
      {list.map((e) => (
        <li key={e.id}>
          <span className={`dot ${e.tone === 'warning' ? 'dot-warning' : e.tone === 'error' ? 'dot-error' : ''}`} aria-hidden="true" />
          <span>{e.title}</span>
          <span className="mono muted">{fmt.date(e.date, 'day')}</span>
        </li>
      ))}
    </ul>
  )
}

function Table() {
  const fmt = useFormat()
  const lang = useLang()
  const now = today()
  const amount = (id: string) => {
    const row = CASH_ROWS.find((r) => r.id === id)
    return row ? baseCash(row, now.getFullYear(), now.getMonth()) : 0
  }
  const shown = ['payroll', 'ops', 'sales', 'subs']
  const net = CASH_ROWS.reduce((s, r) => s + baseCash(r, now.getFullYear(), now.getMonth()), 0)
  return (
    <table className="mega-mini">
      <tbody>
        {shown.map((id) => (
          <tr key={id}>
            <td>{CASH_ROWS.find((r) => r.id === id)?.label[lang]}</td>
            <td className="mono">{fmt.moneyCompact(amount(id))}</td>
          </tr>
        ))}
        <tr className="is-total">
          <td>{lang === 'tr' ? 'Net nakit akışı' : 'Net cash flow'}</td>
          <td className="mono">{fmt.moneyCompact(net)}</td>
        </tr>
      </tbody>
    </table>
  )
}

function News() {
  return (
    <ul className="mega-facts">
      {NEWS.slice(0, 3).map((n) => (
        <li key={n.id}>{n.title}</li>
      ))}
    </ul>
  )
}

function Articles({ slugs }: { slugs?: string[] }) {
  const list = (slugs ? HELP_ARTICLES.filter((a) => slugs.includes(a.slug)) : HELP_ARTICLES.filter((a) => a.popular)).slice(0, 3)
  return (
    <ul className="mega-events">
      {list.map((a) => (
        <li key={a.slug}>
          <span className="dot" aria-hidden="true" />
          <span>{a.title}</span>
          <span className="mono muted">{a.minutes} min</span>
        </li>
      ))}
    </ul>
  )
}

function Palette() {
  return (
    <div className="stack-sm">
      <div className="mega-swatches" aria-hidden="true">
        {['--ink', '--accent', '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--success'].map((v) => (
          <i key={v} style={{ background: `var(${v})` }} />
        ))}
      </div>
      <div className="gradient-preview" aria-hidden="true" />
    </div>
  )
}

function Body({ preview }: { preview: Kind }) {
  switch (preview.kind) {
    case 'assets':
      return <Assets cls={preview.cls} />
    case 'portfolio':
      return <Portfolio />
    case 'events':
      return <Events />
    case 'table':
      return <Table />
    case 'news':
      return <News />
    case 'articles':
      return <Articles slugs={preview.slugs} />
    case 'palette':
      return <Palette />
    case 'facts':
      return (
        <ul className="mega-facts">
          {preview.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )
  }
}

/**
 * The side panel of the mega menu while an item is hovered or focused. Mount it with `key={item.id}`
 * so the short fade-in plays each time the item changes.
 */
export function MegaPreview({ item, onNavigate }: { item: NavLink; onNavigate: () => void }) {
  const preview: Kind = item.preview ?? { kind: 'facts', points: item.description ? [item.description] : [] }
  return (
    <div className="mega-featured mega-preview" aria-live="polite">
      <span className="eyebrow" style={{ marginBottom: 0 }}>
        Preview
      </span>
      <h3>{item.label}</h3>
      <Body preview={preview} />
      {item.description && preview.kind !== 'facts' && <p className="small">{item.description}</p>}
      <Link className="mega-cta" to={item.to} onClick={onNavigate}>
        Open {item.label}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
