# Finscope

A **reusable React component kit** with a demo app and seed data around it. It follows the look of
[ascope.app](https://ascope.app): Geist type, a quiet grey canvas, hairline borders, black primary buttons, a brand gradient.

> This is not a product. The finance content (portfolio, markets, cash flow) is **fictional demo and seed data**. What matters is
> that the components are easy to take into another project, and that they are documented and checked.

**Live demo:** https://drony.github.io/scope-git/ (Finscope) and https://drony.github.io/scope-git/contest/ (Contest Scope)

## What is in it

- **Components** for forms, navigation, overlays, calendars and date pickers, charts (plain SVG), a data table and an editable
  spreadsheet-style **data grid** (undo, autosave, totals, groups).
- A **theme system**: one JSON file drives every color, radius, width and font, with a live editor, presets and contrast checks.
- A **mega menu**, a demo app and **seed data** you can replace with your own API.
- **Documentation** that is generated from the code, plus checks that keep it honest.

## Quick start

```bash
npm install
npm run dev          # Finscope, http://localhost:5173
npm run dev:contest  # Contest Scope, http://localhost:5173
npm run check        # types, layer rules, docs up to date
npm run build        # runs the checks, then builds Finscope into dist/ and Contest Scope into dist/contest/
```

Node 22.18 or newer.

## How it is organized

```
src/kit/     reusable design system: copy this folder into another project
src/contest/ reusable contest-platform components and data layer (built on the kit)
src/apps/    one folder per product: finscope (finance demo), contest (Contest Scope). Pages, layout, theme, seed
             (src/apps/<app>/settings/app.config.json is that app's theme)
docs/        written guides and the generated component reference
scripts/     layer check and docs generator
```

The kit never imports the demo or the seed data; `npm run check:layers` enforces it. Read
[Architecture](./docs/architecture.md) for the rules and the reasons.

## Documentation

| | |
| --- | --- |
| [Getting started](./docs/getting-started.md) | Run the demo, or use the kit in another project |
| [Architecture](./docs/architecture.md) | Layers, data flow, theming flow |
| [Component reference](./docs/components/README.md) | Every component, hook and utility: props, examples, keyboard behavior |
| [The contest layer](./docs/contest.md) | Contest components, data model and backend contract (Contest Scope) |
| [Theming](./docs/theming.md) | The configuration and every CSS variable |
| [Seed data](./docs/seed-data.md) | What is fictional and how to replace it |
| [Adding a component](./docs/adding-a-component.md) | The checklist for new kit components |
| [Deployment](./docs/deployment.md) | GitHub Pages and other static hosts |

The same reference is browsable in the demo at `/components` (API reference section).

## Changing the look

On the dev server click the floating **Theme** button, or open `/settings`. Edit colors, radius, fonts, widths, locale and currency
live, then press **Save to project** (or **Copy JSON** and replace `src/apps/<app>/settings/app.config.json`). Details: [Theming](./docs/theming.md).
