import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * The project holds more than one app (src/apps/<id>). `APP=<id>` picks which one `vite` serves or builds; the default is
 * the first. Each app has its own entry (src/apps/<id>/main.tsx), theme (src/apps/<id>/settings/app.config.json) and seed.
 */
const APPS = {
  finscope: {
    title: 'Finscope',
    description: 'Finscope: your accounts, markets and cash flow in one calm place.',
  },
  contest: {
    title: 'Contest Scope',
    description: 'Contest Scope: questions, answers, media, announcements and scoring for contests.',
  },
} as const
type AppId = keyof typeof APPS

const APP = (process.env.APP ?? 'finscope') as AppId
if (!(APP in APPS)) throw new Error(`Unknown APP "${APP}". Use one of: ${Object.keys(APPS).join(', ')}`)
const SETTINGS_FILE = `src/apps/${APP}/settings/app.config.json`

/** The apps that are not the site root: each is built into dist/<id>/ and served under <base><id>/. */
const SECONDARY = (Object.keys(APPS) as AppId[]).filter((id) => id !== 'finscope')

/**
 * Static hosts such as GitHub Pages serve one 404.html, the one at the root. A deep link into a secondary app
 * (<base>contest/play) would land on the first app's page. The root 404.html therefore sends such a link to the app's own
 * index with the path in the query (<base>contest/?/play), and the app puts the path back before the router starts.
 */
const sendToAppScript = (base: string) =>
  `<script>(function(l){var b=${JSON.stringify(base)},a=${JSON.stringify(SECONDARY)},r=l.pathname.slice(b.length).split('/');if(l.pathname.indexOf(b)!==0||a.indexOf(r[0])<0)return;l.replace(b+r[0]+'/?/'+r.slice(1).join('/').replace(/&/g,'~and~')+(l.search?'&'+l.search.slice(1).replace(/&/g,'~and~'):'')+l.hash)})(window.location)</script>`
const restorePathScript = `<script>(function(l){if(l.search[1]==='/'){var d=l.search.slice(1).split('&').map(function(s){return s.replace(/~and~/g,'&')}).join('?');history.replaceState(null,null,l.pathname.slice(0,-1)+d+l.hash)}})(window.location)</script>`

/**
 * Dev-only endpoint used by the Theme & Settings screen ("Save to project").
 * It writes the posted JSON to the active app's settings file (src/apps/<app>/settings/app.config.json) and nothing else.
 * It never exists in a production build (`apply: 'serve'`).
 */
function saveConfigPlugin(): Plugin {
  const target = path.resolve(root, SETTINGS_FILE)
  return {
    name: 'finscope-save-config',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__config/save', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return send(405, { ok: false, error: 'POST only' })

        const origin = req.headers.origin
        if (origin) {
          try {
            if (new URL(origin).host !== req.headers.host) return send(403, { ok: false, error: 'Forbidden origin' })
          } catch {
            return send(403, { ok: false, error: 'Forbidden origin' })
          }
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
          if (body.length > 200_000) req.destroy()
        })
        req.on('end', () => {
          try {
            const json = JSON.parse(body)
            const ok = json && typeof json === 'object' && json.version === 1 && json.theme && json.site
            if (!ok) throw new Error('Unexpected config shape')
            fs.writeFileSync(target, JSON.stringify(json, null, 2) + '\n')
            send(200, { ok: true, path: SETTINGS_FILE })
          } catch (e) {
            send(400, { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' })
          }
        })
      })
    },
  }
}

/**
 * One index.html serves every app: this swaps in the entry script, the title and the description of the active app.
 * (Order 'pre' so Vite sees the final script path.)
 */
function appEntryPlugin(): Plugin {
  const { title, description } = APPS[APP]
  return {
    name: 'app-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = html
          .replace('/src/apps/finscope/main.tsx', `/src/apps/${APP}/main.tsx`)
          .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
        // In a build, a secondary app restores the path that the root 404.html moved into the query.
        return !ctx.server && APP !== 'finscope' ? page.replace('<head>', `<head>${restorePathScript}`) : page
      },
    },
  }
}

/**
 * Static hosts such as GitHub Pages answer unknown paths (e.g. /tables opened directly or refreshed) with 404.html.
 * Serving the app shell there lets the router take over and render the right page.
 */
function spaFallbackPlugin(): Plugin {
  let outDir = 'dist'
  let base = '/'
  return {
    name: 'finscope-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      base = config.base
    },
    closeBundle() {
      const index = path.join(outDir, 'index.html')
      if (!fs.existsSync(index)) return
      const page = fs.readFileSync(index, 'utf8')
      // The site root also answers for the secondary apps (see sendToAppScript).
      fs.writeFileSync(path.join(outDir, '404.html'), APP === 'finscope' ? page.replace('<head>', `<head>${sendToAppScript(base)}`) : page)
    },
  }
}

export default defineConfig(({ command }) => {
  // BASE_PATH is set when deploying under a sub-path, e.g. BASE_PATH=/my-repo/ for https://user.github.io/my-repo/.
  const base = process.env.BASE_PATH || '/'
  // The first app owns the site root; every other app is built into dist/<app>/ and served under <base><app>/.
  const secondary = APP !== 'finscope'
  return {
    base: command === 'build' && secondary ? `${base}${APP}/` : base,
    build: { outDir: secondary ? `dist/${APP}` : 'dist' },
    plugins: [react(), appEntryPlugin(), saveConfigPlugin(), spaFallbackPlugin()],
    resolve: { alias: { '@': path.resolve(root, 'src') } },
  }
})
