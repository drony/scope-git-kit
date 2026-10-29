import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * Dev-only endpoint used by the Theme & Settings screen ("Save to project").
 * It writes the posted JSON to src/config/app.config.json and nothing else.
 * It never exists in a production build (`apply: 'serve'`).
 */
function saveConfigPlugin(): Plugin {
  const target = path.resolve(root, 'src/config/app.config.json')
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
            send(200, { ok: true, path: 'src/config/app.config.json' })
          } catch (e) {
            send(400, { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' })
          }
        })
      })
    },
  }
}

/**
 * Static hosts such as GitHub Pages answer unknown paths (e.g. /tables opened directly or refreshed) with 404.html.
 * Serving the app shell there lets the router take over and render the right page.
 */
function spaFallbackPlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'finscope-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = path.join(outDir, 'index.html')
      if (fs.existsSync(index)) fs.copyFileSync(index, path.join(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  // BASE_PATH is set when deploying under a sub-path, e.g. BASE_PATH=/my-repo/ for https://user.github.io/my-repo/.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), saveConfigPlugin(), spaFallbackPlugin()],
  resolve: { alias: { '@': path.resolve(root, 'src') } },
})
