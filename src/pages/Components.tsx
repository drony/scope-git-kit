import { useMemo, useState, type ReactNode } from 'react'
import { Bell, ChevronDown, Copy, Download, Inbox, Mail, Plus, Search, Settings, Trash2, User } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useFormat } from '@/lib/format'
import { addDays, today, type DateRange } from '@/lib/date'
import { ASSETS, allocation, assetBySymbol, assetStats, cashFlow, dailyPnl, ohlc, portfolioSeries, type Asset } from '@/lib/mock'
import { asset } from '@/lib/asset'
import { usePageTitle } from '@/lib/usePageTitle'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Chip, Delta, Dot, Kbd, Tag } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Alert, EmptyState, Meter, Skeleton } from '@/components/ui/Feedback'
import { Terminal } from '@/components/ui/Terminal'
import { Accordion } from '@/components/nav/Accordion'
import { Breadcrumbs } from '@/components/nav/Breadcrumbs'
import { Pagination } from '@/components/nav/Pagination'
import { Segmented } from '@/components/nav/Segmented'
import { Stepper } from '@/components/nav/Stepper'
import { Tabs } from '@/components/nav/Tabs'
import { DataTable, type Column } from '@/components/data/DataTable'
import { AreaChart } from '@/components/charts/AreaChart'
import { BarChart } from '@/components/charts/BarChart'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { Heatmap } from '@/components/charts/Heatmap'
import { Sparkline } from '@/components/charts/Sparkline'
import { Calendar } from '@/components/calendar/Calendar'
import { DatePicker } from '@/components/calendar/DatePicker'
import { DateRangePicker } from '@/components/calendar/DateRangePicker'
import { MonthField, MonthPicker, type YearMonth } from '@/components/calendar/MonthPicker'
import { TimeField } from '@/components/calendar/TimePicker'
import { Checkbox, RadioGroup, Switch } from '@/components/forms/Controls'
import { Dropzone, PhotoPicker } from '@/components/forms/Dropzone'
import { Field, Input, PasswordField, SearchInput, Textarea } from '@/components/forms/Field'
import { OtpInput } from '@/components/forms/OtpInput'
import { PasswordStrength } from '@/components/forms/PasswordStrength'
import { Select } from '@/components/forms/Select'
import { Slider } from '@/components/forms/Slider'
import { Gallery } from '@/components/media/Gallery'
import { Shot } from '@/components/media/Shot'
import { Drawer } from '@/components/overlays/Drawer'
import { Menu } from '@/components/overlays/Menu'
import { Modal } from '@/components/overlays/Modal'
import { Popover } from '@/components/overlays/Popover'
import { Tooltip } from '@/components/overlays/Tooltip'

const SECTIONS = [
  ['buttons', 'Buttons & badges'],
  ['inputs', 'Inputs'],
  ['selection', 'Selection'],
  ['dates', 'Date & time'],
  ['overlays', 'Overlays'],
  ['feedback', 'Feedback'],
  ['navigation', 'Navigation'],
  ['data', 'Data'],
  ['charts', 'Charts'],
  ['media', 'Media'],
] as const

function Block({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} className="kit-block">
      <span className="eyebrow">{title}</span>
      {lead && <p className="lead">{lead}</p>}
      <div className="stack-lg" style={{ marginTop: '1.25rem' }}>
        {children}
      </div>
    </section>
  )
}

function Demo({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'demo demo-wide' : 'demo'}>
      <h3 className="demo-title">{title}</h3>
      <div className="demo-body">{children}</div>
    </div>
  )
}

/* ---- sections ------------------------------------------------------------------ */

function Buttons() {
  const [pressed, setPressed] = useState(true)
  return (
    <Block id="buttons" title="Buttons & badges" lead="Sizes and variants share the radius, weight and arrow from ascope.app.">
      <Demo title="Variants">
        <div className="row wrap">
          <Button>Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="plain">Plain</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </Demo>
      <Demo title="Sizes and arrow">
        <div className="row wrap">
          <Button size="sm">Small</Button>
          <Button>Medium</Button>
          <Button size="lg" arrow>
            Large with arrow
          </Button>
          <Button variant="ghost" icon aria-label="Settings">
            <Settings aria-hidden="true" />
          </Button>
          <Button variant="ghost">
            <Download aria-hidden="true" />
            With icon
          </Button>
        </div>
      </Demo>
      <Demo title="Chips, tags and status">
        <div className="row wrap">
          <Chip mark="A" markColor="var(--chart-1)">
            Chip
          </Chip>
          <Chip pressed={pressed} onClick={() => setPressed((p) => !p)}>
            Toggle chip
          </Chip>
          <Tag>Tag</Tag>
          <Tag tone="accent">Accent</Tag>
          <Tag tone="success">Success</Tag>
          <Tag tone="warning">Warning</Tag>
          <Tag tone="error">Error</Tag>
          <Kbd>⌘K</Kbd>
          <span className="row" style={{ gap: '0.375rem' }}>
            <Dot /> Live
          </span>
          <Delta value={2.41} />
          <Delta value={-1.3} />
          <Delta value={0} />
        </div>
      </Demo>
      <Demo title="Avatars">
        <div className="row wrap">
          <Avatar name="Ada Lovelace" size={40} />
          <Avatar name="Grace Hopper" size={32} />
          <Avatar name="Linus T" size={24} />
          <Avatar name="Square" square size={40} />
          <AvatarGroup names={['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Mary J']} />
        </div>
      </Demo>
    </Block>
  )
}

function Inputs() {
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [search, setSearch] = useState('')
  const [otp, setOtp] = useState('')
  const [slider, setSlider] = useState(40)
  const [files, setFiles] = useState<File[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  return (
    <Block id="inputs" title="Inputs" lead="One 2.5rem control height, a focus ring in the accent color, and inline validation.">
      <div className="demo-grid">
        <Demo title="Text field">
          <Field label="Email" hint="We never share it.">
            <Input type="email" icon={<Mail aria-hidden="true" />} value={text} onChange={(e) => setText(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="With an error" error="That email is already in use.">
            <Input defaultValue="taken@example.com" />
          </Field>
          <Field label="Disabled">
            <Input disabled defaultValue="Read only" />
          </Field>
        </Demo>
        <Demo title="Password and search">
          <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordStrength password={password} />
          <SearchInput value={search} onValueChange={setSearch} shortcut="/" placeholder="Search anything" aria-label="Search" />
        </Demo>
        <Demo title="Textarea, slider, code">
          <Field label="Message">
            <Textarea placeholder="Write something…" />
          </Field>
          <Slider label="Risk appetite" value={slider} onChange={setSlider} format={(v) => `${v} / 100`} ticks={['Calm', 'Balanced', 'Bold']} />
          <div className="stack-sm">
            <span className="field-label">One-time code</span>
            <OtpInput value={otp} onChange={setOtp} />
          </div>
        </Demo>
        <Demo title="Photo upload">
          <PhotoPicker value={photo} onChange={setPhoto} />
          <Dropzone value={files} onChange={setFiles} maxFiles={6} />
        </Demo>
      </div>
    </Block>
  )
}

function Selection() {
  const [country, setCountry] = useState<string | null>('tr')
  const [asset, setAsset] = useState<string | null>(null)
  const [checked, setChecked] = useState(true)
  const [plan, setPlan] = useState('plus')
  const [plan2, setPlan2] = useState('monthly')
  const [on, setOn] = useState(true)
  return (
    <Block id="selection" title="Selection" lead="Keyboard-first select with search, plus checkboxes, radios and switches.">
      <div className="demo-grid">
        <Demo title="Select">
          <Field label="Country">
            <Select
              value={country}
              onChange={setCountry}
              options={[
                { value: 'tr', label: 'Türkiye' },
                { value: 'us', label: 'United States' },
                { value: 'de', label: 'Germany' },
                { value: 'jp', label: 'Japan', description: 'Tokyo session' },
              ]}
            />
          </Field>
          <Field label="Asset (searchable)">
            <Select
              searchable
              value={asset}
              onChange={setAsset}
              placeholder="Choose an asset"
              options={ASSETS.map((a) => ({ value: a.symbol, label: `${a.symbol} · ${a.name}`, group: a.cls }))}
            />
          </Field>
        </Demo>
        <Demo title="Checkbox and switch">
          <Checkbox checked={checked} onChange={setChecked} label="Email me weekly summaries" description="One short email every Monday." />
          <Checkbox checked={false} onChange={() => undefined} label="Disabled" disabled />
          <Checkbox checked indeterminate onChange={() => undefined} label="Indeterminate" />
          <hr className="hr" />
          <Switch checked={on} onChange={setOn} label="Price alerts" description="Notify me about big moves." />
        </Demo>
        <Demo title="Radio group">
          <RadioGroup
            legend="Billing"
            value={plan2}
            onChange={setPlan2}
            options={[
              { value: 'monthly', label: 'Monthly', description: 'Cancel anytime' },
              { value: 'yearly', label: 'Yearly', description: 'Save 20%' },
            ]}
          />
        </Demo>
        <Demo title="Radio cards">
          <RadioGroup
            cards
            legend="Plan"
            value={plan}
            onChange={setPlan}
            options={[
              { value: 'starter', label: 'Starter', price: 'Free', description: 'One account' },
              { value: 'plus', label: 'Plus', price: '$7 / mo', description: 'Unlimited accounts' },
              { value: 'pro', label: 'Pro', price: '$15 / mo', description: 'API and tax reports' },
            ]}
          />
        </Demo>
      </div>
    </Block>
  )
}

function Dates() {
  const [single, setSingle] = useState<Date | null>(today())
  const [range, setRange] = useState<DateRange>({ from: addDays(today(), -6), to: today() })
  const [inline, setInline] = useState<DateRange>({ from: addDays(today(), -3), to: addDays(today(), 4) })
  const [picked, setPicked] = useState<Date | null>(null)
  const [ym, setYm] = useState<YearMonth | null>({ year: new Date().getFullYear(), month: new Date().getMonth() })
  const [time, setTime] = useState('09:30')
  return (
    <Block id="dates" title="Date & time" lead="Calendar, range, month and time pickers. Arrow keys move by day, PageUp/PageDown by month, and the title opens month and year views.">
      <div className="demo-grid">
        <Demo title="Calendar">
          <Calendar mode="single" value={single} onChange={setSingle} />
        </Demo>
        <Demo title="Month picker">
          <MonthPicker value={ym} onChange={setYm} />
        </Demo>
        <Demo title="Pickers (open in a popover)">
          <Field label="Date">
            <DatePicker value={picked} onChange={setPicked} clearable />
          </Field>
          <Field label="Date range with presets">
            <DateRangePicker value={range} onChange={setRange} />
          </Field>
          <Field label="Month">
            <MonthField value={ym} onChange={setYm} />
          </Field>
          <Field label="Time">
            <TimeField value={time} onChange={setTime} />
          </Field>
        </Demo>
        <Demo title="Inline range, two months" wide>
          <Calendar mode="range" months={2} value={inline} onChange={setInline} />
        </Demo>
      </div>
    </Block>
  )
}

function Overlays() {
  const toast = useToast()
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  return (
    <Block id="overlays" title="Overlays" lead="Built on Floating UI, so they flip, shift and trap focus properly.">
      <Demo title="Modal, drawer, toast">
        <div className="row wrap">
          <Button variant="ghost" onClick={() => setModal(true)}>
            Open modal
          </Button>
          <Button variant="ghost" onClick={() => setDrawer(true)}>
            Open drawer
          </Button>
          <Button variant="ghost" onClick={() => toast.push({ tone: 'success', title: 'Saved', description: 'Your changes are live.' })}>
            Success toast
          </Button>
          <Button variant="ghost" onClick={() => toast.push({ tone: 'error', title: 'Something went wrong' })}>
            Error toast
          </Button>
          <Button variant="ghost" onClick={() => toast.push({ title: 'Heads up', description: 'This is an info toast.' })}>
            Info toast
          </Button>
        </div>
      </Demo>
      <Demo title="Tooltip, popover, menu">
        <div className="row wrap">
          <Tooltip label="Copies the account number">
            <Button variant="ghost" icon aria-label="Copy">
              <Copy aria-hidden="true" />
            </Button>
          </Tooltip>
          <Popover
            trigger={
              <Button variant="ghost">
                <Bell aria-hidden="true" />
                Notifications
              </Button>
            }
          >
            <div className="stack-sm" style={{ padding: '1rem', width: '16rem' }}>
              <strong>Notifications</strong>
              <p className="small">You are all caught up. New alerts will appear here.</p>
            </div>
          </Popover>
          <Menu
            trigger={
              <Button variant="ghost">
                Actions
                <ChevronDown aria-hidden="true" />
              </Button>
            }
            entries={[
              { type: 'label', id: 'l', label: 'Account' },
              { id: 'profile', label: 'Profile', icon: <User aria-hidden="true" />, onSelect: () => toast.push({ title: 'Profile' }) },
              { id: 'new', label: 'New watchlist', icon: <Plus aria-hidden="true" />, onSelect: () => toast.push({ title: 'New watchlist' }) },
              { type: 'separator', id: 's' },
              { id: 'delete', label: 'Delete', icon: <Trash2 aria-hidden="true" />, danger: true, onSelect: () => toast.push({ tone: 'error', title: 'Deleted' }) },
            ]}
          />
        </div>
      </Demo>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Close this account?"
        description="This removes the account and its history from Finscope. Your bank is not affected."
        actions={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setModal(false)}>
              Close account
            </Button>
          </>
        }
      />
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters" footer={<Button onClick={() => setDrawer(false)}>Apply filters</Button>}>
        <div className="stack">
          <Field label="Keyword">
            <Input placeholder="e.g. groceries" />
          </Field>
          <Checkbox checked onChange={() => undefined} label="Include pending" />
        </div>
      </Drawer>
    </Block>
  )
}

function Feedback() {
  return (
    <Block id="feedback" title="Feedback" lead="Alerts, progress, loading and empty states use the status colors from your theme.">
      <div className="demo-grid">
        <Demo title="Alerts">
          <Alert tone="info" title="Heads up">Markets close early on Friday.</Alert>
          <Alert tone="success" title="Account linked">Your balances will appear in a minute.</Alert>
          <Alert tone="warning" title="Reconnect needed">Your bank asks you to renew consent.</Alert>
          <Alert tone="error" title="Payment failed">We could not charge the card ending 4242.</Alert>
        </Demo>
        <Demo title="Progress and loading">
          <div>
            <div className="row spread small">
              <span>Savings goal</span>
              <span className="mono">68%</span>
            </div>
            <Meter value={68} label="Savings goal" />
          </div>
          <div>
            <div className="row spread small">
              <span>Budget used</span>
              <span className="mono">92%</span>
            </div>
            <Meter value={92} tone="warning" label="Budget used" />
          </div>
          <div className="stack-sm">
            <Skeleton height="1.25rem" width="60%" />
            <Skeleton height="0.875rem" />
            <Skeleton height="0.875rem" width="80%" />
          </div>
        </Demo>
        <Demo title="Empty state">
          <EmptyState icon={<Inbox size={18} />} title="No transactions yet" action={<Button size="sm">Link an account</Button>}>
            Link a bank to see spending and income here.
          </EmptyState>
        </Demo>
      </div>
    </Block>
  )
}

function Navigation() {
  const [tab, setTab] = useState('overview')
  const [seg, setSeg] = useState('1M')
  const [page, setPage] = useState(3)
  return (
    <Block id="navigation" title="Navigation" lead="Tabs and segmented controls support the arrow keys; every item has a visible focus ring.">
      <div className="demo-grid">
        <Demo title="Tabs" wide>
          <Tabs
            ariaLabel="Demo tabs"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'overview', label: 'Overview' },
              { id: 'holdings', label: 'Holdings', count: 8 },
              { id: 'activity', label: 'Activity' },
            ]}
            panels={{
              overview: <p>Net worth and allocation live here.</p>,
              holdings: <p>Every position you own.</p>,
              activity: <p>Transactions from linked accounts.</p>,
            }}
          />
        </Demo>
        <Demo title="Segmented control">
          <div className="row wrap">
            <Segmented ariaLabel="Range" mono value={seg} onChange={setSeg} options={['1D', '1W', '1M', '1Y'].map((v) => ({ value: v, label: v }))} />
            <Segmented ariaLabel="View" value="a" onChange={() => undefined} options={[{ value: 'a', label: 'List' }, { value: 'b', label: 'Grid' }]} />
          </div>
        </Demo>
        <Demo title="Breadcrumbs">
          <Breadcrumbs items={[{ label: 'Markets', to: '/markets' }, { label: 'Stocks', to: '/markets?class=stock' }, { label: 'AAPL' }]} />
        </Demo>
        <Demo title="Pagination">
          <Pagination page={page} pageCount={12} onChange={setPage} />
        </Demo>
        <Demo title="Stepper">
          <Stepper steps={['Account', 'Profile', 'Plan']} current={1} />
        </Demo>
        <Demo title="Accordion" wide>
          <Accordion
            name="kit-acc"
            defaultOpen="a"
            items={[
              { id: 'a', title: 'Where do prices come from?', content: <p>Licensed exchange feeds, delayed on the free plan.</p> },
              { id: 'b', title: 'Can I cancel anytime?', content: <p>Yes, from Settings.</p> },
            ]}
          />
        </Demo>
      </div>
    </Block>
  )
}

interface Row {
  a: Asset
  change: number
  spark: number[]
}

function DataSection() {
  const fmt = useFormat()
  const rows: Row[] = useMemo(
    () => ['AAPL', 'MSFT', 'BTC', 'XAUUSD'].map((s) => assetBySymbol(s)!).map((a) => ({ a, change: assetStats(a).change1d, spark: assetStats(a).spark })),
    [],
  )
  const columns: Column<Row>[] = [
    { key: 's', header: 'Symbol', sortValue: (r) => r.a.symbol, render: (r) => r.a.symbol },
    { key: 'p', header: 'Price', sortValue: (r) => r.a.price, render: (r) => fmt.money(r.a.price, r.a.price > 1000 ? 0 : 2) },
    { key: 'c', header: 'Change', sortValue: (r) => r.change, render: (r) => <Delta value={r.change} /> },
    { key: 't', header: '30D', render: (r) => <Sparkline data={r.spark} /> },
  ]
  return (
    <Block id="data" title="Data" lead="Sortable tables, boards, metric grids and code blocks.">
      <Demo title="Sortable data table (click a header)" wide>
        <DataTable caption="Demo table" columns={columns} rows={rows} rowKey={(r) => r.a.symbol} initialSort={{ key: 'c', dir: 'desc' }} />
      </Demo>
      <div className="demo-grid">
        <Demo title="Metric grid">
          <div className="lattice" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="kpi">
              <span className="kpi-label">Net worth</span>
              <span className="kpi-value">{fmt.money(128430, 0)}</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Today</span>
              <span className="kpi-value">
                <Delta value={2.41} />
              </span>
            </div>
          </div>
        </Demo>
        <Demo title="Code block">
          <Terminal head="Install" rows={[{ label: 'npm', code: 'npm install @finscope/client', shell: true }, { label: 'Use', code: 'const holdings = await client.holdings.list()' }]} />
        </Demo>
      </div>
    </Block>
  )
}

function Charts() {
  const fmt = useFormat()
  const series = useMemo(() => portfolioSeries(180), [])
  const flow = useMemo(() => cashFlow(12), [])
  const slices = useMemo(() => allocation(), [])
  const candles = useMemo(() => ohlc(assetBySymbol('AAPL')!, 60), [])
  const pnl = useMemo(() => dailyPnl(365), [])
  return (
    <Block id="charts" title="Charts" lead="Hand-built SVG, so every color comes from your theme and nothing is blocked by a spinner.">
      <div className="demo-grid">
        <Demo title="Area / line (hover or use ← →)" wide>
          <AreaChart
            ariaLabel="Portfolio compared with the benchmark"
            height={280}
            formatY={(n) => fmt.moneyCompact(n)}
            formatX={(d) => fmt.date(d, 'day')}
            formatTip={(d) => fmt.date(d, 'short')}
            series={[
              { id: 'p', label: 'Portfolio', data: series.portfolio, area: true },
              { id: 'b', label: 'S&P 500', data: series.benchmark, dashed: true, color: 'var(--muted)' },
            ]}
          />
        </Demo>
        <Demo title="Bars">
          <BarChart
            ariaLabel="Income and spending by month"
            data={flow}
            series={[{ key: 'income', label: 'Income' }, { key: 'spend', label: 'Spending' }]}
            formatY={(n) => fmt.moneyCompact(n)}
            height={240}
          />
        </Demo>
        <Demo title="Donut">
          <DonutChart ariaLabel="Allocation" slices={slices} centerLabel="Total" centerValue={fmt.moneyCompact(slices.reduce((s, x) => s + x.value, 0))} formatValue={(n) => fmt.money(n, 0)} size={150} />
        </Demo>
        <Demo title="Candlestick with volume" wide>
          <CandlestickChart ariaLabel="AAPL daily candles" data={candles} height={320} formatY={(n) => fmt.num(n, 2)} formatX={(d) => fmt.date(d, 'day')} formatVolume={(n) => fmt.compact(n)} />
        </Demo>
        <Demo title="Daily gain and loss heatmap" wide>
          <Heatmap ariaLabel="Daily gains and losses" data={pnl} from={addDays(today(), -364)} to={today()} formatValue={(n) => fmt.moneySigned(n, 0)} />
        </Demo>
        <Demo title="Sparklines">
          <div className="row wrap">
            {['NVDA', 'TSLA', 'BTC', 'XAUUSD'].map((s) => (
              <div key={s} className="stack-sm">
                <span className="mono small">{s}</span>
                <Sparkline data={assetStats(assetBySymbol(s)!).spark} width={96} height={32} />
              </div>
            ))}
          </div>
        </Demo>
      </div>
    </Block>
  )
}

const PHOTOS = [
  { src: asset('images/gallery-1.svg'), alt: 'Blue and violet light', caption: 'Morning light' },
  { src: asset('images/gallery-2.svg'), alt: 'Warm orange gradient', caption: 'Ledger lines' },
  { src: asset('images/gallery-3.svg'), alt: 'Green and teal waves', caption: 'Harbor' },
  { src: asset('images/gallery-4.svg'), alt: 'Purple and pink dusk', caption: 'Dusk' },
  { src: asset('images/gallery-5.svg'), alt: 'Cyan and indigo glow', caption: 'Grid' },
  { src: asset('images/gallery-6.svg'), alt: 'Yellow and lime haze', caption: 'Orbit' },
]

function Media() {
  return (
    <Block id="media" title="Media" lead="The padded, rounded frame ascope.app uses for screenshots, plus a gallery with a keyboard-friendly lightbox. Swap the SVGs for real photos.">
      <Demo title="Photo frame" wide>
        <Shot src={asset('images/dashboard-light.svg')} alt="Dashboard screenshot" caption="Any image works. Add onOpen to make it clickable." />
      </Demo>
      <Demo title="Gallery and lightbox" wide>
        <Gallery items={PHOTOS} />
      </Demo>
    </Block>
  )
}

export default function Components() {
  usePageTitle('Components')
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Design system</span>
          <h1>
            Every <span className="gradient">component</span>, in one place
          </h1>
          <p className="lead">
            Buttons, forms, calendars, charts and overlays, styled with the same type, spacing and elevation as ascope.app. Change the theme and this page updates too.
          </p>
        </div>
      </section>
      <section className="section dash-section">
        <div className="container">
          <div className="kit">
            <nav className="kit-nav" aria-label="Component groups">
              <ul>
                {SECTIONS.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`}>{label}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="kit-main">
              <Buttons />
              <Inputs />
              <Selection />
              <Dates />
              <Overlays />
              <Feedback />
              <Navigation />
              <DataSection />
              <Charts />
              <Media />
              <Card className="row spread wrap">
                <span className="row">
                  <Search size={16} aria-hidden="true" />
                  <span>Missing something? Add it to <code>src/components</code> and list it here.</span>
                </span>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
