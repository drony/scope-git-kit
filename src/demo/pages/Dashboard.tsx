import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Inbox, Sparkles } from 'lucide-react'
import { useAuth } from '@/demo/context/AuthContext'
import { useToast } from '@/kit/context/ToastContext'
import { useFormat } from '@/kit/lib/format'
import { addDays, today, type DateRange } from '@/kit/lib/date'
import { CASH, CLASS_LABELS, allocation, cashFlow, dailyPnl, holdingRows, portfolioSeries, transactions, type HoldingRow, type Transaction } from '@/demo/seed/market'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { Button } from '@/kit/components/ui/Button'
import { Chip, Delta, Tag } from '@/kit/components/ui/Badge'
import { AssetIcon } from '@/kit/components/ui/AssetIcon'
import { Card, Kpi } from '@/kit/components/ui/Card'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { Reveal } from '@/kit/components/ui/Reveal'
import { TryList, type TryTask } from '@/kit/components/grid/TryList'
import { useTryList } from '@/kit/hooks/useTryList'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Pagination } from '@/kit/components/nav/Pagination'
import { DataTable, type Column } from '@/kit/components/data/DataTable'
import { AreaChart } from '@/kit/components/charts/AreaChart'
import { BarChart } from '@/kit/components/charts/BarChart'
import { DonutChart } from '@/kit/components/charts/DonutChart'
import { Heatmap } from '@/kit/components/charts/Heatmap'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { DateRangePicker } from '@/kit/components/calendar/DateRangePicker'
import { SearchInput } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'

const PAGE_SIZE = 8

/** What a visitor can do on this page; each one ticks a step of the "Try it" list. */
type DashEvent = 'range' | 'bench' | 'chart' | 'donut' | 'sort' | 'activity'
const EVENT_TASKS: Record<DashEvent, string> = { range: 'range', bench: 'bench', chart: 'chart', donut: 'donut', sort: 'sort', activity: 'activity' }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function HoldingsTable({ linked, onLinked, onSort }: { linked: string | null; onLinked: (id: string | null) => void; onSort: () => void }) {
  const fmt = useFormat()
  const navigate = useNavigate()
  const rows = useMemo(holdingRows, [])
  /** The allocation slice a holding belongs to; it matches the donut's slice ids. */
  const classId = (r: HoldingRow) => CLASS_LABELS[r.cls].toLowerCase()

  const columns: Column<HoldingRow>[] = [
    {
      key: 'name',
      header: 'Holding',
      sortValue: (r) => r.symbol,
      render: (r) => (
        <span className="row">
          <AssetIcon symbol={r.symbol} />
          <span className="board-name">
            <strong>{r.symbol}</strong>
            <span>{r.name}</span>
          </span>
        </span>
      ),
    },
    { key: 'qty', header: 'Qty', sortValue: (r) => r.qty, render: (r) => fmt.num(r.qty, r.qty < 10 ? 2 : 0) },
    { key: 'price', header: 'Price', sortValue: (r) => r.price, render: (r) => fmt.money(r.price, r.price > 1000 ? 0 : 2) },
    { key: 'value', header: 'Value', sortValue: (r) => r.value, render: (r) => <strong>{fmt.money(r.value, 0)}</strong> },
    { key: 'day', header: 'Day', sortValue: (r) => r.dayPct, render: (r) => <Delta value={r.dayPct} /> },
    { key: 'return', header: 'Return', sortValue: (r) => r.returnPct, render: (r) => <Delta value={r.returnPct} digits={1} /> },
    { key: 'spark', header: '30D', render: (r) => <Sparkline data={r.spark} width={80} height={24} /> },
  ]

  return (
    <DataTable
      caption="Holdings"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.symbol}
      initialSort={{ key: 'value', dir: 'desc' }}
      onRowClick={(r) => navigate(`/markets/${r.symbol}`)}
      rowClassName={(r) => (linked === classId(r) ? 'is-linked' : undefined)}
      onRowHover={(r) => onLinked(r ? classId(r) : null)}
      onSortChange={(sort) => sort && onSort()}
    />
  )
}

function ActivityTable() {
  const fmt = useFormat()
  const all = useMemo(() => transactions(48), [])
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const categories = useMemo(() => ['all', ...Array.from(new Set(all.map((t) => t.category)))], [all])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((t) => (category === 'all' || t.category === category) && (!q || `${t.title} ${t.account}`.toLowerCase().includes(q)))
  }, [all, category, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Column<Transaction>[] = [
    { key: 'date', header: 'Date', align: 'left', render: (t) => <span className="mono">{fmt.date(t.date, 'day')}</span> },
    {
      key: 'title',
      header: 'Description',
      align: 'left',
      render: (t) => (
        <span className="board-name">
          <strong>{t.title}</strong>
          <span>{t.account}</span>
        </span>
      ),
    },
    { key: 'cat', header: 'Category', align: 'left', render: (t) => <Tag>{t.category}</Tag> },
    {
      key: 'status',
      header: 'Status',
      align: 'left',
      render: (t) => (t.status === 'pending' ? <Tag tone="warning">Pending</Tag> : <span className="muted">Posted</span>),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => <span className={t.amount > 0 ? 'delta' : 'mono'}>{fmt.moneySigned(t.amount)}</span>,
    },
  ]

  return (
    <div className="stack">
      <div className="row wrap">
        <div style={{ flex: '1 1 14rem', maxWidth: '20rem' }}>
          <SearchInput
            value={query}
            onValueChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            placeholder="Search transactions"
            aria-label="Search transactions"
          />
        </div>
        <div style={{ width: '12rem' }}>
          <Select
            ariaLabel="Category"
            value={category}
            onChange={(c) => {
              setCategory(c)
              setPage(1)
            }}
            options={categories.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))}
          />
        </div>
        <span className="small grow" style={{ textAlign: 'right' }}>
          {filtered.length} transactions
        </span>
      </div>
      <DataTable
        caption="Recent transactions"
        columns={columns}
        rows={visible}
        rowKey={(t) => t.id}
        empty={<EmptyState icon={<Inbox size={18} />} title="No transactions found">Try a different search or category.</EmptyState>}
      />
      <div className="row spread">
        <span className="small">
          Page {page} of {pageCount}
        </span>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  usePageTitle('Dashboard')
  const fmt = useFormat()
  const toast = useToast()
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(() => ({ from: addDays(today(), -89), to: today() }))
  const [showBench, setShowBench] = useState(true)
  const [tab, setTab] = useState('holdings')
  /** The asset class under the pointer, in the donut or in the holdings table. Both highlight it. */
  const [linked, setLinked] = useState<string | null>(null)
  const tryout = useTryList<DashEvent>('finscope.try.dashboard', EVENT_TASKS)

  const full = useMemo(() => portfolioSeries(365), [])
  const slice = useMemo(() => {
    const from = range.from ?? full.portfolio[0].x
    const to = range.to ?? today()
    const portfolio = full.portfolio.filter((p) => p.x >= from && p.x <= to)
    const benchmark = full.benchmark.filter((p) => p.x >= from && p.x <= to)
    const k = portfolio.length && benchmark.length ? portfolio[0].y / benchmark[0].y : 1
    return { portfolio, benchmark: benchmark.map((p) => ({ ...p, y: p.y * k })) }
  }, [full, range])

  const first = slice.portfolio[0]?.y ?? 0
  const last = slice.portfolio[slice.portfolio.length - 1]?.y ?? 0
  const slices = useMemo(() => allocation(), [])
  const flow = useMemo(() => cashFlow(12), [])
  const pnl = useMemo(() => dailyPnl(365), [])
  const spend = useMemo(() => {
    const now = new Date()
    return transactions(48)
      .filter((t) => t.amount < 0 && t.category !== 'Investing' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((sum, t) => sum - t.amount, 0)
  }, [])

  const firstName = user?.name.split(' ')[0]

  const tasks: TryTask[] = [
    { id: 'range', title: 'Change the date range', hint: 'Open the range picker at the top and choose Last 30 days or two dates of your own.' },
    { id: 'bench', title: 'Compare with the S&P 500', hint: 'Switch the S&P 500 chip on the performance chart off and on.' },
    { id: 'chart', title: 'Read the chart', hint: 'Hover the performance chart, or focus it and press the arrow keys.' },
    { id: 'donut', title: 'Link the donut and the table', hint: 'Hover a slice of the allocation donut: the matching holdings light up. Hover a holding to light up its slice.' },
    { id: 'sort', title: 'Sort the holdings', hint: 'Click a column title such as Return or Value in the table at the bottom.' },
    { id: 'activity', title: 'Open the Activity tab', hint: 'Switch to Activity, then search or filter the transactions.' },
  ]

  return (
    <>
      <section className="page-bar">
        <div className="container">
          <div className="row spread wrap top">
            <div>
              <span className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                Dashboard
              </span>
              <h1 style={{ fontSize: 'clamp(1.75rem, 1.3rem + 1.7vw, 2.375rem)' }}>{firstName ? `${greeting()}, ${firstName}` : 'Portfolio overview'}</h1>
            </div>
            <div className="row wrap">
              <Button variant="ghost" aria-expanded={tryout.open} onClick={() => tryout.setOpen(!tryout.open)}>
                <Sparkles aria-hidden="true" />
                Try it
                <span className="g-badge">
                  {tryout.done.size}/{tasks.length}
                </span>
              </Button>
              <div className="range-field">
                <DateRangePicker
                  value={range}
                  onChange={(r) => {
                    setRange(r)
                    tryout.mark('range')
                  }}
                  ariaLabel="Date range"
                />
              </div>
              <Button variant="ghost" onClick={() => toast.push({ tone: 'success', title: 'Export started', description: 'We will email you a CSV in a minute.' })}>
                <Download aria-hidden="true" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section dash-section">
        <div className="container stack-lg">
          {tryout.open && (
            <TryList
              heading="Try the dashboard"
              tasks={tasks}
              done={tryout.done}
              allDoneText="You have tried everything. Charts, tables and the donut are all linked."
              closeLabel="Hide"
              onClose={() => tryout.setOpen(false)}
            />
          )}

          <Reveal className="lattice lattice-4">
            <Kpi label="Net worth" value={fmt.money(last, 0)} sub={<><Delta value={first ? (last / first - 1) * 100 : 0} /> in this range</>} />
            <Kpi label="Gain / loss" value={fmt.moneySigned(last - first, 0)} sub="Over the selected range" />
            <Kpi label="Cash" value={fmt.money(CASH, 0)} sub="Across 3 accounts" />
            <Kpi label="Spent this month" value={fmt.money(spend, 0)} sub="Excluding investing" />
          </Reveal>

          <div className="dash-grid">
            <Reveal as="div" index={1}>
              <Card>
                <div className="row spread wrap" style={{ marginBottom: '1rem' }}>
                  <h2 className="card-title">Performance</h2>
                  <div className="row">
                    <Chip mark="P" markColor="var(--chart-1)" pressed>
                      Portfolio
                    </Chip>
                    <Chip mark="S" markColor="var(--muted)" pressed={showBench} onClick={() => {
                        setShowBench((v) => !v)
                        tryout.mark('bench')
                      }}>
                      S&P 500
                    </Chip>
                  </div>
                </div>
                {slice.portfolio.length > 1 ? (
                  <AreaChart
                    ariaLabel="Portfolio value over the selected range"
                    onHover={() => tryout.mark('chart')}
                    height={300}
                    formatY={(n) => fmt.moneyCompact(n)}
                    formatX={(d) => fmt.date(d, 'day')}
                    formatTip={(d) => fmt.date(d, 'short')}
                    series={[
                      { id: 'p', label: 'Portfolio', data: slice.portfolio, area: true },
                      ...(showBench ? [{ id: 'b', label: 'S&P 500', data: slice.benchmark, dashed: true, color: 'var(--muted)' }] : []),
                    ]}
                  />
                ) : (
                  <EmptyState title="Pick a longer range">Choose at least two days to draw the chart.</EmptyState>
                )}
              </Card>
            </Reveal>
            <Reveal as="div" index={2}>
              <Card>
                <CardHeadless title="Allocation" />
                <DonutChart
                  ariaLabel="Portfolio allocation by asset class"
                  slices={slices}
                  centerLabel="Total"
                  centerValue={fmt.moneyCompact(slices.reduce((s, x) => s + x.value, 0))}
                  formatValue={(n) => fmt.money(n, 0)}
                  size={168}
                  activeId={linked}
                  onActiveChange={(id) => {
                    setLinked(id)
                    if (id) tryout.mark('donut')
                  }}
                />
              </Card>
            </Reveal>
          </div>

          <div className="dash-grid dash-grid-even">
            <Reveal as="div">
              <Card>
                <CardHeadless title="Cash flow, 12 months" />
                <BarChart
                  ariaLabel="Monthly income and spending for the last 12 months"
                  data={flow}
                  series={[
                    { key: 'income', label: 'Income', color: 'var(--chart-1)' },
                    { key: 'spend', label: 'Spending', color: 'var(--chart-2)' },
                  ]}
                  formatY={(n) => fmt.moneyCompact(n)}
                  height={240}
                />
              </Card>
            </Reveal>
            <Reveal as="div" index={1}>
              <Card>
                <CardHeadless title="Daily gain and loss" />
                <Heatmap
                  ariaLabel="Heatmap of daily portfolio gains and losses over the past year"
                  data={pnl}
                  from={addDays(today(), -364)}
                  to={today()}
                  formatValue={(n) => fmt.moneySigned(n, 0)}
                />
              </Card>
            </Reveal>
          </div>

          <Reveal>
            <Tabs
              ariaLabel="Portfolio details"
              value={tab}
              onChange={(id) => {
                setTab(id)
                if (id === 'activity') tryout.mark('activity')
              }}
              items={[
                { id: 'holdings', label: 'Holdings', count: holdingRows().length },
                { id: 'activity', label: 'Activity' },
              ]}
              panels={{ holdings: <HoldingsTable linked={linked} onLinked={setLinked} onSort={() => tryout.mark('sort')} />, activity: <ActivityTable /> }}
            />
          </Reveal>
        </div>
      </section>
    </>
  )
}

function CardHeadless({ title }: { title: string }) {
  return (
    <h2 className="card-title" style={{ marginBottom: '1rem' }}>
      {title}
    </h2>
  )
}
