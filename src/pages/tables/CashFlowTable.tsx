import { useMemo, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { useSite } from '@/context/ConfigContext'
import { useToast } from '@/context/ToastContext'
import { useFormat } from '@/lib/format'
import { useLang, useText } from '@/lib/i18n'
import { useHistory } from '@/lib/useHistory'
import { today } from '@/lib/date'
import {
  CASH_ROWS,
  cashAmount,
  cashBudget,
  cashNote,
  editKey,
  loadEdits,
  monthKey,
  sameEdits,
  saveEdits,
  type CashRowDef,
  type Edits,
} from '@/lib/finance'
import { Button } from '@/components/ui/Button'
import { DataGrid } from '@/components/grid/DataGrid'
import { Signed } from '@/components/grid/Signed'
import type { CellChange, DataGridHandle, FilterDef, GridColumn, GroupOption } from '@/components/grid/types'
import { MonthField, type YearMonth } from '@/components/calendar/MonthPicker'
import { Sparkline } from '@/components/charts/Sparkline'
import { TableHead } from './TableHead'

const STORAGE = 'finscope.table.cashflow'

const TEXT = {
  en: {
    workspace: 'Workspace',
    finance: 'Finance',
    title: 'Cash flow table',
    lead: 'Edit line items and adjust the view to the way you work.',
    export: 'Export',
    month: 'Month',
    grid: 'Cash flow',
    category: 'Category',
    budget: 'Budget',
    variance: 'Variance',
    note: 'Note',
    net: 'Net cash flow',
    type: 'Type',
    expense: 'Expense',
    income: 'Income',
    varianceFilter: 'Variance',
    adverse: 'Adverse (worse than budget)',
    favourable: 'Favourable (better than budget)',
    byType: 'By type',
    expenses: 'Expenses',
    incomes: 'Income',
    trend: '6-month trend',
    average: 'Average',
    low: 'Lowest',
    high: 'Highest',
    saved: 'Saved',
    savedHint: 'Your edits are stored in this browser.',
    keys: 'Enter or double-click to edit · arrows to move · Shift to select a range · paste from a spreadsheet · ⌘Z to undo',
  },
  tr: {
    workspace: 'Çalışma alanı',
    finance: 'Finans',
    title: 'Nakit akışı tablosu',
    lead: 'Kalemleri düzenleyin, görünümü ihtiyaçlarınıza göre ayarlayın.',
    export: 'Dışa aktar',
    month: 'Ay',
    grid: 'Nakit akışı',
    category: 'Kategori',
    budget: 'Bütçe',
    variance: 'Fark',
    note: 'Açıklama',
    net: 'Net nakit akışı',
    type: 'Tür',
    expense: 'Gider',
    income: 'Gelir',
    varianceFilter: 'Fark',
    adverse: 'Olumsuz (bütçeden kötü)',
    favourable: 'Olumlu (bütçeden iyi)',
    byType: 'Türe göre',
    expenses: 'Giderler',
    incomes: 'Gelirler',
    trend: '6 aylık eğilim',
    average: 'Ortalama',
    low: 'En düşük',
    high: 'En yüksek',
    saved: 'Kaydedildi',
    savedHint: 'Düzenlemeleriniz bu tarayıcıda saklanır.',
    keys: 'Düzenlemek için Enter veya çift tık · oklarla gezin · aralık için Shift · e-tablodan yapıştırın · geri almak için ⌘Z',
  },
}

export function CashFlowTable() {
  const t = useText(TEXT)
  const lang = useLang()
  const fmt = useFormat()
  const { currency } = useSite()
  const toast = useToast()
  const gridApi = useRef<DataGridHandle | null>(null)

  const [focus, setFocus] = useState<YearMonth>(() => ({ year: today().getFullYear(), month: today().getMonth() }))
  const history = useHistory<Edits>(() => loadEdits(STORAGE))
  const [saved, setSaved] = useState<Edits>(history.value)
  const edits = history.value
  const dirty = !sameEdits(edits, saved)

  /** The four months shown: the chosen month and the three before it. */
  const months = useMemo(
    () =>
      [3, 2, 1, 0].map((back) => {
        const d = new Date(focus.year, focus.month - back, 1)
        return { year: d.getFullYear(), month: d.getMonth() }
      }),
    [focus],
  )

  const varianceOf = (row: CashRowDef) => cashAmount(row, edits, focus.year, focus.month) - cashBudget(row, edits)
  const money = (n: number) => fmt.money(n, 0)
  const signed = (n: number) => <Signed value={n}>{fmt.moneySigned(n, 0)}</Signed>

  const columns = useMemo<GridColumn<CashRowDef>[]>(
    () => [
      { id: 'label', header: t.category, value: (r) => r.label[lang], locked: true },
      ...months.map<GridColumn<CashRowDef>>((mo, i) => ({
        id: `m:${monthKey(mo.year, mo.month)}`,
        header: mo.year === focus.year ? fmt.monthName(mo.month) : `${fmt.monthName(mo.month, 'short')} ${mo.year}`,
        value: (r) => cashAmount(r, edits, mo.year, mo.month),
        format: money,
        editable: true,
        focus: i === months.length - 1,
        summary: 'sum',
        minWidth: 128,
      })),
      { id: 'budget', header: t.budget, value: (r) => cashBudget(r, edits), format: money, editable: true, summary: 'sum', minWidth: 128 },
      {
        id: 'variance',
        header: t.variance,
        value: (r) => cashAmount(r, edits, focus.year, focus.month) - cashBudget(r, edits),
        format: signed,
        summary: 'sum',
        minWidth: 120,
      },
      { id: 'note', header: t.note, value: (r) => cashNote(r, edits, lang), editable: true, hidden: true, minWidth: 220 },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [months, edits, lang, t, fmt, focus],
  )

  const groups = useMemo<GroupOption<CashRowDef>[]>(
    () => [{ id: 'type', label: t.byType, key: (r) => r.type, title: (k) => (k === 'expense' ? t.expenses : t.incomes), order: ['expense', 'income'] }],
    [t],
  )

  const filters = useMemo<FilterDef<CashRowDef>[]>(
    () => [
      {
        id: 'type',
        label: t.type,
        options: [
          { value: 'expense', label: t.expense },
          { value: 'income', label: t.income },
        ],
        test: (r, v) => r.type === v,
      },
      {
        id: 'variance',
        label: t.varianceFilter,
        options: [
          { value: 'adverse', label: t.adverse },
          { value: 'favourable', label: t.favourable },
        ],
        test: (r, v) => (v === 'adverse' ? varianceOf(r) < 0 : varianceOf(r) > 0),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, edits, focus],
  )

  const onEdit = (changes: CellChange[]) =>
    history.set((prev) => {
      const next = { ...prev }
      for (const c of changes) next[editKey(c.rowId, c.colId.startsWith('m:') ? c.colId.slice(2) : c.colId)] = c.value
      return next
    })

  const onSave = () => {
    saveEdits(STORAGE, edits)
    setSaved(edits)
    toast.push({ tone: 'success', title: t.saved, description: t.savedHint })
  }

  const detail = (row: CashRowDef) => {
    const series = [5, 4, 3, 2, 1, 0].map((back) => {
      const d = new Date(focus.year, focus.month - back, 1)
      return cashAmount(row, edits, d.getFullYear(), d.getMonth())
    })
    const avg = series.reduce((s, v) => s + v, 0) / series.length
    return (
      <>
        <div className="g-spark">
          <span className="eyebrow">{t.trend}</span>
          <Sparkline data={series} width={260} height={52} color="var(--accent)" />
        </div>
        <dl>
          <div>
            <dt>{t.average}</dt>
            <dd>{money(avg)}</dd>
          </div>
          <div>
            <dt>{t.low}</dt>
            <dd>{money(Math.min(...series))}</dd>
          </div>
          <div>
            <dt>{t.high}</dt>
            <dd>{money(Math.max(...series))}</dd>
          </div>
          <div>
            <dt>{t.budget}</dt>
            <dd>{money(cashBudget(row, edits))}</dd>
          </div>
        </dl>
      </>
    )
  }

  return (
    <div className="stack-lg">
      <TableHead
        crumbs={[{ label: t.workspace, to: '/dashboard' }, { label: t.finance }]}
        title={t.title}
        lead={t.lead}
        actions={
          <>
            <div style={{ width: '11.5rem' }}>
              <MonthField ariaLabel={t.month} value={focus} onChange={setFocus} min={new Date(2024, 0, 1)} max={new Date(2028, 11, 31)} />
            </div>
            <Button variant="ghost" onClick={() => gridApi.current?.exportCsv()}>
              <Download aria-hidden="true" />
              {t.export}
            </Button>
          </>
        }
      />
      <DataGrid<CashRowDef>
        title={t.grid}
        unit={currency}
        storageKey="cashflow"
        columns={columns}
        rows={CASH_ROWS}
        rowId={(r) => r.id}
        searchText={(r) => `${r.label.en} ${r.label.tr}`}
        groups={groups}
        defaultGroup="type"
        filters={filters}
        detail={detail}
        totalLabel={t.net}
        onEdit={onEdit}
        history={history}
        save={{ dirty, onSave }}
        apiRef={gridApi}
      />
      <p className="grid-hint">{t.keys}</p>
    </div>
  )
}
