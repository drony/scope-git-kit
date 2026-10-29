import { prop, type ComponentDoc } from './define.ts'

const a11y = prop('ariaLabel', 'string', 'Describes the chart for screen readers.', { required: true })
const height = (d: number) => prop('height', 'number', 'Height in px.', { default: String(d) })

export const chartDocs: ComponentDoc[] = [
  {
    id: 'area-chart',
    name: 'AreaChart',
    group: 'charts',
    summary: 'A line chart with optional filled area, several series, a crosshair and a tooltip. Plain SVG, sized to its container.',
    source: 'kit/components/charts/AreaChart.tsx',
    props: [
      prop('series', '{ id; label; data: { x: Date; y: number }[]; color?; area?; dashed? }[]', 'Lines to draw. All series share the first one’s x values.', { required: true }),
      height(280),
      prop('formatY', '(n: number) => string', 'Y axis and tooltip number format.'),
      prop('formatX', '(d: Date) => string', 'X axis label format.'),
      prop('formatTip', '(d: Date) => string', 'Tooltip title format.'),
      prop('smooth', 'boolean', 'Monotone curve instead of straight segments.', { default: 'true' }),
      prop('onHover', '() => void', 'Called when the reader hovers the chart or steps through it with the arrow keys.'),
      a11y,
    ],
    example: `<AreaChart ariaLabel="Portfolio value" series={[{ id: 'p', label: 'Portfolio', data, area: true }]} formatY={(n) => fmt.moneyCompact(n)} />`,
    notes: ['Hover, or focus the chart and use ← →, to read any point; Esc hides the readout.', 'Colors come from `--chart-1…5`; pass any CSS color per series to override.'],
  },
  {
    id: 'bar-chart',
    name: 'BarChart',
    group: 'charts',
    summary: 'Grouped bars with a legend and a hover band.',
    source: 'kit/components/charts/BarChart.tsx',
    props: [
      prop('data', '{ label: string; values: Record<string, number> }[]', 'One entry per group on the x axis.', { required: true }),
      prop('series', '{ key: string; label: string; color?: string }[]', 'The bars in each group; `key` reads from `values`.', { required: true }),
      height(260),
      prop('formatY', '(n: number) => string', 'Axis and tooltip format.'),
      a11y,
    ],
    example: `<BarChart ariaLabel="Income and spending" data={months} series={[{ key: 'income', label: 'Income' }, { key: 'spend', label: 'Spending' }]} />`,
  },
  {
    id: 'donut-chart',
    name: 'DonutChart',
    group: 'charts',
    summary: 'A donut with a hover-linked legend and a center readout.',
    source: 'kit/components/charts/DonutChart.tsx',
    props: [
      prop('slices', '{ id: string; label: string; value: number; color?: string }[]', 'The parts of the whole.', { required: true }),
      prop('size', 'number', 'Diameter in px.', { default: '176' }),
      prop('thickness', 'number', 'Ring width in px.', { default: '16' }),
      prop('centerLabel', 'ReactNode', 'Small text in the middle.'),
      prop('centerValue', 'ReactNode', 'Big text in the middle. Hovering a slice shows its label and value instead.'),
      prop('formatValue', '(n: number) => string', 'Value format in the legend.'),
      prop('activeId', 'string | null', 'Highlighted slice. Leave out to let the chart manage hovering itself; pass it with `onActiveChange` to link the donut to other UI.'),
      prop('onActiveChange', '(id: string | null) => void', 'Called with the slice id under the pointer, or null when it leaves.'),
      a11y,
    ],
    example: `<DonutChart ariaLabel="Allocation" slices={slices} centerLabel="Total" centerValue="$152k" formatValue={(n) => fmt.money(n, 0)} />

// linked to a table: hovering a slice highlights its rows, hovering a row highlights its slice
const [linked, setLinked] = useState<string | null>(null)
<DonutChart activeId={linked} onActiveChange={setLinked} … />`,
  },
  {
    id: 'candlestick-chart',
    name: 'CandlestickChart',
    group: 'charts',
    summary: 'OHLC candles with a volume strip and a readout.',
    source: 'kit/components/charts/CandlestickChart.tsx',
    props: [
      prop('data', '{ x: Date; o; h; l; c; v }[]', 'Open, high, low, close and volume per period.', { required: true }),
      height(380),
      prop('formatY', '(n: number) => string', 'Price format.'),
      prop('formatX', '(d: Date) => string', 'Date format.'),
      prop('formatVolume', '(n: number) => string', 'Volume format.'),
      a11y,
    ],
    example: `<CandlestickChart ariaLabel="AAPL daily candles" data={candles} formatVolume={(n) => fmt.compact(n)} />`,
    notes: ['Up candles use `--success`, down candles `--error`.'],
  },
  {
    id: 'heatmap',
    name: 'Heatmap',
    group: 'charts',
    summary: 'A calendar heatmap of daily gains (green) and losses (red).',
    source: 'kit/components/charts/Heatmap.tsx',
    props: [
      prop('data', 'Record<string, number>', 'Daily values keyed by YYYY-MM-DD.', { required: true }),
      prop('from', 'Date', 'First day shown.', { required: true }),
      prop('to', 'Date', 'Last day shown.', { required: true }),
      prop('formatValue', '(n: number) => string', 'Tooltip value format.', { required: true }),
      a11y,
    ],
    example: `<Heatmap ariaLabel="Daily gains and losses" data={pnl} from={start} to={end} formatValue={(n) => fmt.moneySigned(n, 0)} />`,
    notes: ['Starts scrolled to the most recent weeks. The week starts on the day set in the theme config.'],
  },
  {
    id: 'sparkline',
    name: 'Sparkline',
    group: 'charts',
    summary: 'A tiny trend line for tables and cards. Decorative: pair it with a text value.',
    source: 'kit/components/charts/Sparkline.tsx',
    props: [
      prop('data', 'number[]', 'Values, oldest first. Needs at least two.', { required: true }),
      prop('width', 'number', 'Width in px.', { default: '88' }),
      prop('height', 'number', 'Height in px.', { default: '28' }),
      prop('color', 'string', 'Line color. Green when the series ends higher than it began, red otherwise.'),
      prop('fill', 'boolean', 'Soft fill under the line.', { default: 'true' }),
    ],
    example: `<Sparkline data={prices.slice(-30)} />`,
  },
]
