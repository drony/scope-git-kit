import { prop, type ContestDoc } from './define.ts'

const rules = [
  prop('accept', 'string', 'Allowed types, like the `accept` of a file input: `image/*`, `audio/*,video/*` or `application/pdf`.', { default: "'image/*'" }),
  prop('maxMb', 'number', 'Largest file in megabytes.', { default: '5' }),
  prop('minWidth', 'number', 'Smallest picture width in pixels.'),
  prop('minHeight', 'number', 'Smallest picture height in pixels.'),
  prop('maxDurationSec', 'number', 'Longest sound or video in seconds.'),
]

export const mediaDocs: ContestDoc[] = [
  {
    id: 'media-uploader',
    name: 'MediaUploader',
    group: 'media',
    summary: 'Drop files or browse, and watch each one upload: it checks type, size, dimensions and length first, shows progress per file, and lets the person cancel or retry.',
    source: 'contest/components/MediaUploader.tsx',
    exports: ['MediaUploader'],
    props: [
      prop('onUpload', '(file: File, options: { onProgress: (fraction: number) => void; signal: AbortSignal }) => Promise<MediaAsset>', 'Sends one file. Report progress with `onProgress(0..1)` and stop when `signal` aborts.', { required: true }),
      prop('onUploaded', '(asset: MediaAsset) => void', 'Called once for every file that arrives safely.'),
      ...rules,
      prop('multiple', 'boolean', 'Accept more than one file.', { default: 'true' }),
      prop('maxFiles', 'number', 'Most files in one go.', { default: '10' }),
      prop('title', 'string', 'Heading of the drop area.'),
      prop('hint', 'string', 'Replaces the line that lists the rules.'),
      prop('disabled', 'boolean', 'Switches the drop area off.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `const { upload } = useMedia()

<MediaUploader accept="image/*" maxMb={5} minWidth={800} onUpload={(file, o) => upload(file, o)} />`,
    notes: [
      'A refused file is explained in words ("photo.png is larger than 5 MB."), not just rejected.',
      'Cancelling aborts the request through the `AbortSignal`. A cancelled or failed file shows a retry button.',
    ],
  },
  {
    id: 'media-library',
    name: 'MediaLibrary',
    group: 'media',
    summary: 'All uploaded files in a grid or list, with search, kind and tag filters, multiple choice, and a bulk delete that says how many questions would lose a file. MediaThumb is its small preview.',
    source: 'contest/components/MediaLibrary.tsx',
    exports: ['MediaLibrary', 'MediaThumb'],
    imports: ['MediaLibrary'],
    props: [
      prop('assets', 'MediaAsset[]', 'The files.', { required: true }),
      prop('usage', 'Record<string, number>', 'How many questions use each file, by id. Shown on each card and warned about before a delete.'),
      prop('selected', 'string[]', 'The chosen ids. Leave out to let the library keep the choice itself.'),
      prop('onSelectedChange', '(ids: string[]) => void', 'Called when the choice changes.'),
      prop('maxSelect', 'number', 'Most files that can be chosen. 1 picks a single file and a new choice replaces the old.'),
      prop('kinds', "Array<'image' | 'audio' | 'video' | 'document'>", 'Only these kinds are listed.'),
      prop('onOpen', '(asset: MediaAsset) => void', 'Called when a file is clicked. Without it, clicking a file chooses it.'),
      prop('onDelete', '(assets: MediaAsset[]) => void', 'Shows the delete button for chosen files. The library asks for confirmation first.'),
      prop('actions', 'ReactNode', 'Extra buttons on the right of the toolbar, for example an Upload button.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<MediaLibrary assets={assets} usage={usage} onOpen={setViewing} onDelete={(list) => remove(list.map((a) => a.id))} />`,
    notes: ['It lists and chooses; uploading, viewing and deleting are the page\'s job, through `actions`, `onOpen` and `onDelete`.', 'Thumbnails follow each picture\'s saved crop and focal point.'],
  },
  {
    id: 'media-viewer',
    name: 'MediaViewer',
    group: 'media',
    summary: "One file in full: the picture (click to enlarge), a player for sound and video, a reader for PDFs, and the file's details. With `onSave` it also edits the description, caption, tags, crop and focal point.",
    source: 'contest/components/MediaViewer.tsx',
    props: [
      prop('asset', 'MediaAsset', 'The file to show.', { required: true }),
      prop('usage', 'number', 'How many questions use the file.'),
      prop('onSave', '(asset: MediaAsset) => void', 'Shows the edit fields and a Save button. Without it the viewer only shows.'),
      prop('onPrev', '() => void', 'Shows a previous button.'),
      prop('onNext', '() => void', 'Shows a next button.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<Drawer open={!!viewing} onClose={() => setViewing(null)} title="Media">
  {viewing && <MediaViewer asset={viewing} usage={usage[viewing.id]} onSave={update} />}
</Drawer>`,
    notes: ['Edits stay in a draft until Save. Changing to another file starts from that file.', 'The picture is never changed: only the crop numbers are saved.'],
  },
  {
    id: 'media-picker',
    name: 'MediaPicker',
    group: 'media',
    summary: 'A dialog to choose files from the library, or to upload a new one on the spot. Use it behind every "Add picture" button.',
    source: 'contest/components/MediaPicker.tsx',
    props: [
      prop('open', 'boolean', 'Shows the dialog.', { required: true }),
      prop('onClose', '() => void', 'Called when the dialog is cancelled.', { required: true }),
      prop('assets', 'MediaAsset[]', 'The library.', { required: true }),
      prop('usage', 'Record<string, number>', 'Use counts, shown on the cards.'),
      prop('kinds', "Array<'image' | 'audio' | 'video' | 'document'>", 'Only these kinds can be chosen.'),
      prop('multiple', 'boolean', 'Choose several files.', { default: 'false' }),
      prop('title', 'string', 'Dialog title.', { default: "'Choose media'" }),
      prop('onPick', '(assets: MediaAsset[]) => void', 'Called with the chosen files when the person confirms.', { required: true }),
      prop('onUpload', 'UploadHandler', 'Adds an "Upload new" tab. A file that uploads is chosen for the person.'),
      prop('accept', 'string', 'Allowed types for the "Upload new" tab. By default they follow `kinds`.'),
    ],
    example: `<MediaPicker open={picking} onClose={() => setPicking(false)} assets={assets} kinds={['image']} onUpload={upload} onPick={([a]) => attach(a.id)} />`,
    notes: ['The other upload rules of `MediaUploader` (`maxMb`, `minWidth`, `minHeight`, `maxDurationSec`) are accepted too and apply to the "Upload new" tab.'],
  },
  {
    id: 'media-moderation',
    name: 'MediaModeration',
    group: 'media',
    summary: 'A wall for going through uploads quickly: arrow keys to move, A to approve, R to reject, F to flag, Z to undo.',
    source: 'contest/components/MediaModeration.tsx',
    props: [
      prop('assets', 'MediaAsset[]', 'All media. The wall shows those that are waiting for review or flagged.', { required: true }),
      prop('onModerate', '(asset: MediaAsset, state: ModerationState) => void', 'Called with the file and the state to give it. Undo calls it with the old state.', { required: true }),
      prop('uploaderName', '(id: string) => string | undefined', 'Turns an uploader id into a name for the card.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<MediaModeration assets={assets} onModerate={(asset, moderation) => void media.update({ ...asset, moderation })} />`,
    notes: [
      'A decided file leaves the wall at once and the next one is selected; the decision is sent in the background.',
      'Focus the wall (Tab to it, or click a card) and use the keys. Every card also has buttons for the mouse.',
    ],
  },
  {
    id: 'cropped-image',
    name: 'CroppedImage',
    group: 'media',
    summary: "A picture shown through its saved crop, rotation and focal point. In a box of another shape it slides toward the focal point, so the subject stays in view.",
    source: 'contest/components/CroppedImage.tsx',
    props: [
      prop('asset', 'MediaAsset', 'The picture. Only url, name, alt, width, height, focal and transform are read.', { required: true }),
      prop('ratio', 'number', 'Width ÷ height of the box, for example 1 for a square. Leave out to show the crop in its own shape.'),
      prop('override', "Pick<MediaAsset, 'transform' | 'focal'>", "Replaces the asset's crop, for live previews while editing."),
      prop('alt', 'string', "Replaces the picture's description."),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<CroppedImage asset={asset} ratio={1} />   {/* a square thumbnail that keeps the subject */}
<CroppedImage asset={asset} ratio={16 / 9} />`,
    notes: ['The file is never changed. The box shows the right part of it with plain CSS, so it costs nothing to show the same picture in many shapes.'],
  },
  {
    id: 'image-cropper',
    name: 'ImageCropper',
    group: 'media',
    summary: 'Crop, rotate and set a focal point without touching the file. Live square, wide and tall previews show what the focal point does.',
    source: 'contest/components/ImageCropper.tsx',
    props: [
      prop('asset', 'MediaAsset', 'The picture.', { required: true }),
      prop('value', '{ transform: Transform; focal: Point }', 'The crop being edited. Leave out to start from what the asset has saved.'),
      prop('onChange', '(value: { transform: Transform; focal: Point }) => void', 'Called with the new crop and focal point, as fractions of the rotated picture.', { required: true }),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `const [crop, setCrop] = useState(currentCrop(asset))

<ImageCropper asset={asset} value={crop} onChange={setCrop} />
<Button onClick={() => update({ ...asset, ...crop })}>Save</Button>`,
    notes: [
      'Drag the box to move it, a handle to resize it, the dot to set the focal point. With the keyboard: Tab to the box, arrow keys move it (Shift for bigger steps), + and − resize it. Tab to the dot and use the arrow keys to move it.',
      'Choosing 1:1, 4:3 or 16:9 locks the shape of the box. Turning the picture turns the crop and the focal point with it.',
    ],
  },
]
