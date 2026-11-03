import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { MegaFeatured, MegaPreview as PreviewSpec } from '@/apps/finscope/config/navigation'
import { ASSETS, assetStats, portfolioSeries } from '@/apps/finscope/seed/market'
import type { MegaSideContext } from '@/kit/components/nav/MegaMenu'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { Delta } from '@/kit/components/ui/Badge'
import { useFormat } from '@/kit/lib/format'
import { MegaPreview } from './MegaPreview'

/** The default card of a mega panel, before any link is hovered. */
function Featured({ data, onNavigate }: { data: MegaFeatured; onNavigate: () => void }) {
  const fmt = useFormat()
  const { portfolio } = portfolioSeries(30)
  const movers = [...ASSETS]
    .map((a) => ({ a, change: assetStats(a).change1d }))
    .sort((x, y) => Math.abs(y.change) - Math.abs(x.change))
    .slice(0, 3)
  const first = portfolio[0].y
  const last = portfolio[portfolio.length - 1].y

  return (
    <div className="mega-featured">
      <span className="eyebrow" style={{ marginBottom: 0 }}>
        {data.eyebrow}
      </span>
      <h3>{data.title}</h3>

      {data.kind === 'portfolio' && (
        <div className="mega-figure">
          <div className="row spread">
            <strong className="mono">{fmt.money(last, 0)}</strong>
            <Delta value={(last / first - 1) * 100} />
          </div>
          <Sparkline data={portfolio.map((p) => p.y)} width={260} height={56} />
        </div>
      )}

      {data.kind === 'movers' && (
        <ul className="mega-movers">
          {movers.map(({ a, change }) => (
            <li key={a.symbol}>
              <span className="mono">{a.symbol}</span>
              <span className="muted">{fmt.money(a.price, a.decimals > 2 ? 4 : 2)}</span>
              <Delta value={change} />
            </li>
          ))}
        </ul>
      )}

      <p className="small">{data.text}</p>
      <Link className="mega-cta" to={data.cta.to} onClick={onNavigate}>
        {data.cta.label}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}

/** The side column of the mega menu: a preview of the hovered link, or the menu's default card. */
export function MegaSide({ entry, item, close }: MegaSideContext<PreviewSpec, MegaFeatured>) {
  if (item) return <MegaPreview key={item.id} item={item} onNavigate={close} />
  return entry.mega?.featured ? <Featured data={entry.mega.featured} onNavigate={close} /> : null
}
