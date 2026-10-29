# Architecture

## Three layers

```
src/
  kit/                 Reusable design system. Copy this folder into another project.
    components/        ui, forms, nav, overlays, data, grid, charts, calendar, media, theme
    context/           ConfigProvider (theme + site settings), ToastProvider
    hooks/             useHistory, useAutosave, useEditStore, useStoredSet, useTryList, useCopy, useMedia, usePageTitle
    lib/               cn, date, format, i18n, storage, asset, edits, random
    theme/             Configuration schema, defaults, presets, and the function that applies a theme
    styles/            Design tokens and the CSS for every component family
    catalog/           Metadata for every component: the single source of the docs
  demo/                The demo app, built only from the kit and seed data
    pages/             Home, Dashboard, Markets, tables, auth, help …
    layout/            Header, footer, mobile menu, the mega-menu side panel
    components/        Demo-only compositions (pricing section, auth layout, theme preview)
    config/            Navigation structure and which pages use the wide layout
    context/           A fake auth provider
    hooks/             Demo-only hooks, e.g. the shared watchlist (built on the kit's useStoredSet)
    seed/              Fictional data. The only place numbers and names are invented.
    styles/            Header, footer and page layouts
  config/              This project's settings: app.config.json and the object built from it
  main.tsx, App.tsx    Entry point and routes
```

### The rules

| Layer | May import | Must not import |
| --- | --- | --- |
| `kit` | itself, npm packages | `demo`, `config` |
| `demo/seed` | kit **types** and `kit/lib` | pages, layout, React, kit components (values) |
| `demo` | everything above | |

These are enforced by `npm run check:layers`, which runs as part of `npm run check` and `npm run build`. The reason is
simple: the kit is meant to be copied into other projects, and one stray import of demo code would break that.

### How data gets into the kit

Kit components never fetch or import data. It comes in through **props** (rows, series, options) or **providers**
(`ConfigProvider` receives the saved configuration as a prop). Two examples:

- `MegaMenu` takes `entries` and a `renderSide` function. The kit draws the menu and its behavior; the demo decides what
  the side panel shows (`demo/layout/MegaSide.tsx`).
- `DataGrid` takes `columns` and `rows`. The demo's two tables build their columns from seed data and the site locale.

## Theming flow

```
app.config.json ──mergeConfig──▶ SAVED_CONFIG ──▶ <ConfigProvider saved>
                                       │                   │
                       bootstrapTheme(saved)         applyTheme(theme)
                       (before first paint)          (on every change)
                                       └────────▶ CSS variables on <html> ──▶ kit/styles/*.css
```

`applyTheme` writes variables such as `--accent`, `--radius` and `--shell` onto `<html>` and sets `data-theme`.
Stylesheets only read variables. Unsaved edits made in the theme editor are kept in `localStorage` as a draft.

## Page width

`demo/config/pages.ts` lists the routes that use the wide layout. The `Layout` component sets `data-width="wide"` on
`<html>`, and `--shell-active` switches between the regular and wide width. Header, footer and every `.container`
follow, so their edges always line up.

## Linking components

Components stay independent and are linked by the page through props: the dashboard holds the hovered asset class in state, passes it
to `DonutChart` (`activeId`, `onActiveChange`) and to `DataTable` (`rowClassName`, `onRowHover`), and each highlights its part.
`useStoredSet` shares a persistent set (the watchlist) between pages the same way. Nothing in the kit knows about the other side.

## Editing, undo and autosave

Editable tables keep edits **apart from the rows**, as a flat map `{ "rowId|column": value }` (`kit/lib/edits.ts`).
The rows never change, so undo is just going back to an earlier map, and saving is writing one small JSON object.
`useEditStore` bundles this with undo/redo and autosave; `DataGrid` shows the status, the Undo message and the highlights.

## Internationalization

Screens that ship text define `{ en: {...}, tr: {...} }` and pick one with `useText` (`kit/lib/i18n.ts`). The language follows
the locale in the configuration. Numbers, currencies and dates always go through `useFormat`, never `toLocaleString` directly.

## Routing and deploying under a sub-path

`vite.config.ts` reads `BASE_PATH` (for example `/repo/` on GitHub Pages). The router gets it as `basename`, and `asset()`
prefixes files from `public/`. A build step copies `index.html` to `404.html` so direct links to client routes work on
static hosts. See [Deployment](./deployment.md).
