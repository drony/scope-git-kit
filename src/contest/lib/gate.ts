/**
 * The version gate as plain functions: what a build is told, how many players that touches, what a change to the gate would
 * do before it is saved, and what is wrong with it. The same rules run on the screen and on the server, so the number on the
 * button is the number that happens.
 */
import type { BuildUsage, StoreGate, StoreId, VersionGate } from '../data/types'

export const STORES: { id: StoreId; label: string }[] = [
  { id: 'app-store', label: 'App Store' },
  { id: 'testflight', label: 'TestFlight' },
  { id: 'play-store', label: 'Google Play' },
]

export const storeName = (id: StoreId) => STORES.find((s) => s.id === id)!.label

export type Verdict = 'ok' | 'recommended' | 'required' | 'blocked'

/** What a build is told: carry on, a prompt it can close, an update it cannot skip, or "this version is stopped". */
export function verdictOf(gate: Pick<StoreGate, 'minBuild' | 'recommendedBuild' | 'blockedBuilds'>, build: number): Verdict {
  if (gate.blockedBuilds.includes(build)) return 'blocked'
  if (build < gate.minBuild) return 'required'
  if (build < gate.recommendedBuild) return 'recommended'
  return 'ok'
}

/** Whether a person on this verdict can play. */
export const canPlay = (v: Verdict) => v === 'ok' || v === 'recommended'

export const VERDICT_TEXT: Record<Verdict, { label: string; hint: string }> = {
  ok: { label: 'Current', hint: 'Plays as usual.' },
  recommended: { label: 'Update suggested', hint: 'Plays, and sees a prompt that can be closed.' },
  required: { label: 'Update required', hint: 'Below the minimum: cannot play until it is updated.' },
  blocked: { label: 'Stopped', hint: 'A build that is switched off, even though it is above the minimum.' },
}

export interface Impact {
  total: number
  ok: number
  recommended: number
  required: number
  blocked: number
}

/** How many players each verdict touches, for one store. */
export function usageImpact(gate: StoreGate, usage: BuildUsage[]): Impact {
  const out: Impact = { total: 0, ok: 0, recommended: 0, required: 0, blocked: 0 }
  for (const u of usage.filter((x) => x.store === gate.store)) {
    out[verdictOf(gate, u.build)] += u.players
    out.total += u.players
  }
  return out
}

/** Players who cannot play: below the minimum, or on a stopped build. */
export const stopped = (i: Impact) => i.required + i.blocked
export const percent = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0)

/** Reads "379, 381 383" into build numbers. Anything that is not a whole number is returned in `invalid`. */
export function parseBuilds(text: string): { builds: number[]; invalid: string[] } {
  const tokens = text.split(/[\s,;]+/).filter(Boolean)
  const builds: number[] = []
  const invalid: string[] = []
  for (const t of tokens) {
    if (/^\d{1,7}$/.test(t)) builds.push(Number(t))
    else invalid.push(t)
  }
  return { builds: [...new Set(builds)].sort((a, b) => a - b), invalid }
}

/* ---- Problems ------------------------------------------------------------------------------------------------------ */

export interface GateProblem {
  level: 'error' | 'warning'
  store?: StoreId
  text: string
}

const newest = (g: StoreGate) => Math.max(0, ...g.availableBuilds)

/** What is wrong with a gate, errors first. An error stops the save; a warning is shown and can be saved over. */
export function gateProblems(gate: VersionGate, usage: BuildUsage[]): GateProblem[] {
  const out: GateProblem[] = []
  for (const g of gate.stores) {
    const name = storeName(g.store)
    const top = newest(g)
    if (g.recommendedBuild < g.minBuild) out.push({ level: 'error', store: g.store, text: `${name}: the suggested build (${g.recommendedBuild}) is below the minimum (${g.minBuild}).` })
    if (top > 0 && g.minBuild > top) out.push({ level: 'error', store: g.store, text: `${name}: the newest build in the store is ${top}, below the minimum (${g.minBuild}). Everybody would be locked out.` })
    else if (top > 0 && g.recommendedBuild > top) out.push({ level: 'error', store: g.store, text: `${name}: the suggested build (${g.recommendedBuild}) is not in the store yet. The newest is ${top}.` })
    if (g.availableBuilds.length > 0 && g.availableBuilds.every((b) => g.blockedBuilds.includes(b))) out.push({ level: 'error', store: g.store, text: `${name}: every build in the store is blocked. Nobody could play.` })
    else if (g.availableBuilds.some((b) => g.blockedBuilds.includes(b) && b >= g.minBuild)) out.push({ level: 'warning', store: g.store, text: `${name}: a build that people can still download is blocked (${g.blockedBuilds.filter((b) => g.availableBuilds.includes(b)).join(', ')}).` })
    if (!/^https:\/\/\S+$/.test(g.updateUrl)) out.push({ level: 'error', store: g.store, text: `${name}: the update link must start with https://.` })
    const total = usageImpact(g, usage)
    const share = percent(stopped(total), total.total)
    if (share >= 50) out.push({ level: 'warning', store: g.store, text: `${name}: ${share}% of the players would be stopped.` })
  }
  if (!gate.message.trim()) out.push({ level: 'error', text: 'Write the message players see on the update screen.' })
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

/* ---- Review before a save ----------------------------------------------------------------------------------------- */

export interface StoreReview {
  store: StoreId
  changed: boolean
  before: Impact
  after: Impact
  /** Players who can play now and could not after the change. Negative when the change lets people back in. */
  newlyStopped: number
}

export interface GateReview {
  stores: StoreReview[]
  /** Anything that differs at all. */
  changed: boolean
  /** The editor has to confirm: it is an emergency, or a store would stop a tenth of its players or more. */
  needsConfirm: boolean
  reasons: string[]
  /** Warnings about the time it starts at. */
  timing: string[]
}

export interface ShowWindow {
  title: string
  at: number
  endsAt: number
}

const same = (a: StoreGate, b: StoreGate) => a.minBuild === b.minBuild && a.recommendedBuild === b.recommendedBuild && a.updateUrl === b.updateUrl && a.blockedBuilds.join() === b.blockedBuilds.join()

/**
 * What saving `next` over `prev` does to the people who use the app now: how many are stopped before and after, per store. It
 * also says why the editor must confirm and whether the start time falls in a show. A show is "in the way" from half an hour
 * before it starts until it ends.
 */
export function reviewGate(prev: VersionGate, next: VersionGate, usage: BuildUsage[], now: number, shows: ShowWindow[] = []): GateReview {
  const stores = next.stores.map((g): StoreReview => {
    const was = prev.stores.find((p) => p.store === g.store)
    const before = was ? usageImpact(was, usage) : usageImpact(g, usage)
    const after = usageImpact(g, usage)
    return { store: g.store, changed: Boolean(was) && !same(was!, g), before, after, newlyStopped: stopped(after) - stopped(before) }
  })
  const reasons: string[] = []
  if (next.emergency) reasons.push('It is an emergency: it applies at once and stops people who are playing now.')
  for (const s of stores) {
    const share = percent(s.newlyStopped, s.after.total)
    if (s.newlyStopped > 0 && share >= 10) reasons.push(`${storeName(s.store)}: ${s.newlyStopped.toLocaleString('en')} more players (${share}%) could not play.`)
  }
  const timing: string[] = []
  const at = next.effectiveAt ? Date.parse(next.effectiveAt) : now
  if (!next.emergency) {
    const show = shows.find((s) => at >= s.at - 30 * 60_000 && at < s.endsAt)
    if (show) timing.push(`It starts during ${show.title}. People on old builds would be stopped in the middle of a show. Pick a time after it.`)
  }
  const changed = next.message !== prev.message || next.emergency !== prev.emergency || (next.effectiveAt ?? '') !== (prev.effectiveAt ?? '') || stores.some((s) => s.changed)
  return { stores, changed, needsConfirm: reasons.length > 0, reasons, timing }
}

/** The gate that is in force at `now`: the scheduled one once its time has come. */
export function gateInForce(current: VersionGate, next: VersionGate | undefined, now: number): VersionGate {
  return next?.effectiveAt && Date.parse(next.effectiveAt) <= now ? next : current
}

/** What a person on a given store and build is told, by the gate in force. A store the gate does not know lets everyone play. */
export function verdictFor(gate: VersionGate, store: StoreId, build: number): Verdict {
  const g = gate.stores.find((x) => x.store === store)
  return g ? verdictOf(g, build) : 'ok'
}
