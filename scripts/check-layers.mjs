#!/usr/bin/env node
/**
 * Enforces the project's layers. Run with `npm run check:layers` (also part of `npm run check` and `npm run build`).
 *
 *   kit   Reusable design system. Must not depend on the demo, the seed data or the project's config.
 *   demo  The demo app. May use the kit and the seed data.
 *   seed  Fictional data only (src/demo/seed). Plain TypeScript: no React, no UI, only types from the kit.
 *
 * Why: the kit is meant to be copied into other projects. One stray import of demo code would break that.
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

const rules = [
  {
    applies: (rel) => rel.startsWith('kit/'),
    forbids: (target) => target.startsWith('demo/') || target === 'config' || target.startsWith('config/'),
    message: 'the kit must not import the demo or the project config; pass data in through props or providers',
  },
  {
    applies: (rel) => rel.startsWith('demo/seed/'),
    forbids: (target, typeOnly) =>
      target.startsWith('demo/pages/') ||
      target.startsWith('demo/layout/') ||
      target.startsWith('demo/components/') ||
      (target.startsWith('kit/components/') && !typeOnly) ||
      target.startsWith('kit/context/'),
    message: 'seed data is plain data: no pages or layout, and only `import type` from kit components',
  },
]

const problems = []
for (const file of walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f))) {
  const rel = path.relative(SRC, file).split(path.sep).join('/')
  const source = fs.readFileSync(file, 'utf8')
  for (const rule of rules.filter((r) => r.applies(rel))) {
    for (const { spec, typeOnly } of imports(source)) {
      const target = resolve(spec, file)
      if (target && rule.forbids(target, typeOnly)) problems.push(`  src/${rel}\n    imports '${spec}': ${rule.message}`)
    }
  }
  if (rel.startsWith('demo/seed/') && /from ['"]react(-dom)?['"]/.test(source)) problems.push(`  src/${rel}\n    imports React: seed data must not render anything`)
}

if (problems.length) {
  console.error(`Layer check failed (${problems.length}):\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('Layer check passed: the kit does not depend on the demo, and seed data stays plain.')
