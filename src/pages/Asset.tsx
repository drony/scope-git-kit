import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bell, ChartCandlestick, ChartLine, Star } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useFormat } from '@/lib/format'
import { CASH, CLASS_LABELS, NEWS, assetBySymbol, assetStats, ohlc, priceSeries, type Asset } from '@/lib/mock'
import { today } from '@/lib/date'
import { usePageTitle } from '@/lib/usePageTitle'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Delta, Tag } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Feedback'
import { Breadcrumbs } from '@/components/nav/Breadcrumbs'
import { Segmented } from '@/components/nav/Segmented'
import { AreaChart } from '@/components/charts/AreaChart'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { DatePicker } from '@/components/calendar/DatePicker'
import { TimeField } from '@/components/calendar/TimePicker'
import { Field, Input } from '@/components/forms/Field'
import { Select } from '@/components/forms/Select'
import { Slider } from '@/components/forms/Slider'
import { Switch } from '@/components/forms/Controls'
import { Modal } from '@/components/overlays/Modal'
import { Tooltip } from '@/components/overlays/Tooltip'

type RangeId = '1W' | '1M' | '3M' | '6M' | '1Y'
const DAYS: Record<RangeId, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

function OrderTicket({ asset }: { asset: Asset }) {
  const fmt = useFormat()
  const toast = useToast()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [type, setType] = useState<'market' | 'limit'>('market')
  const [amount, setAmount] = useState('')
  const [limit, setLimit] = useState(String(asset.price))
  const [pct, setPct] = useState(0)
  const [schedule, setSchedule] = useState(false)
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState('09:30')
  const [error, setError] = useState<string>()
  const [confirm, setConfirm] = useState(false)

  const value = Number(amount.replace(/,/g, '')) || 0
  const unitPrice = type === 'limit' ? Number(limit) || asset.price : asset.price
  const qty = unitPrice ? value / unitPrice : 0

  const review = () => {
    if (value <= 0) return setError('Enter an amount greater than zero.')
    if (side === 'buy' && value > CASH) return setError(`You only have ${fmt.money(CASH, 0)} available.`)
    if (schedule && !date) return setError('Choose a date for the scheduled order.')
    setError(undefined)
    setConfirm(true)
  }

  return (
    <Card className="stack ticket">
      <div className="row spread">
        <h2 className="card-title">Place an order</h2>
        <Tooltip label="Prices here are sample data, so no real order is placed.">
          <span className="tag" tabIndex={0}>
            Demo
          </span>
        </Tooltip>
      </div>
      <Segmented
        block
        ariaLabel="Order side"
        value={side}
        onChange={(s) => {
          setSide(s)
          setError(undefined)
        }}
        options={[
          { value: 'buy', label: 'Buy' },
          { value: 'sell', label: 'Sell' },
        ]}
      />
      <Field label="Order type">
        <Select
          value={type}
          onChange={setType}
          options={[
            { value: 'market', label: 'Market', description: 'Fill at the next available price' },
            { value: 'limit', label: 'Limit', description: 'Only fill at your price or better' },
          ]}
        />
      </Field>
      {type === 'limit' && (
        <Field label="Limit price">
          <Input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </Field>
      )}
      <Field label="Amount" error={error} hint={`Available: ${fmt.money(CASH, 0)}`}>
        <Input
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setError(undefined)
          }}
          affix={<span className="mono small" style={{ paddingRight: '0.5rem' }}>USD</span>}
        />
      </Field>
      <Slider
        label="Use of available cash"
        value={pct}
        onChange={(v) => {
          setPct(v)
          setAmount(v ? String(Math.round((CASH * v) / 100)) : '')
          setError(undefined)
        }}
        format={(v) => `${v}%`}
        ticks={['0%', '25%', '50%', '75%', '100%']}
      />
      <Switch checked={schedule} onChange={setSchedule} label="Schedule for later" description="Place this order on a date and time you choose." />
      {schedule && (
        <div className="form-grid">
          <Field label="Date">
            <DatePicker value={date} onChange={setDate} min={today()} placeholder="Pick a date" />
          </Field>
          <Field label="Time">
            <TimeField value={time} onChange={setTime} />
          </Field>
        </div>
      )}
      <dl className="summary">
        <div>
          <dt>Estimated quantity</dt>
          <dd className="mono">{fmt.num(qty, qty < 10 ? 4 : 2)}</dd>
        </div>
        <div>
          <dt>Fees</dt>
          <dd className="mono">{fmt.money(0)}</dd>
        </div>
        <div>
          <dt>Estimated total</dt>
          <dd className="mono">
            <strong>{fmt.money(value)}</strong>
          </dd>
        </div>
      </dl>
      <Button block size="lg" onClick={review} variant={side === 'buy' ? 'primary' : 'danger'}>
        {side === 'buy' ? 'Review buy order' : 'Review sell order'}
      </Button>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Confirm ${side} order`}
        description="Check the details. This is a demo, so nothing is actually traded."
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirm(false)
                setAmount('')
                setPct(0)
                toast.push({
                  tone: 'success',
                  title: schedule && date ? `Order scheduled for ${fmt.date(date, 'short')}` : 'Order placed',
                  description: `${side === 'buy' ? 'Buy' : 'Sell'} ${fmt.num(qty, 4)} ${asset.symbol} · ${fmt.money(value)}`,
                })
              }}
            >
              Confirm {side}
            </Button>
          </>
        }
      >
        <dl className="summary">
          <div>
            <dt>Asset</dt>
            <dd>{asset.name}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{type === 'limit' ? `Limit at ${fmt.money(unitPrice)}` : 'Market'}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd className="mono">{fmt.num(qty, 4)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd className="mono">
              <strong>{fmt.money(value)}</strong>
            </dd>
          </div>
          {schedule && date && (
            <div>
              <dt>When</dt>
              <dd>
                {fmt.date(date, 'long')} at {time}
              </dd>
            </div>
          )}
        </dl>
      </Modal>
    </Card>
  )
}

function AssetView({ asset }: { asset: Asset }) {
  const fmt = useFormat()
  const toast = useToast()
  usePageTitle(`${asset.symbol} · ${asset.name}`)
  const [range, setRange] = useState<RangeId>('3M')
  const [view, setView] = useState<'line' | 'candles'>('line')
  const [watching, setWatching] = useState(false)

  const stats = useMemo(() => assetStats(asset), [asset])
  const series = useMemo(() => priceSeries(asset, DAYS[range]), [asset, range])
  const candles = useMemo(() => ohlc(asset, Math.min(DAYS[range], 120)), [asset, range])
  const dec = asset.decimals > 2 ? asset.decimals : asset.price > 1000 ? 0 : 2
  const price = (n: number) => fmt.money(n, dec)
  const last = candles[candles.length - 1]

  return (
    <>
      <section className="page-bar">
        <div className="container stack">
          <Breadcrumbs items={[{ label: 'Markets', to: '/markets' }, { label: CLASS_LABELS[asset.cls], to: `/markets?class=${asset.cls}` }, { label: asset.symbol }]} />
          <div className="row spread wrap top">
            <div className="row">
              <AssetIcon symbol={asset.symbol} className="board-icon-lg" />
              <div>
                <h1 style={{ fontSize: '1.75rem' }}>
                  {asset.name} <Tag>{asset.symbol}</Tag>
                </h1>
                <div className="row" style={{ gap: '0.625rem' }}>
                  <strong className="asset-price">{price(asset.price)}</strong>
                  <Delta value={stats.change1d} />
                  <span className="small">today</span>
                </div>
              </div>
            </div>
            <div className="row">
              <Button
                variant="ghost"
                aria-pressed={watching}
                onClick={() => {
                  setWatching((w) => !w)
                  toast.push({ title: watching ? `Removed ${asset.symbol} from your watchlist` : `Added ${asset.symbol} to your watchlist` })
                }}
              >
                <Star aria-hidden="true" fill={watching ? 'currentColor' : 'none'} />
                {watching ? 'Watching' : 'Watch'}
              </Button>
              <Button variant="ghost" onClick={() => toast.push({ tone: 'info', title: 'Alert set', description: `We will email you when ${asset.symbol} moves 5%.` })}>
                <Bell aria-hidden="true" />
                Alert
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section dash-section">
        <div className="container stack-lg">
          <div className="asset-grid">
            <div className="stack-lg">
              <Card>
                <div className="row spread wrap" style={{ marginBottom: '1rem' }}>
                  <Segmented<'line' | 'candles'>
                    ariaLabel="Chart type"
                    value={view}
                    onChange={setView}
                    options={[
                      { value: 'line', label: 'Line', icon: <ChartLine aria-hidden="true" /> },
                      { value: 'candles', label: 'Candles', icon: <ChartCandlestick aria-hidden="true" /> },
                    ]}
                  />
                  <Segmented<RangeId>
                    ariaLabel="Chart range"
                    mono
                    value={range}
                    onChange={setRange}
                    options={(Object.keys(DAYS) as RangeId[]).map((r) => ({ value: r, label: r }))}
                  />
                </div>
                {view === 'line' ? (
                  <AreaChart
                    ariaLabel={`${asset.name} price over ${range}`}
                    height={380}
                    formatY={(n) => price(n)}
                    formatX={(d) => fmt.date(d, 'day')}
                    formatTip={(d) => fmt.date(d, 'short')}
                    series={[{ id: 'price', label: asset.symbol, data: series, area: true }]}
                  />
                ) : (
                  <CandlestickChart
                    ariaLabel={`${asset.name} daily candles`}
                    height={380}
                    data={candles}
                    formatY={(n) => (asset.price > 1000 ? fmt.num(n, 0) : fmt.num(n, asset.decimals))}
                    formatX={(d) => fmt.date(d, 'day')}
                    formatVolume={(n) => fmt.compact(n)}
                  />
                )}
                {view === 'candles' && DAYS[range] > 120 && <p className="small">Candles show the most recent 120 days.</p>}
              </Card>

              <div className="lattice lattice-4 lattice-stats">
                <div className="kpi">
                  <span className="kpi-label">Day range</span>
                  <span className="kpi-value stat">
                    {price(last.l)} – {price(last.h)}
                  </span>
                </div>
                <div className="kpi">
                  <span className="kpi-label">52-week range</span>
                  <span className="kpi-value stat">
                    {price(stats.low52)} – {price(stats.high52)}
                  </span>
                </div>
                <div className="kpi">
                  <span className="kpi-label">Average volume</span>
                  <span className="kpi-value stat">{asset.cls === 'fx' ? '—' : fmt.compact(asset.volume)}</span>
                </div>
                <div className="kpi">
                  <span className="kpi-label">Year to date</span>
                  <span className="kpi-value stat">
                    <Delta value={stats.changeYtd} />
                  </span>
                </div>
              </div>

              <Alert tone="info" title="Sample data">
                Every price on this page is generated for the demo. Connect a market data provider in <code>src/lib/mock.ts</code> to go live.
              </Alert>
            </div>

            <div className="stack-lg">
              <OrderTicket asset={asset} />
              <Card flush>
                <div className="card-head">
                  <h2 className="card-title">Related headlines</h2>
                </div>
                <ul className="mover-rows news-rows">
                  {NEWS.slice(0, 3).map((n) => (
                    <li key={n.id}>
                      <span className="board-name" style={{ gridColumn: '1 / 3' }}>
                        <strong>{n.title}</strong>
                        <span>
                          {n.source} · {n.time} ago
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default function AssetPage() {
  const { symbol = '' } = useParams()
  const asset = assetBySymbol(symbol)
  usePageTitle(asset ? undefined : 'Asset not found')

  if (!asset) {
    return (
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Markets</span>
          <h1>We do not list “{symbol}”</h1>
          <p className="lead">Check the symbol, or browse everything we do cover.</p>
          <div className="cta-row">
            <ButtonLink to="/markets" arrow>
              Browse markets
            </ButtonLink>
          </div>
          <p className="small" style={{ marginTop: '1rem' }}>
            Or go back <Link to="/">home</Link>.
          </p>
        </div>
      </section>
    )
  }
  return <AssetView asset={asset} />
}
