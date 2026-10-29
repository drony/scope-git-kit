import type { ComponentDoc, GroupDoc } from './define.ts'
import { calendarDocs } from './calendar.ts'
import { chartDocs } from './charts.ts'
import { dataDocs } from './data.ts'
import { formDocs } from './forms.ts'
import { foundationDocs } from './foundation.ts'
import { mediaDocs } from './media.ts'
import { navDocs } from './nav.ts'
import { overlayDocs } from './overlays.ts'
import { themeDocs } from './theme.ts'
import { uiDocs } from './ui.ts'

export { importStatement } from './define.ts'
export type { ComponentDoc, GroupDoc, GroupId, PropDoc } from './define.ts'

/** The groups, in the order they are listed in the docs and on the /components page. */
export const GROUPS: GroupDoc[] = [
  { id: 'ui', title: 'Basics', description: 'Buttons, badges, cards, feedback and page scaffolding.' },
  { id: 'forms', title: 'Forms', description: 'Fields, inputs, selection controls, sliders and uploads.' },
  { id: 'nav', title: 'Navigation', description: 'Tabs, segmented control, accordion, breadcrumbs, pagination, stepper and the mega menu.' },
  { id: 'overlays', title: 'Overlays', description: 'Popover, tooltip, menu, modal and drawer.' },
  { id: 'data', title: 'Data', description: 'The simple DataTable and the editable DataGrid for finance tables.' },
  { id: 'charts', title: 'Charts', description: 'Area, bar, donut, candlestick, heatmap and sparkline, as plain SVG.' },
  { id: 'calendar', title: 'Date & time', description: 'Calendar, pickers and the event calendar.' },
  { id: 'media', title: 'Media', description: 'Photo frame, gallery and lightbox.' },
  { id: 'theme', title: 'Theme tools', description: 'The live theme editor and its parts.' },
  { id: 'foundation', title: 'Providers, hooks & utilities', description: 'Configuration, toasts, undo/redo, autosave, formatting and helpers.' },
]

/** Every documented component, hook and utility. */
export const DOCS: ComponentDoc[] = [
  ...uiDocs,
  ...formDocs,
  ...navDocs,
  ...overlayDocs,
  ...dataDocs,
  ...chartDocs,
  ...calendarDocs,
  ...mediaDocs,
  ...themeDocs,
  ...foundationDocs,
]

export const docsOf = (group: GroupDoc['id']): ComponentDoc[] => DOCS.filter((d) => d.group === group)
