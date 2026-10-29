# Deployment

The project builds to static files (`dist/`) and needs no server.

```bash
npm run build      # runs the checks, then builds into dist/
npm run preview    # serve the build locally
```

## GitHub Pages (what this repo uses)

`.github/workflows/pages.yml` builds and publishes on every push to `main`.

1. Create the repository and push the code.
2. In **Settings → Pages**, set **Source** to **GitHub Actions** (or `gh api -X POST repos/OWNER/REPO/pages -f build_type=workflow`).
3. Push to `main`. The workflow runs `npm ci` and `npm run build` with `BASE_PATH=/<repo-name>/`, then publishes `dist/`.

The site is served at `https://OWNER.github.io/REPO/`. Two details make that work from a sub-path:

- `BASE_PATH` sets Vite's `base`, the router's `basename`, and the prefix that `asset()` adds to files from `public/`.
- The build copies `index.html` to `404.html`, so opening or refreshing `/REPO/tables` (a client route) still loads the app.
  GitHub answers those requests with status 404 but serves the app, which is fine in a browser; link previews of deep links may
  show an error, so share the root address.

GitHub Pages is not available for **private** repositories on a free account. The workflow skips both jobs in a private
repository, so a private working copy does not show failing runs.

## Another static host

Build with the base path of that host, and make sure unknown paths fall back to `index.html`.

- **At the root of a domain** (Netlify, Vercel and similar): no `BASE_PATH` is needed. Add a rewrite that serves `index.html` for
  unknown paths: for Netlify a `public/_redirects` file containing `/* /index.html 200`, for Vercel a `rewrites` entry in `vercel.json`.
- **Under a sub-path**: `BASE_PATH=/sub/ npm run build`. The generated `404.html` is the fallback on hosts that serve it for missing files.

Check your host's documentation for single-page-app fallbacks; the build always writes `dist/404.html`, which some hosts treat specially.

## Checks in CI

The workflow runs `npm run build`, which includes `npm run check` (types, layer rules, docs). A change that breaks the layering or
leaves the component reference out of date fails the build before anything is published.
