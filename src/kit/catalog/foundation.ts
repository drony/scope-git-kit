import { prop, type ComponentDoc } from './define.ts'

export const foundationDocs: ComponentDoc[] = [
  {
    id: 'config-provider',
    name: 'ConfigProvider',
    group: 'foundation',
    kind: 'component',
    summary: 'Holds the live theme and site configuration, applies it as CSS variables, and exposes it through hooks. Wrap your app in it once.',
    source: 'kit/context/ConfigContext.tsx',
    exports: ['ConfigProvider', 'useConfig', 'useSite'],
    props: [
      prop('saved', 'AppConfig', 'The configuration the project ships with. Build it with `mergeConfig(json)` so missing values fall back to defaults.', { required: true }),
      prop('saveEndpoint', 'string', 'Dev-only URL that persists the configuration to disk.', { default: "'/__config/save'" }),
      prop('children', 'ReactNode', 'Your app.', { required: true }),
    ],
    example: `const SAVED_CONFIG = mergeConfig(rawJson)
bootstrapTheme(SAVED_CONFIG)   // before first render: no flash of default colors
<ConfigProvider saved={SAVED_CONFIG}><App /></ConfigProvider>

const { config, setConfig, dirty } = useConfig()
const { locale, currency } = useSite()`,
    notes: ['The configuration shape is in `kit/theme/schema.ts`. See docs/theming.md for every setting.', 'Unsaved edits are kept in this browser as a draft; `dirty` is true while the live config differs from `saved`.'],
  },
  {
    id: 'toast-provider',
    name: 'ToastProvider',
    group: 'foundation',
    kind: 'component',
    summary: 'Transient messages in the bottom-right corner. `useToast().push(...)` shows one; it can carry a button such as Undo.',
    source: 'kit/context/ToastContext.tsx',
    exports: ['ToastProvider', 'useToast'],
    props: [
      prop('title', 'string', 'push: bold first line.', { required: true }),
      prop('description', 'ReactNode', 'push: smaller text.'),
      prop('tone', "'info' | 'success' | 'error'", 'push: icon and color.', { default: "'info'" }),
      prop('duration', 'number', 'push: milliseconds before it disappears; 0 keeps it until dismissed.', { default: '4500' }),
      prop('key', 'string', 'push: a new toast with the same key replaces the old one, so repeated actions do not stack up.'),
      prop('action', '{ label: string; onClick: () => void }', 'push: a button inside the toast. The toast closes after it is clicked.'),
    ],
    example: `const toast = useToast()
toast.push({ tone: 'success', title: 'Saved', key: 'save', action: { label: 'Undo', onClick: undo } })`,
    notes: ['At most four toasts show at once. The region is `aria-live="polite"`.'],
  },
  {
    id: 'use-history',
    name: 'useHistory',
    group: 'foundation',
    kind: 'hook',
    summary: 'State with undo and redo. Every `set` that changes the value is one undo step (100 are kept).',
    source: 'kit/hooks/useHistory.ts',
    props: [prop('initial', 'T | (() => T)', 'Starting value, or a function that creates it.', { required: true })],
    example: `const { value, set, undo, redo, canUndo, canRedo, reset } = useHistory({ name: '' })
set((prev) => ({ ...prev, name: 'Ada' }))`,
    notes: ['Returns `value`, `set`, `undo`, `redo`, `reset(value)`, `canUndo` and `canRedo`. `undo` and `redo` are stable references.'],
  },
  {
    id: 'use-autosave',
    name: 'useAutosave',
    group: 'foundation',
    kind: 'hook',
    summary: 'Debounced autosave with a visible status and an on/off preference remembered in this browser.',
    source: 'kit/hooks/useAutosave.ts',
    props: [
      prop('value', 'T', 'The current value; saving is rescheduled whenever it changes.', { required: true }),
      prop('dirty', 'boolean', 'True when the value differs from what was last saved.', { required: true }),
      prop('save', '() => void', 'Persists the value.', { required: true }),
      prop('storageKey', 'string', 'The on/off choice is stored under `<storageKey>.autosave`.', { required: true }),
      prop('delay', 'number', 'Milliseconds to wait after the last change.', { default: '900' }),
    ],
    example: `const { status, savedAt, enabled, setEnabled, saveNow } = useAutosave({ value: edits, dirty, save: persist, storageKey: 'budget' })`,
    notes: ['`status` is "saving" while a change waits, "saved" afterwards, and "unsaved" when autosave is switched off.'],
  },
  {
    id: 'use-edit-store',
    name: 'useEditStore',
    group: 'foundation',
    kind: 'hook',
    summary: 'Everything an editable table needs besides its rows: edits loaded from this browser, undo and redo, autosave, and props for DataGrid.',
    source: 'kit/hooks/useEditStore.ts',
    props: [prop('storageKey', 'string', 'Where edits and the autosave preference are stored.', { required: true })],
    example: `const { edits, history, apply, saveProps } = useEditStore('budget')
const value = edits[editKey(row.id, 'jan')] ?? row.jan
<DataGrid onEdit={apply} history={history} save={saveProps()} … />`,
    notes: [
      'Edits are a flat map `{ "rowId|column": value }` (see `kit/lib/edits.ts`); the source rows are never mutated.',
      '`apply(changes, columnPart?)` records a batch as one undo step; `columnPart` maps a column id to the key part.',
    ],
  },
  {
    id: 'use-try-list',
    name: 'useTryList',
    group: 'foundation',
    kind: 'hook',
    summary: 'State for a “Try it” checklist: which steps are done, and whether the card is shown (remembered in this browser).',
    source: 'kit/hooks/useTryList.ts',
    props: [
      prop('storageKey', 'string', 'Where the shown/hidden choice is stored.', { required: true }),
      prop('eventToTask', 'Partial<Record<GridEvent, string>>', 'Maps what DataGrid reports (edit, sort …) to the step it completes. Define it outside the component.', { required: true }),
    ],
    example: `const tryout = useTryList('my-try', { edit: 'edit', sort: 'sort' })
<DataGrid onInteraction={tryout.onInteraction} … />   // tryout.mark('month') ticks a custom step`,
  },
  {
    id: 'use-copy',
    name: 'useCopy',
    group: 'foundation',
    kind: 'hook',
    summary: 'Copies text to the clipboard (with a fallback) and reports a temporary “copied” state.',
    source: 'kit/hooks/useCopy.ts',
    props: [prop('reset', 'number', 'Milliseconds `copied` stays true.', { default: '1600' })],
    example: `const { copied, copy } = useCopy()
<button onClick={() => copy(url)}>{copied ? 'Copied' : 'Copy link'}</button>`,
  },
  {
    id: 'use-media',
    name: 'useMedia',
    group: 'foundation',
    kind: 'hook',
    summary: 'Tracks a CSS media query.',
    source: 'kit/hooks/useMedia.ts',
    props: [prop('query', 'string', 'A media query such as `(max-width: 720px)`.', { required: true })],
    example: `const compact = useMedia('(max-width: 760px)')`,
  },
  {
    id: 'use-page-title',
    name: 'usePageTitle',
    group: 'foundation',
    kind: 'hook',
    summary: 'Sets the document title to “Page · Site name”, or “Site name: tagline” without a title.',
    source: 'kit/hooks/usePageTitle.ts',
    props: [prop('title', 'string', 'The page name.')],
    example: `usePageTitle('Dashboard')`,
  },
  {
    id: 'use-format',
    name: 'useFormat',
    group: 'foundation',
    kind: 'hook',
    summary: 'Number, money, percent and date formatting that follows the locale and currency in the theme config.',
    source: 'kit/lib/format.ts',
    exports: ['useFormat'],
    props: [prop('locale', 'string', 'makeFormatters: BCP 47 locale such as `tr-TR`.'), prop('currency', 'string', 'makeFormatters: ISO 4217 code such as `TRY`.')],
    example: `const fmt = useFormat()
fmt.money(12480.5)        // $12,480.50  (₺12.480,50 with tr-TR / TRY)
fmt.moneySigned(-45, 0)   // -$45
fmt.pct(2.4)              // +2.40%
fmt.date(new Date(), 'monthYear')`,
    notes: ['Returns `money`, `moneyCompact`, `moneySigned`, `pct`, `num`, `compact`, `date`, `monthName` and `weekdayName`. Use `makeFormatters(locale, currency)` outside React.'],
  },
  {
    id: 'use-text',
    name: 'useText, useLang',
    group: 'foundation',
    kind: 'hook',
    summary: 'Tiny translation helper. A screen defines `{ en: {...}, tr: {...} }` and picks the dictionary that matches the site locale.',
    source: 'kit/lib/i18n.ts',
    exports: ['useText', 'useLang', 'langOf'],
    props: [prop('dict', 'Record<Lang, T>', 'One dictionary per language.', { required: true })],
    example: `const TEXT = { en: { title: 'Cash flow' }, tr: { title: 'Nakit akışı' } }
const t = useText(TEXT)   // t.title follows the locale`,
    notes: ['Languages are `en` and `tr`; a locale starting with `tr` selects Turkish, anything else English. Add a language in `kit/lib/i18n.ts`.'],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    group: 'foundation',
    kind: 'utility',
    summary: 'Small helpers: class names, safe storage, public asset URLs, dates and the seeded random generator.',
    source: 'kit/lib/cn.ts',
    exports: [],
    imports: [],
    props: [
      prop('cn', '(...values) => string', 'Joins class names, skipping falsy values (`kit/lib/cn.ts`).'),
      prop('storage', '{ get, set, remove }', 'localStorage that never throws, e.g. in private windows (`kit/lib/storage.ts`).'),
      prop('asset', '(path: string) => string', 'URL of a file in `public/` that respects the deploy sub-path (`kit/lib/asset.ts`).'),
      prop('mulberry32', '(seed: number) => () => number', 'Seeded random numbers in [0, 1) (`kit/lib/random.ts`).'),
      prop('date helpers', 'see source', '`today`, `addDays`, `addMonths`, `monthGrid`, `rangePresets` … local-time date arithmetic (`kit/lib/date.ts`).'),
      prop('parseNumber', '(text: string, locale: string) => number | null', 'Reads a number typed in the locale’s format (`kit/components/grid/gridUtils.ts`).'),
    ],
    example: `import { cn } from '@/kit/lib/cn'
<div className={cn('card', active && 'is-active')} />`,
  },
]
