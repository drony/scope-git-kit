import { useMemo, useState } from 'react'
import { Info, Search } from 'lucide-react'
import { useFormat } from '@/kit/lib/format'
import { ASSETS, assetStats, portfolioSeries } from '@/apps/finscope/seed/market'
import { Button } from '@/kit/components/ui/Button'
import { Chip, Delta, Tag } from '@/kit/components/ui/Badge'
import { Alert, Meter } from '@/kit/components/ui/Feedback'
import { Terminal } from '@/kit/components/ui/Terminal'
import { Segmented } from '@/kit/components/nav/Segmented'
import { AreaChart } from '@/kit/components/charts/AreaChart'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { Checkbox, Switch } from '@/kit/components/forms/Controls'
import { Field, Input } from '@/kit/components/forms/Field'

/** A compact tour of the styled components, shown next to the editor. */
export function ThemePreview() {
  const fmt = useFormat()
  const [range, setRange] = useState<'1M' | '3M' | '6M'>('3M')
  const [alerts, setAlerts] = useState(true)
  const [agree, setAgree] = useState(true)
  const days = { '1M': 30, '3M': 90, '6M': 180 }[range]
  const { portfolio, benchmark } = useMemo(() => portfolioSeries(days), [days])
  const rows = ASSETS.slice(0, 5)

  return (
    <div className="stack-lg">
      <div className="card stack">
        <span className="eyebrow" style={{ margin: 0 }}>
          Live preview
        </span>
        <h2 style={{ fontSize: '2rem' }}>
          Every account.
          <br />
          <span className="gradient">One clear picture.</span>
        </h2>
        <p className="lead">Body copy uses the body color; secondary text uses the muted color. Links look <a href="#preview">like this</a>.</p>
        <div className="row wrap">
          <Button arrow>Primary</Button>
          <Button variant="ghost">Secondary</Button>
          <Button variant="plain">Plain</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="row wrap">
          <Chip mark="F" markColor="var(--chart-1)">Chip</Chip>
          <Tag>Tag</Tag>
          <Tag tone="accent">Accent</Tag>
          <Tag tone="success">Gain</Tag>
          <Tag tone="warning">Warning</Tag>
          <Tag tone="error">Loss</Tag>
        </div>
      </div>

      <div className="board">
        <div className="board-bar">
          <span className="board-query">
            <Search aria-hidden="true" />
            Watchlist
          </span>
          <span className="board-meta board-meta-country">Sample data</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
              <th>Change</th>
              <th>30D</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const s = assetStats(a)
              return (
                <tr key={a.symbol} className={i === 0 ? 'is-you' : undefined}>
                  <td>{a.symbol}</td>
                  <td>{fmt.money(a.price, a.decimals > 2 ? 4 : 2)}</td>
                  <td>
                    <Delta value={s.change1d} />
                  </td>
                  <td>
                    <Sparkline data={s.spark} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row spread wrap" style={{ marginBottom: '1rem' }}>
          <div className="kpi">
            <span className="kpi-label">Portfolio value</span>
            <span className="kpi-value">{fmt.money(portfolio[portfolio.length - 1].y, 0)}</span>
          </div>
          <Segmented ariaLabel="Preview range" mono value={range} onChange={setRange} options={[{ value: '1M', label: '1M' }, { value: '3M', label: '3M' }, { value: '6M', label: '6M' }]} />
        </div>
        <AreaChart
          ariaLabel="Portfolio value compared with the benchmark"
          height={220}
          formatY={(n) => fmt.moneyCompact(n)}
          formatX={(d) => fmt.date(d, 'day')}
          formatTip={(d) => fmt.date(d, 'short')}
          series={[
            { id: 'p', label: 'Portfolio', data: portfolio, area: true },
            { id: 'b', label: 'S&P 500', data: benchmark, dashed: true, color: 'var(--muted)' },
          ]}
        />
      </div>

      <div className="card stack">
        <Field label="Amount" hint="Inputs use the border and surface colors.">
          <Input defaultValue="2,500.00" />
        </Field>
        <Switch checked={alerts} onChange={setAlerts} label="Price alerts" description="Email me when a holding moves more than 5%." />
        <Checkbox checked={agree} onChange={setAgree} label="I understand this is sample data" />
        <div>
          <div className="row spread small">
            <span>Risk level</span>
            <span className="mono">41 / 100</span>
          </div>
          <Meter value={41} label="Risk level" />
        </div>
        <Alert tone="info" title="Heads up">
          Alerts use the status colors. <Info size={0} aria-hidden="true" />
        </Alert>
        <Terminal head="API" rows={[{ label: 'Quotes', code: 'curl https://api.example.com/v1/quotes?symbols=AAPL', shell: true }]} />
      </div>
    </div>
  )
}
