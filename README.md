# Finscope

A finance site built in React, designed as a continuation of [ascope.app](https://ascope.app): same Geist type,
spacing, radii, elevation and call-to-action style. Everything is driven by one config file, so colors, fonts and
defaults can be changed without touching components.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## Change the look (Theme & settings)

All colors and style values live in **`src/config/app.config.json`**. There are three ways to change it:

1. **Live editor** — on the dev server click the floating **Theme** button (any page) or open `/settings`.
   Edit colors (light and dark), the brand gradient, chart colors, radius, content width, header height, shadows,
   font, locale, currency and site name. The site updates as you type.
2. **Save** — in the editor's **Output** tab, press **Save to project** (dev server only) to write the file, or
   **Copy JSON** / **Download** and replace `src/config/app.config.json` with it.
3. **Edit the JSON by hand** — missing or invalid values fall back to defaults, so partial files are fine.

Unsaved edits are kept in your browser (`localStorage`) until you save or discard them.

## Structure

```
src/
  config/       app.config.json (theme + site), theme.ts (applies it as CSS variables), navigation.ts (mega menu, footer)
  context/      ConfigContext (live theme), AuthContext (demo session), ToastContext
  styles/       base.css (tokens + ascope.app spacing/type), ui, forms, overlays, calendar, charts, layout, theme, pages
  components/
    ui/         Button, Badge/Chip/Tag/Delta, Card, Alert, Meter, Skeleton, Avatar, Terminal, Section, Reveal, Logo
    forms/      Field, Input, Select, Checkbox/Radio/Switch, Slider, OtpInput, PasswordStrength, Dropzone/PhotoPicker
    calendar/   Calendar, DatePicker, DateRangePicker, MonthPicker, TimePicker, EventCalendar
    charts/     AreaChart, BarChart, DonutChart, CandlestickChart, Heatmap, Sparkline
    overlays/   Popover, Tooltip, Menu, Modal, Drawer (Floating UI)
    nav/        Tabs, Segmented, Accordion, Breadcrumbs, Pagination, Stepper
    layout/     Header + MegaMenu, MobileNav, Footer, Layout
    theme/      ThemeEditor, ThemeDock, ThemePreview
  pages/        Home, Dashboard, Markets, Asset, CalendarPage, Login, Register, Forgot, Help, HelpArticle,
                Pricing, Components (every component), Settings, NotFound
  lib/          mock.ts (sample data), format.ts (money/date by locale), date.ts, content.ts, helpData.ts
```

## Finance tables (`/tables`)

`src/components/grid/DataGrid.tsx` is a reusable, spreadsheet-style table. Two examples use it: **cash flow**
(`src/pages/tables/CashFlowTable.tsx`) and **positions** (`PositionsTable.tsx`).

- Search, filter chips, sort, group (collapsible, with subtotals), column visibility, density and a totals row.
- Editable cells: Enter, F2, double-click or just start typing. Arrow keys move, Shift selects a range, Delete clears,
  copy and paste work with spreadsheets. The footer shows the selection (`E4`) and its sum.
- Crosshair: the row and column under the pointer (or the keyboard cursor) are highlighted, and cells whose value just changed flash.
- Every edit shows a message with a working **Undo** button (then **Redo**); ⌘Z / ⇧⌘Z and the header buttons do the same.
- **Autosave** writes edits a moment after the last change ("Saving…" → "All changes saved · time"). The switch in the header
  turns it off, which brings back the Save button and an "Unsaved changes" status.
- A **Try it** checklist above each table ticks itself off as the visitor edits, undoes, selects, sorts, filters and so on,
  with "Do it for me" buttons for the first steps. Pass `onInteraction` to `DataGrid` and use `useTryList` to add one to a new table.
- CSV export, pagination, expandable detail rows.
- Column visibility, density and page size are remembered per table (`storageKey`); saved edits live in `localStorage`.
- Text follows the site locale (English or Türkçe). Set **General → Language** to Türkçe and the currency to TRY in the
  theme editor to see the Turkish version.

To add a table, define `columns` (the first one is the pinned row label), pass `rows`, and handle `onEdit`:

```tsx
<DataGrid title="Budget" storageKey="budget" columns={columns} rows={rows} rowId={(r) => r.id}
          onEdit={(changes) => /* [{ rowId, colId, value }] */} history={history} save={{ dirty, onSave }} />
```

## Good to know

- **Sample data.** Prices, holdings and transactions come from `src/lib/mock.ts`. Replace it with your API layer.
- **Demo auth.** `AuthContext` only stores a name and email in `localStorage`. Swap in a real provider.
  The demo two-step code is `123456`.
- **Navigation.** Edit `src/config/navigation.ts` to change the mega menu, mobile menu and footer. Each mega menu item can have a
  `preview` (assets, portfolio, events, table, news, articles, palette or a list of points); the side panel shows it while the
  item is hovered or focused (`src/components/layout/MegaPreview.tsx`).
- **Colors in CSS.** Never hard-code colors; use the variables from `base.css` (`--ink`, `--accent`, `--primary` ...).
- **Photos.** `public/images/*.svg` are generated placeholders. Pass any `src` to `Shot` / `Gallery`.
- The Theme button only appears on the dev server. `/settings` is always available in production.
