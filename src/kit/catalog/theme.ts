import { prop, type ComponentDoc } from './define.ts'

export const themeDocs: ComponentDoc[] = [
  {
    id: 'theme-editor',
    name: 'ThemeEditor',
    group: 'theme',
    summary:
      'The live theme editor: presets, light and dark palettes with contrast checks, gradient, chart colors, radius, widths, shadows, font, locale, currency, and JSON export, import and save.',
    source: 'kit/components/theme/ThemeEditor.tsx',
    example: `<ConfigProvider saved={SAVED_CONFIG}><ThemeEditor /></ConfigProvider>`,
    notes: [
      'Takes no props: it reads and writes the configuration through `useConfig()`, so it needs a `ConfigProvider` above it.',
      'Edits apply to the whole page as you type and are kept in this browser until saved. On the dev server “Save to project” writes the config file; elsewhere use Copy JSON.',
    ],
  },
  {
    id: 'theme-dock',
    name: 'ThemeDock',
    group: 'theme',
    summary: 'A floating “Theme” button that opens the editor beside the page. A design-time tool: it only mounts on the dev server.',
    source: 'kit/components/theme/ThemeDock.tsx',
    props: [prop('settingsPath', 'string', 'Route of a full-page theme editor. When set, the dock links to it and hides itself there.')],
    example: `<ThemeDock settingsPath="/settings" />`,
  },
  {
    id: 'theme-toggle',
    name: 'ThemeToggle',
    group: 'theme',
    summary: 'An icon button that opens a small menu: light, one of three night-blue dark styles (Deep ocean, Midnight, Twilight) or the system setting. The choice is kept in this browser like any other theme edit.',
    source: 'kit/components/theme/ThemeToggle.tsx',
    props: [prop('className', 'string', 'Extra classes.')],
    example: `<SiteHeader brand={<Logo />} actions={<ThemeToggle />}>…</SiteHeader>`,
    notes: [
      'Reads and writes `theme.mode` and `theme.colors.dark` through `useConfig()`, so it needs a `ConfigProvider` above it.',
      'Choosing a dark style replaces the dark palette; the theme editor can still change single colors afterwards. The styles are in `NIGHT_STYLES` (`kit/theme/theme.ts`); the first one is the default dark palette.',
    ],
  },
  {
    id: 'color-field',
    name: 'ColorField',
    group: 'theme',
    summary: 'A native color picker plus a hex input that only commits valid colors.',
    source: 'kit/components/theme/ColorField.tsx',
    props: [
      prop('value', 'string', 'Current color as #rrggbb.', { required: true }),
      prop('onChange', '(hex: string) => void', 'Called with a valid #rrggbb color.', { required: true }),
      prop('label', 'string', 'Used for the accessible names of both inputs.', { required: true }),
    ],
    example: `<ColorField label="Accent" value={accent} onChange={setAccent} />`,
  },
]
