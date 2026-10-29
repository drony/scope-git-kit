import { useMemo, useRef, useState } from 'react'
import { Download, Sparkles } from 'lucide-react'
import { useSite } from '@/kit/context/ConfigContext'
import { useToast } from '@/kit/context/ToastContext'
import { useFormat } from '@/kit/lib/format'
import { useLang, useText } from '@/kit/lib/i18n'
import { useEditStore } from '@/kit/hooks/useEditStore'
import { today } from '@/kit/lib/date'
import {
  CASH_ROWS,
  cashAmount,
  cashBudget,
  cashNote,
  monthKey,
  type CashRowDef,
} from '@/demo/seed/finance'
import { Button } from '@/kit/components/ui/Button'
import { DataGrid } from '@/kit/components/grid/DataGrid'
import { Signed } from '@/kit/components/grid/Signed'
import { TryList, type TryTask } from '@/kit/components/grid/TryList'
import { useTryList } from '@/kit/hooks/useTryList'
import type { CellChange, DataGridHandle, FilterDef, GridColumn, GridEvent, GroupOption } from '@/kit/components/grid/types'
import { MonthField, type YearMonth } from '@/kit/components/calendar/MonthPicker'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { TableHead } from './TableHead'

const STORAGE = 'finscope.table.cashflow'
const TRY_STORAGE = 'finscope.try.cashflow'

/** Which grid events tick off which step of the "Try it" list. */
const EVENT_TASKS: Partial<Record<GridEvent, string>> = {
  edit: 'edit',
  undo: 'undo',
  range: 'range',
  sort: 'sortfilter',
  filter: 'sortfilter',
  group: 'group',
  collapse: 'group',
  expand: 'expand',
  columns: 'columns',
}

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
    tips: 'Try it',
    tryTitle: 'Try the features',
    tryDone: 'You have tried everything. Your edits are saved automatically in this browser.',
    hide: 'Hide',
    tEdit: 'Edit a number',
    tEditHint: 'Double-click a cell, or press Enter. Type a new amount and press Enter.',
    tEditDo: 'Do it for me',
    tUndo: 'Undo it',
    tUndoHint: 'Press ⌘Z, or use the Undo button in the message that appears.',
    tUndoDo: 'Undo',
    tRange: 'Select a range',
    tRangeHint: 'Click a cell, then hold Shift and press the arrow keys. The sum shows at the bottom.',
    tSort: 'Sort or filter',
    tSortHint: 'Click a column title, or open Filter.',
    tGroup: 'Collapse a group',
    tGroupHint: 'Click the arrow next to EXPENSES.',
    tExpand: 'Open a row',
    tExpandHint: 'Click the arrow next to a category for its trend.',
    tMonth: 'Change the month',
    tMonthHint: 'Use the month picker at the top right.',
    tColumns: 'Show the Note column',
    tColumnsHint: 'Open Columns and tick Note.',
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
    tips: 'Dene',
    tryTitle: 'Özellikleri dene',
    tryDone: 'Hepsini denedin. Düzenlemelerin bu tarayıcıda otomatik kaydediliyor.',
    hide: 'Gizle',
    tEdit: 'Bir sayıyı düzenle',
    tEditHint: 'Hücreye çift tıkla ya da Enter’a bas. Yeni tutarı yaz, Enter’a bas.',
    tEditDo: 'Benim yerime yap',
    tUndo: 'Geri al',
    tUndoHint: '⌘Z’ye bas ya da çıkan mesajdaki Geri al düğmesini kullan.',
    tUndoDo: 'Geri al',
    tRange: 'Aralık seç',
    tRangeHint: 'Bir hücreye tıkla, sonra Shift tuşuna basılı tutup ok tuşlarına bas. Toplam en altta görünür.',
    tSort: 'Sırala ya da filtrele',
    tSortHint: 'Bir sütun başlığına tıkla ya da Filtrele’yi aç.',
    tGroup: 'Bir grubu daralt',
    tGroupHint: 'GİDERLER yanındaki oka tıkla.',
    tExpand: 'Bir satırı aç',
    tExpandHint: 'Eğilimi görmek için bir kategorinin yanındaki oka tıkla.',
    tMonth: 'Ayı değiştir',
    tMonthHint: 'Sağ üstteki ay seçiciyi kullan.',
    tColumns: 'Açıklama sütununu göster',
    tColumnsHint: 'Sütunlar’ı aç ve Açıklama’yı işaretle.',
  },
}

export function CashFlowTable() {
  const t = useText(TEXT)
  const lang = useLang()
  const fmt = useFormat()
  const { currency } = useSite()
  const toast = useToast()
  const gridApi = useRef<DataGridHandle | null>(null)

  const tryout = useTryList(TRY_STORAGE, EVENT_TASKS)
  const [focus, setFocusState] = useState<YearMonth>(() => ({ year: today().getFullYear(), month: today().getMonth() }))
  const setFocus = (next: YearMonth) => {
    setFocusState(next)
    tryout.mark('month')
  }
  const { edits, history, apply, saveProps } = useEditStore(STORAGE)

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

  const onEdit = (changes: CellChange[]) => apply(changes, (id) => (id.startsWith('m:') ? id.slice(2) : id))

  const payroll = CASH_ROWS[0]
  const tasks: TryTask[] = [
    {
      id: 'edit',
      title: t.tEdit,
      hint: t.tEditHint,
      action: {
        label: t.tEditDo,
        run: () =>
          gridApi.current?.edit([
            { rowId: payroll.id, colId: `m:${monthKey(focus.year, focus.month)}`, value: cashAmount(payroll, edits, focus.year, focus.month) - 25_000 },
          ]),
      },
    },
    {
      id: 'undo',
      title: t.tUndo,
      hint: t.tUndoHint,
      action: {
        label: t.tUndoDo,
        run: () => {
          if (!history.canUndo) return
          history.undo()
          tryout.mark('undo')
        },
      },
    },
    { id: 'range', title: t.tRange, hint: t.tRangeHint },
    { id: 'sortfilter', title: t.tSort, hint: t.tSortHint },
    { id: 'group', title: t.tGroup, hint: t.tGroupHint },
    { id: 'expand', title: t.tExpand, hint: t.tExpandHint },
    { id: 'month', title: t.tMonth, hint: t.tMonthHint },
    { id: 'columns', title: t.tColumns, hint: t.tColumnsHint },
  ]

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
            <Button variant="ghost" aria-expanded={tryout.open} onClick={() => tryout.setOpen(!tryout.open)}>
              <Sparkles aria-hidden="true" />
              {t.tips}
              <span className="g-badge">
                {tryout.done.size}/{tasks.length}
              </span>
            </Button>
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
      {tryout.open && (
        <TryList heading={t.tryTitle} tasks={tasks} done={tryout.done} allDoneText={t.tryDone} closeLabel={t.hide} onClose={() => tryout.setOpen(false)} />
      )}
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
        save={saveProps(() => toast.push({ tone: 'success', title: t.saved, description: t.savedHint }))}
        apiRef={gridApi}
        onInteraction={tryout.onInteraction}
      />
      <p className="grid-hint">{t.keys}</p>
    </div>
  )
}
