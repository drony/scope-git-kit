import { prop, type ComponentDoc } from './define.ts'

export const mediaDocs: ComponentDoc[] = [
  {
    id: 'shot',
    name: 'Shot',
    group: 'media',
    summary: 'The padded, rounded, lifted frame for screenshots and photos. Reserves its space so the layout does not jump while the image loads.',
    source: 'kit/components/media/Shot.tsx',
    props: [
      prop('src', 'string', 'Image URL. For files in `public/` use `asset("images/x.png")` so it works under a sub-path.', { required: true }),
      prop('alt', 'string', 'Alternative text.', { required: true }),
      prop('width', 'number', 'Intrinsic width; sets the aspect ratio.', { default: '1600' }),
      prop('height', 'number', 'Intrinsic height; sets the aspect ratio.', { default: '1000' }),
      prop('caption', 'ReactNode', 'Text under the image.'),
      prop('onOpen', '() => void', 'Makes the photo a button, e.g. to open a lightbox.'),
      prop('priority', 'boolean', 'Load immediately instead of lazily (above the fold).'),
    ],
    example: `<Shot src={asset('images/dashboard.png')} alt="The dashboard" caption="Sample data." />`,
  },
  {
    id: 'gallery',
    name: 'Gallery, Lightbox',
    group: 'media',
    summary: 'A responsive photo grid that opens a full-screen viewer (Gallery), and the viewer itself (Lightbox).',
    source: 'kit/components/media/Gallery.tsx',
    exports: ['Gallery', 'Lightbox'],
    props: [
      prop('items', '{ src: string; alt: string; caption?: string; width?: number; height?: number }[]', 'The photos.', { required: true }),
      prop('index', 'number | null', 'Lightbox: index of the open photo, or null when closed.', { required: true }),
      prop('onIndexChange', '(index: number | null) => void', 'Lightbox: called when the viewer navigates or closes.', { required: true }),
    ],
    example: `<Gallery items={[{ src: asset('images/one.jpg'), alt: 'Morning light', caption: 'Morning light' }]} />`,
    notes: ['← → browse, Esc closes, focus is trapped and page scroll is locked while open.'],
  },
]
