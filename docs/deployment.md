# Deployment

The project builds to static files (`dist/`) and needs no server. Finscope is the site root; Contest Scope is built into `dist/contest/`
and served under `/contest/`.

```bash
npm run build      # runs the checks, then builds both apps into dist/ and dist/contest/
npm run preview    # serve the build locally
```

## GitHub Pages with the source kept private (what this repo uses)

GitHub Pages on a free account needs a public repository, and a public repository shows its source. So two repositories are used:

| Repository | Visibility | Holds |
| --- | --- | --- |
| Source repository | private | The code, docs and `.github/workflows/publish-demo.yml` |
| Demo repository | public | Only the compiled files, served by Pages |

On every push to `main`, the workflow runs `npm ci` and `npm run build` with `BASE_PATH=/<demo-repo-name>/`, then replaces the whole
content of the demo repository with `dist/` as a single commit. The demo repository never holds source code, and its history does not grow.

One-time setup:

1. Create the public demo repository and set its Pages source to branch `main`, folder `/`
   (`gh api -X POST repos/OWNER/DEMO/pages -f 'source[branch]=main' -f 'source[path]=/'`).
2. Create a key pair with `ssh-keygen -t ed25519 -N "" -f demo_key`. Add `demo_key.pub` to the demo repository as a **deploy key with
   write access**, and store `demo_key` in the source repository as the secret `DEMO_DEPLOY_KEY`. Delete both local files afterwards.
3. Set `DEMO_REPO` at the top of the workflow to `OWNER/DEMO`.
4. Push to `main`, or run the workflow by hand from the **Actions** tab.

The deploy key can write to the demo repository only, so a leaked secret cannot touch the source.

The site is served at `https://OWNER.github.io/DEMO/`. Two details make that work from a sub-path:

- `BASE_PATH` sets Vite's `base`, the router's `basename`, and the prefix that `asset()` adds to files from `public/`.
- The build copies `index.html` to `404.html`, so opening or refreshing `/REPO/tables` (a client route) still loads the app.
  GitHub answers those requests with status 404 but serves the app, which is fine in a browser; link previews of deep links may
  show an error, so share the root address.
- GitHub serves only the root `404.html`, so a refreshed link into Contest Scope (`/REPO/contest/play`) would show Finscope. The root
  `404.html` therefore carries a small script that moves such a link to `/REPO/contest/?/play`, and Contest Scope's `index.html` puts the
  path back before the router starts. Both scripts are added by `vite.config.ts` and exist only in builds.

If the source may be public, the simpler setup is a single repository with **Settings → Pages → Source: GitHub Actions** and a workflow
that builds and uploads `dist/` with `actions/upload-pages-artifact` and `actions/deploy-pages`.

## Another static host

Build with the base path of that host, and make sure unknown paths fall back to `index.html`.

- **At the root of a domain** (Netlify, Vercel and similar): no `BASE_PATH` is needed. Add a rewrite that serves `index.html` for
  unknown paths: for Netlify a `public/_redirects` file containing `/* /index.html 200`, for Vercel a `rewrites` entry in `vercel.json`.
- **Under a sub-path**: `BASE_PATH=/sub/ npm run build`. The generated `404.html` is the fallback on hosts that serve it for missing files.
  Contest Scope needs its own fallback rule: unknown paths under `/sub/contest/` serve `/sub/contest/index.html`.

Check your host's documentation for single-page-app fallbacks; the build always writes `dist/404.html`, which some hosts treat specially.

## Checks in CI

The workflow runs `npm run build`, which includes `npm run check` (types, layer rules, docs). A change that breaks the layering or
leaves the component reference out of date fails the build before anything is published.
