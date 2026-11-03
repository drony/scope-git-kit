#!/usr/bin/env node
/**
 * Enforces the project's layers. Run with `npm run check:layers` (also part of `npm run check` and `npm run build`).
 *
 *   kit      Reusable design system, no domain knowledge. Must not depend on contest, any app, or its seed data.
 *   contest  Reusable contest-platform components and data layer. May use the kit. Must not depend on any app.
 *   apps/X   One product (its pages, layout, theme, seed). May use kit and contest. Must not use another app.
 *   seed     Fictional data only (src/apps/X/seed). Plain TypeScript: no React, no UI, only types from the kit and contest.
 *
 * Why: the kit is meant to be copied into other projects. One stray import of app code would break that.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))

/** Every module specifier a file imports, with whether it is a type-only import. */
function imports(source) {
  const found = []
  const re = /(?:import|export)\s+(type\s+)?(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
  for (const m of source.matchAll(re)) found.push({ spec: m[2] ?? m[3], typeOnly: Boolean(m[1]) })
  return found
}

/** Resolves '@/…' and relative specifiers to a path under src/, or null for packages. */
function resolve(spec, fromFile) {
  if (spec.startsWith('@/')) return spec.slice(2)
  if (spec.startsWith('.')) return path.relative(SRC, path.resolve(path.dirname(fromFile), spec)).split(path.sep).join('/')
  return null
}

const appOf = (rel) => rel.match(/^apps\/([^/]+)\//)?.[1] ?? null

const rules = [
  {
    applies: (rel) => rel.startsWith('kit/'),
    forbids: (target) => target.startsWith('apps/') || target.startsWith('contest/'),
    message: 'the kit must not import contest or an app; pass data in through props or providers',
  },
  {
    applies: (rel) => rel.startsWith('contest/'),
    forbids: (target) => target.startsWith('apps/'),
    message: 'the contest layer must not import an app; pass data in through props, providers or the adapter',
  },
  {
    applies: (rel) => appOf(rel) !== null,
    forbids: (target, _typeOnly, rel) => {
      const other = target.match(/^apps\/([^/]+)\//)?.[1]
      return Boolean(other) && other !== appOf(rel)
    },
    message: 'an app must not import another app; share code by moving it into kit or contest',
  },
  {
    applies: (rel) => /^apps\/[^/]+\/seed\//.test(rel),
    forbids: (target, typeOnly) =>
      /^apps\/[^/]+\/(pages|layout|components)\//.test(target) ||
      ((target.startsWith('kit/components/') || target.startsWith('contest/components/')) && !typeOnly) ||
      target.startsWith('kit/context/'),
    message: 'seed data is plain data: no pages or layout, and only `import type` from kit and contest components',
  },
]

const problems = []
for (const file of walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f))) {
  const rel = path.relative(SRC, file).split(path.sep).join('/')
  const source = fs.readFileSync(file, 'utf8')
  for (const rule of rules.filter((r) => r.applies(rel))) {
    for (const { spec, typeOnly } of imports(source)) {
      const target = resolve(spec, file)
      if (target && rule.forbids(target, typeOnly, rel)) problems.push(`  src/${rel}\n    imports '${spec}': ${rule.message}`)
    }
  }
  if (/^apps\/[^/]+\/seed\//.test(rel) && /from ['"]react(-dom)?['"]/.test(source)) problems.push(`  src/${rel}\n    imports React: seed data must not render anything`)
}

if (problems.length) {
  console.error(`Layer check failed (${problems.length}):\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('Layer check passed: kit < contest < apps, apps stay apart, and seed data stays plain.')
