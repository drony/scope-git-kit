# Adding a component

A short checklist, in the order you will need it. Existing components in `src/kit/components` are the reference.

## 1. Decide where it goes

- A control, display or behavior that has **no knowledge of finance, this demo or its data** goes in `src/kit/components/<family>`.
- Anything that needs seed data, demo routes or demo copy goes in `src/demo` and uses kit components.

Families: `ui`, `forms`, `nav`, `overlays`, `data`, `grid`, `charts`, `calendar`, `media`, `theme`.

## 2. Write it

- **Props are explicit.** Controlled components take `value` and `onChange(value)`. Give optional props a default in the
  function signature, and document it.
- **Pass through native attributes** (`className`, `aria-*`, event handlers) when the component wraps one element.
- **Colors and sizes come from variables.** No hex colors, no hard-coded radii. Use `var(--ink)`, `var(--accent)`, `var(--radius)`
  and the spacing already used in `kit/styles`.
- **Accessible by default.** A real element (`button`, `input`), visible focus (the global `:focus-visible` ring), labels or
  `ariaLabel`, and the right ARIA pattern for menus, tabs, dialogs and grids. Support the keyboard.
- **Text goes through i18n** if the component shows its own words: define `{ en, tr }` and use `useText`.
- **Numbers and dates go through `useFormat`.**
- **Floating things use `Popover`/Floating UI** so they flip, shift and trap focus properly.
- **No data imports.** Rows, options and callbacks come in as props.

## 3. Style it

Add the CSS to the matching file in `src/kit/styles` (for example `forms.css`), using the class naming of that file
(`.thing`, `.thing-part`, `.is-state`). Check it in light and dark, and at phone width.

## 4. Add it to the catalog

Add an entry to the right file in `src/kit/catalog` (`ui.ts`, `forms.ts` …):

```ts
{
  id: 'thing',
  name: 'Thing',
  group: 'ui',
  summary: 'One sentence: what it is for.',
  source: 'kit/components/ui/Thing.tsx',
  props: [prop('value', 'string', 'What it shows.', { required: true })],
  example: `<Thing value="Hello" />`,
  notes: ['Keyboard and accessibility behavior worth knowing.'],
}
```

Then run `npm run docs`. It rewrites `docs/components/*.md` and fails if a documented prop is not in the source file or an exported
component is not documented.

## 5. Show it on the /components page

Add a small live example to the matching section of `src/demo/pages/Components.tsx`. The API reference at the bottom of that
page is generated from the catalog, so you only add the live demo.

## 6. Run the checks

```bash
npm run check    # type check, layer rules, docs up to date
```

`npm run build` runs the same checks first, and the deploy workflow runs `npm run build`.

## Conventions at a glance

| Topic | Convention |
| --- | --- |
| Files | One component family per file when they share state (`Controls.tsx`), otherwise one per component |
| Naming | `PascalCase` components, `useThing` hooks, `kebab-case` CSS classes, state classes `is-…` |
| Imports | `@/kit/...` aliases, no `../` |
| Exports | Named exports; pages are the only default exports (they are lazy-loaded) |
| State | Lift it up; use `useHistory` / `useEditStore` for anything undoable |
