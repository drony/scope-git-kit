import { prop, type ComponentDoc } from './define.ts'

export const overlayDocs: ComponentDoc[] = [
  {
    id: 'popover',
    name: 'Popover',
    group: 'overlays',
    summary: 'A floating panel anchored to a trigger. It flips and shifts to stay on screen. The base for date pickers and the grid menus.',
    source: 'kit/components/overlays/Popover.tsx',
    props: [
      prop('trigger', 'ReactElement', 'The element that opens it. It receives a ref plus aria and click props, so it must forward its ref.', { required: true }),
      prop('children', 'ReactNode | (api: { close }) => ReactNode', 'Panel content. A function receives `close`.', { required: true }),
      prop('open', 'boolean', 'Controlled open state. Leave out for uncontrolled.'),
      prop('onOpenChange', '(open: boolean) => void', 'Called when it wants to open or close.'),
      prop('placement', 'Placement', 'Floating UI placement.', { default: "'bottom-start'" }),
      prop('matchWidth', 'boolean', 'Make the panel as wide as the trigger.'),
      prop('initialFocus', 'number', 'Index of the element to focus first; -1 leaves focus alone.', { default: '0' }),
    ],
    example: `<Popover trigger={<Button variant="ghost">Notifications</Button>}>
  {({ close }) => <div className="stack-sm" style={{ padding: '1rem' }}>You are all caught up. <Button size="sm" onClick={close}>Close</Button></div>}
</Popover>`,
    notes: ['Esc and outside click close it, focus returns to the trigger. Do not put a `Select` inside: its list is its own floating layer.'],
  },
  {
    id: 'hover-card',
    name: 'HoverCard',
    group: 'overlays',
    summary: 'A richer preview that opens when the pointer rests on something (or it gets keyboard focus): a mini chart, a few facts.',
    source: 'kit/components/overlays/HoverCard.tsx',
    props: [
      prop('content', 'ReactNode', 'What the card shows. It is not rendered until the card opens, so it can be as rich as you like.', { required: true }),
      prop('children', 'ReactNode', 'The element to hover. It is wrapped in an inline span.', { required: true }),
      prop('placement', 'Placement', 'Preferred side.', { default: "'right-start'" }),
      prop('delay', 'number', 'Milliseconds the pointer must rest before the card opens.', { default: '300' }),
      prop('onOpen', '() => void', 'Called each time the card opens.'),
    ],
    example: `<HoverCard content={<AssetPeek asset={asset} />}>
  <strong>{asset.symbol}</strong>
</HoverCard>`,
    notes: [
      'The card stays open while the pointer travels onto it, closes on Esc, and opens on keyboard focus.',
      'Touch devices do not open it, so never hide essential information in a hover card.',
      'For information only. Put actions in a Popover.',
    ],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    group: 'overlays',
    summary: 'A short label shown on hover and keyboard focus.',
    source: 'kit/components/overlays/Tooltip.tsx',
    props: [
      prop('label', 'ReactNode', 'Tooltip text.', { required: true }),
      prop('children', 'ReactElement', 'A single element that can take a ref.', { required: true }),
      prop('placement', 'Placement', 'Preferred side.', { default: "'top'" }),
    ],
    example: `<Tooltip label="Copies the account number"><Button icon aria-label="Copy"><Copy /></Button></Tooltip>`,
    notes: ['For a short description only. Put interactive content in a Popover.'],
  },
  {
    id: 'menu',
    name: 'Menu',
    group: 'overlays',
    summary: 'A dropdown of actions with arrow-key navigation.',
    source: 'kit/components/overlays/Menu.tsx',
    props: [
      prop('trigger', 'ReactElement', 'The element that opens the menu.', { required: true }),
      prop('entries', 'MenuEntry[]', "Items (`{ id, label, icon?, onSelect?, to?, danger? }`), `{ type: 'separator' }`, `{ type: 'label' }` and `{ type: 'custom', node }`.", { required: true }),
      prop('placement', 'Placement', 'Preferred side.', { default: "'bottom-end'" }),
    ],
    example: `<Menu trigger={<Button variant="ghost">Actions</Button>} entries={[
  { id: 'profile', label: 'Profile', to: '/profile' },
  { type: 'separator', id: 's' },
  { id: 'delete', label: 'Delete', danger: true, onSelect: remove },
]} />`,
    notes: ['↑ ↓ move (wrapping), Enter selects, Esc closes. Items with `to` render router links.'],
  },
  {
    id: 'modal',
    name: 'Modal',
    group: 'overlays',
    summary: 'A centered dialog that traps focus and locks page scroll.',
    source: 'kit/components/overlays/Modal.tsx',
    props: [
      prop('open', 'boolean', 'Whether it is shown.', { required: true }),
      prop('onClose', '() => void', 'Called on Esc, outside click and the close button.', { required: true }),
      prop('title', 'ReactNode', 'Heading, also the accessible name.', { required: true }),
      prop('description', 'ReactNode', 'Text under the heading.'),
      prop('children', 'ReactNode', 'Body.'),
      prop('actions', 'ReactNode', 'Buttons aligned to the bottom right.'),
      prop('size', "'md' | 'lg'", 'Width.', { default: "'md'" }),
    ],
    example: `<Modal open={open} onClose={() => setOpen(false)} title="Close this account?" actions={<Button variant="danger">Close account</Button>} />`,
    notes: ['Focus returns to the element that opened it.'],
  },
  {
    id: 'drawer',
    name: 'Drawer',
    group: 'overlays',
    summary: 'A modal side sheet.',
    source: 'kit/components/overlays/Drawer.tsx',
    props: [
      prop('open', 'boolean', 'Whether it is shown.', { required: true }),
      prop('onClose', '() => void', 'Called on Esc, outside click and the close button.', { required: true }),
      prop('title', 'ReactNode', 'Heading.', { required: true }),
      prop('children', 'ReactNode', 'Body.', { required: true }),
      prop('side', "'right' | 'left'", 'Edge it slides from.', { default: "'right'" }),
      prop('footer', 'ReactNode', 'Sticky footer content.'),
    ],
    example: `<Drawer open={open} onClose={() => setOpen(false)} title="Filters" footer={<Button>Apply</Button>}>…</Drawer>`,
    notes: ['For a non-blocking side panel see `ThemeDock`.'],
  },
]
