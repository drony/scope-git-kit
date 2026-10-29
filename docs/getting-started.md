# Getting started

## Run the demo

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload. Shows the floating **Theme** button. |
| `npm run build` | Runs every check, then builds into `dist/`. |
| `npm run check` | Type check, layer check and docs check, without building. |
| `npm run docs` | Regenerates `docs/components/*.md` from the catalog. |
| `npm run preview` | Serves the production build locally. |

Requires Node 22.18 or newer (the docs scripts read TypeScript directly, which Node does without a flag from that version).

## Use the kit in another project

The kit is the folder `src/kit`. It is plain React and CSS with no build step of its own: copy it in, add the
dependencies, import the stylesheet and wrap your app in two providers.

**1. Copy** `src/kit` into your project's `src/`. Optionally copy `scripts/` to keep the layer and docs checks.

**2. Install the dependencies** the kit uses:

```bash
npm install react react-dom react-router-dom @floating-ui/react lucide-react \
  @fontsource-variable/geist @fontsource-variable/geist-mono @fontsource-variable/inter
```

**3. Add the `@` alias** so `@/kit/...` resolves to `src/kit/...`. In `vite.config.ts`:

```ts
resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
```

and in `tsconfig.json`: `"paths": { "@/*": ["./src/*"] }`.

**4. Create your configuration** (colors, locale, currency). Copy `src/config/app.config.json` and `src/config/index.ts`, or
start from nothing: `mergeConfig({})` returns the kit's defaults.

```ts
// src/config/index.ts
import raw from './app.config.json'
import { mergeConfig } from '@/kit/theme/theme'
export const SAVED_CONFIG = mergeConfig(raw)
```

**5. Wire it up** in `main.tsx`:

```tsx
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@/kit/styles/index.css'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from '@/kit/context/ConfigContext'
import { ToastProvider } from '@/kit/context/ToastContext'
import { bootstrapTheme } from '@/kit/theme/theme'
import { SAVED_CONFIG } from '@/config'

bootstrapTheme(SAVED_CONFIG) // before first render: no flash of default colors

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ConfigProvider saved={SAVED_CONFIG}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ConfigProvider>
  </BrowserRouter>,
)
```

**6. Use components.**

```tsx
import { Button } from '@/kit/components/ui/Button'
import { DataGrid } from '@/kit/components/grid/DataGrid'
```

### Things to know

- The kit depends on **react-router-dom** (links in `Button`, `Menu`, `Breadcrumbs`, `MegaMenu`). Render inside a router.
- Every color comes from a CSS variable defined in `kit/styles/base.css` and set from your configuration. Never write
  a hex color in component CSS. See [Theming](./theming.md).
- Page layout classes (`.container`, `.section`, `.hero`, `.card`) live in `base.css`; the demo's pages show how they are used.
- Text inside components follows the locale in the configuration. The data grid ships English and Turkish.
- To keep the in-app theme editor working in dev, copy the small Vite plugin from `vite.config.ts` (`saveConfigPlugin`).
  It is optional and exists only in the dev server.
