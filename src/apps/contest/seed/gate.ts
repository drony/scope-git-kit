/**
 * Fictional data for the version gate: the rule in force for three stores, how many players use each build, and which build each
 * demo participant plays on. The player counts are made from a fixed seed and lean to the newest builds, so every visitor sees
 * the same picture. Plain data: nothing here renders anything.
 */
import type { BuildUsage, ClientInfo, StoreGate, StoreId, VersionGate } from '@/contest/data/types'
import { mulberry32 } from '@/kit/lib/random'
import { day } from './time'

const stores: StoreGate[] = [
  { store: 'app-store', minBuild: 376, recommendedBuild: 388, blockedBuilds: [379], updateUrl: 'https://apps.example.test/ios/contest-scope', availableBuilds: [388, 389, 390] },
  { store: 'testflight', minBuild: 380, recommendedBuild: 391, blockedBuilds: [], updateUrl: 'https://testflight.example.test/join/contest-scope', availableBuilds: [391, 392] },
  { store: 'play-store', minBuild: 130, recommendedBuild: 141, blockedBuilds: [133], updateUrl: 'https://play.example.test/store/apps/contest-scope', availableBuilds: [141, 142, 143] },
]

export const GATE: VersionGate = {
  id: 'gate',
  revision: 3,
  stores,
  message: 'A new version of the app is ready. Update to keep playing the live shows with everyone else.',
  emergency: false,
  savedAt: day(-6, 10),
  savedBy: 'Ada',
}

/** The oldest build still in use and the newest one, per store, and how many players there are. */
const SHAPE: Record<StoreId, { from: number; to: number; players: number }> = {
  'app-store': { from: 372, to: 390, players: 4800 },
  testflight: { from: 380, to: 392, players: 320 },
  'play-store': { from: 125, to: 143, players: 2900 },
}

export function buildUsage(): BuildUsage[] {
  const rand = mulberry32(81)
  const out: BuildUsage[] = []
  for (const [store, { from, to, players }] of Object.entries(SHAPE) as [StoreId, (typeof SHAPE)[StoreId]][]) {
    const weights = Array.from({ length: to - from + 1 }, (_, i) => Math.exp(i / 3.5) * (0.8 + 0.4 * rand()))
    const sum = weights.reduce((a, b) => a + b, 0)
    weights.forEach((w, i) => out.push({ store, build: from + i, players: Math.max(3, Math.round((players * w) / sum)) }))
  }
  return out
}

/** Which app each demo participant plays on: most are current, a few are behind, one is below the minimum and one is on a stopped build. */
export const CLIENTS: Record<string, ClientInfo> = {
  p1: { store: 'app-store', build: 389 },
  p2: { store: 'app-store', build: 388 },
  p3: { store: 'testflight', build: 391 },
  p4: { store: 'app-store', build: 381 },
  p5: { store: 'play-store', build: 140 },
  p6: { store: 'app-store', build: 377 },
  p7: { store: 'app-store', build: 374 },
  p8: { store: 'app-store', build: 389 },
  p9: { store: 'app-store', build: 379 },
  p10: { store: 'play-store', build: 135 },
  p11: { store: 'app-store', build: 388 },
  p12: { store: 'app-store', build: 390 },
}
