import { assetStats, type Asset } from '@/apps/finscope/seed/market'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { Delta } from '@/kit/components/ui/Badge'
import { useFormat } from '@/kit/lib/format'

/** The content of the hover card on the Markets table: a quick look at an asset. */
export function AssetPeek({ asset }: { asset: Asset }) {
  const fmt = useFormat()
  const stats = assetStats(asset)
  const digits = asset.decimals > 2 ? asset.decimals : asset.price > 1000 ? 0 : 2
  return (
    <>
      <div className="row spread">
        <span>
          <strong>{asset.symbol}</strong> <span className="muted">{asset.name}</span>
        </span>
        <strong className="mono">{fmt.money(asset.price, digits)}</strong>
      </div>
      <Sparkline data={stats.spark} width={240} height={56} />
      <dl className="peek-stats">
        <div>
          <dt>7D</dt>
          <dd>
            <Delta value={stats.change7d} />
          </dd>
        </div>
        <div>
          <dt>30D</dt>
          <dd>
            <Delta value={stats.change30d} />
          </dd>
        </div>
        <div>
          <dt>YTD</dt>
          <dd>
            <Delta value={stats.changeYtd} />
          </dd>
        </div>
        <div className="peek-wide">
          <dt>52-week range</dt>
          <dd className="mono">
            {fmt.money(stats.low52, digits)} – {fmt.money(stats.high52, digits)}
          </dd>
        </div>
      </dl>
      <span className="small">Click the row to open the full chart.</span>
    </>
  )
}
