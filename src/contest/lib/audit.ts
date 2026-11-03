/**
 * The audit trail as plain functions: what an entry says in words, whether it is a sensitive one, what changed field by field,
 * whether it can be reverted and what a revert would also undo, how to filter and group the trail, and how to export it. The trail
 * is append-only: nothing here edits an entry.
 */
import type { AuditEntity, AuditEntry, Id } from '../data/types'
import { dayLabel } from './dates'

export const ENTITY_LABEL: Record<AuditEntity, string> = {
  contest: 'Contest',
  question: 'Question',
  'answer-key': 'Answer key',
  media: 'Media',
  score: 'Score',
  announcement: 'Announcement',
  participant: 'Participant',
  episode: 'Show',
  survey: 'Survey',
  program: 'Program',
  report: 'Report',
  gate: 'Version gate',
  pack: 'Content pack',
  topic: 'Topic',
}

export const ACTION_LABEL: Record<AuditEntry['action'], string> = { create: 'Created', update: 'Changed', delete: 'Deleted', publish: 'Published', revert: 'Reverted' }

/** Why an entry deserves a second look, or undefined for an ordinary one. */
export function sensitivity(e: Pick<AuditEntry, 'entity' | 'action' | 'summary'>): string | undefined {
  if (e.action === 'delete') return 'Something was deleted.'
  if (e.action === 'revert') return 'A change was undone.'
  if (e.entity === 'gate') return /emergency/i.test(e.summary) ? 'An emergency change to the version gate: it stopped people who were playing.' : 'It changes which builds of the app may play.'
  if (e.entity === 'pack') return 'It changes the questions the shows are served from.'
  if (e.entity === 'report' && /Disqualified|Suspended/.test(e.summary)) return 'A decision with consequences for a player.'
  if (e.entity === 'participant' && /disqualified/i.test(e.summary)) return 'A person was disqualified.'
  return undefined
}

/* ---- Revert ------------------------------------------------------------------------------------------------------- */

export interface RevertRule {
  can: boolean
  /** Why not, in words for the person who asked. */
  why?: string
}

const KEPT = (what: string) => `Changes to ${what} are kept for the record and cannot be reverted yet.`

/** Whether an entry can be reverted. It follows the rules of the adapter: questions, answer keys, media and the contest. */
export function revertRule(e: AuditEntry): RevertRule {
  if (e.action === 'revert') return { can: false, why: 'A revert is part of the record. To undo it, make the change again.' }
  switch (e.entity) {
    case 'question':
      return e.action === 'create' || e.before !== undefined ? { can: true } : { can: false, why: 'This entry kept no earlier version of the question.' }
    case 'answer-key':
      return { can: true }
    case 'media':
      return e.action === 'create' || e.before !== undefined ? { can: true } : { can: false, why: 'This entry kept no earlier version of the file.' }
    case 'contest':
      return e.before !== undefined ? { can: true } : { can: false, why: 'This entry kept no earlier version of the contest.' }
    case 'participant':
    case 'score':
      return { can: false, why: KEPT('people and scores') }
    case 'announcement':
      return { can: false, why: KEPT('announcements') }
    case 'episode':
    case 'program':
      return { can: false, why: KEPT('shows and the program') }
    case 'gate':
    case 'pack':
    case 'topic':
      return { can: false, why: `${ENTITY_LABEL[e.entity]} changes are not reverted. Make a new change: it is a new revision and the history stays whole.` }
    default:
      return { can: false, why: KEPT(ENTITY_LABEL[e.entity].toLowerCase() + 's') }
  }
}

/** The entries that changed the same thing, newest first. */
export function relatedTo(e: AuditEntry, entries: AuditEntry[]): AuditEntry[] {
  return entries.filter((x) => x.entity === e.entity && x.entityId === e.entityId && x.id !== e.id).sort((a, b) => b.at.localeCompare(a.at))
}

/** The entry that reverted this one, if it was reverted. */
export const revertedBy = (e: AuditEntry, entries: AuditEntry[]) => entries.find((x) => x.of === e.id)

/** Changes made after this entry to the same thing, not counting reverts. A revert puts the thing back as it was before this entry, so these are undone too. */
export const laterChanges = (e: AuditEntry, entries: AuditEntry[]) => relatedTo(e, entries).filter((x) => x.at > e.at && x.action !== 'revert')

/* ---- What changed ------------------------------------------------------------------------------------------------- */

export interface FieldChange {
  path: string
  label: string
  kind: 'changed' | 'added' | 'removed'
  from?: string
  to?: string
  /** For a list of things with ids: what was added, removed or changed in it. */
  detail?: string[]
}

const IGNORE = new Set(['id', 'updatedAt', 'savedAt', 'createdAt', 'history', 'availableBuilds', 'url', 'since'])
const LABELS: Record<string, string> = {
  prompt: 'Question',
  timeLimitSec: 'Time limit (s)',
  mediaIds: 'Media',
  difficulty: 'Level',
  explanation: 'Explanation',
  hint: 'Hint',
  tags: 'Topics and tags',
  points: 'Points',
  status: 'Status',
  options: 'Options',
  minBuild: 'Minimum build',
  recommendedBuild: 'Suggested build',
  blockedBuilds: 'Blocked builds',
  updateUrl: 'Update link',
  effectiveAt: 'Starts at',
  stage: 'Stage',
  preapprovedBy: 'First reviewer',
  quota: 'Quota',
  seats: 'Final seats',
  lengthMin: 'Length (min)',
  startsAt: 'Starts at',
  slotMin: 'Slot (min)',
  channels: 'Channels',
  scheduledAt: 'Scheduled for',
  sentAt: 'Sent at',
}

const humanize = (key: string) => LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase())
const labelOf = (path: string) => (path.includes('.') ? path.split('.').slice(-2).map(humanize).join(' › ') : humanize(path))

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** A value as a short phrase: dates read as dates, long text is cut, lists are joined. */
export function formatValue(v: unknown, max = 140): string {
  if (v === undefined || v === null || v === '') return '(none)'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') {
    if (ISO.test(v)) return new Date(v).toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    return v.length > max ? `${v.slice(0, max - 1)}…` : v
  }
  if (Array.isArray(v)) return v.length === 0 ? '(empty)' : v.map((x) => (isPlain(x) ? nameOfItem(x) : formatValue(x, 40))).join(', ')
  if (isPlain(v)) {
    const parts = Object.entries(v)
      .filter(([, x]) => x !== undefined && x !== null && x !== '')
      .slice(0, 3)
      .map(([k, x]) => `${k}: ${formatValue(x, 30)}`)
    return parts.join(', ') || '(empty)'
  }
  return String(v)
}

const nameOfItem = (o: Record<string, unknown>): string => String(o.label ?? o.title ?? o.name ?? o.prompt ?? o.text ?? o.questionId ?? o.store ?? o.id ?? JSON.stringify(o).slice(0, 40))
const keyOf = (o: Record<string, unknown>): string | undefined => {
  const k = o.id ?? o.questionId ?? o.store
  return k === undefined ? undefined : String(k)
}

/** What differs between two versions of one item of a list, as short phrases: "Minimum build 372 → 376". At most three. */
function itemChanges(a: Record<string, unknown>, b: Record<string, unknown>): string {
  const phrases: string[] = []
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (IGNORE.has(k) && k !== 'url') continue
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) phrases.push(`${humanize(k)} ${formatValue(a[k], 30)} → ${formatValue(b[k], 30)}`)
  }
  return phrases.slice(0, 3).join(', ')
}

interface Leaf {
  value: unknown
  /** A list of things with ids: compared by id. */
  keyed?: Map<string, unknown>
}

function flatten(value: unknown, path: string, out: Map<string, Leaf>): void {
  if (isPlain(value)) {
    for (const [k, v] of Object.entries(value)) if (!IGNORE.has(k)) flatten(v, path ? `${path}.${k}` : k, out)
    return
  }
  if (Array.isArray(value) && value.length > 0 && value.every((x) => isPlain(x) && keyOf(x) !== undefined)) {
    out.set(path, { value, keyed: new Map(value.map((x) => [keyOf(x as Record<string, unknown>)!, x])) })
    return
  }
  out.set(path, { value })
}

/** The snapshot in an entry as the thing itself: a delete keeps `{ question, key }`, and the question is what people mean. */
const unwrap = (v: unknown) => (isPlain(v) && 'question' in v && isPlain(v.question) ? v.question : v)

/**
 * What an entry changed, field by field, as phrases a person can read. Fields that always change (times, ids) are left out. A
 * list of things with ids is compared by id: it says what was added, removed or changed in it. A create or a delete lists the
 * values the thing has (the first twelve).
 */
export function diffEntry(e: Pick<AuditEntry, 'before' | 'after'>): FieldChange[] {
  const before = new Map<string, Leaf>()
  const after = new Map<string, Leaf>()
  const root = (v: unknown) => (Array.isArray(v) ? { entries: v } : v)
  flatten(root(unwrap(e.before)), '', before)
  flatten(root(unwrap(e.after)), '', after)
  before.delete('')
  after.delete('')
  const out: FieldChange[] = []
  const paths = [...new Set([...before.keys(), ...after.keys()])]
  for (const path of paths) {
    const a = before.get(path)
    const b = after.get(path)
    if (a?.keyed && b?.keyed) {
      const detail: string[] = []
      for (const [id, item] of b.keyed) {
        if (!a.keyed.has(id)) detail.push(`Added: ${nameOfItem(item as Record<string, unknown>)}`)
        else if (JSON.stringify(a.keyed.get(id)) !== JSON.stringify(item)) {
          const was = a.keyed.get(id) as Record<string, unknown>
          const now = item as Record<string, unknown>
          detail.push(nameOfItem(was) !== nameOfItem(now) ? `Changed: ${nameOfItem(was)} → ${nameOfItem(now)}` : `Changed: ${nameOfItem(now)} (${itemChanges(was, now)})`)
        }
      }
      for (const [id, item] of a.keyed) if (!b.keyed.has(id)) detail.push(`Removed: ${nameOfItem(item as Record<string, unknown>)}`)
      if (detail.length) out.push({ path, label: labelOf(path), kind: 'changed', detail })
    } else if (a && !b) out.push({ path, label: labelOf(path), kind: 'removed', from: formatValue(a.value) })
    else if (!a && b) out.push({ path, label: labelOf(path), kind: 'added', to: formatValue(b.value) })
    else if (a && b && JSON.stringify(a.value) !== JSON.stringify(b.value)) out.push({ path, label: labelOf(path), kind: 'changed', from: formatValue(a.value), to: formatValue(b.value) })
  }
  return out.length > 12 && (!e.before || !e.after) ? out.slice(0, 12) : out
}

/* ---- Filtering, grouping, activity -------------------------------------------------------------------------------- */

export type SincePreset = 'all' | 'today' | '7d' | '30d'

export interface AuditFilter {
  actor?: string
  entities: AuditEntity[]
  actions: AuditEntry['action'][]
  since: SincePreset
  query: string
  sensitiveOnly: boolean
  /** One day only, "YYYY-MM-DD" in local time. It replaces `since`. */
  day?: string
}

export const EMPTY_FILTER: AuditFilter = { entities: [], actions: [], since: 'all', query: '', sensitiveOnly: false }

const DAY = 86_400_000
const startOfDay = (ms: number) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** The entries that pass the filter. Order is kept. */
export function filterAudit(entries: AuditEntry[], f: AuditFilter, now: number): AuditEntry[] {
  const from = f.since === 'today' ? startOfDay(now) : f.since === '7d' ? startOfDay(now) - 6 * DAY : f.since === '30d' ? startOfDay(now) - 29 * DAY : 0
  const q = f.query.trim().toLowerCase()
  return entries.filter(
    (e) =>
      (!f.actor || e.actor === f.actor) &&
      (f.entities.length === 0 || f.entities.includes(e.entity)) &&
      (f.actions.length === 0 || f.actions.includes(e.action)) &&
      (f.day ? localDate(Date.parse(e.at)) === f.day : Date.parse(e.at) >= from) &&
      (!f.sensitiveOnly || sensitivity(e) !== undefined) &&
      (!q || `${e.summary} ${e.actor} ${e.entityId} ${ENTITY_LABEL[e.entity]}`.toLowerCase().includes(q)),
  )
}

export const isFiltered = (f: AuditFilter) => f.day !== undefined || f.actor !== undefined || f.entities.length > 0 || f.actions.length > 0 || f.since !== 'all' || f.query.trim() !== '' || f.sensitiveOnly

export interface DayGroup {
  label: string
  entries: AuditEntry[]
}

/** The entries in groups by day, "Today", "Yesterday" and then the date. Order is kept. */
export function groupByDay(entries: AuditEntry[], now: number): DayGroup[] {
  const out: DayGroup[] = []
  for (const e of entries) {
    const label = dayLabel(e.at, new Date(now))
    const last = out[out.length - 1]
    if (last && last.label === label) last.entries.push(e)
    else out.push({ label, entries: [e] })
  }
  return out
}

export interface DayActivity {
  /** "YYYY-MM-DD" in local time. */
  date: string
  label: string
  count: number
  sensitive: number
}

const pad = (n: number) => String(n).padStart(2, '0')
export const localDate = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** How many changes were made on each of the last `days` days, and how many of them were sensitive. Oldest first. */
export function activityByDay(entries: AuditEntry[], days: number, now: number): DayActivity[] {
  const today = startOfDay(now)
  const out: DayActivity[] = Array.from({ length: days }, (_, i) => {
    const ms = today - (days - 1 - i) * DAY
    return { date: localDate(ms), label: new Date(ms).toLocaleDateString('en', { month: 'short', day: 'numeric' }), count: 0, sensitive: 0 }
  })
  for (const e of entries) {
    const slot = out.find((d) => d.date === localDate(Date.parse(e.at)))
    if (slot) {
      slot.count += 1
      if (sensitivity(e)) slot.sensitive += 1
    }
  }
  return out
}

/** The kinds of thing in a few groups, so a filter has six buttons and not fourteen. */
export const ENTITY_GROUPS: { id: string; label: string; entities: AuditEntity[] }[] = [
  { id: 'questions', label: 'Questions', entities: ['question', 'answer-key'] },
  { id: 'media', label: 'Media', entities: ['media'] },
  { id: 'people', label: 'People', entities: ['participant', 'score', 'report'] },
  { id: 'shows', label: 'Shows', entities: ['episode', 'program', 'survey', 'announcement', 'contest'] },
  { id: 'rules', label: 'Rules', entities: ['gate', 'pack', 'topic'] },
]

export const actorsOf = (entries: AuditEntry[]) => [...new Set(entries.map((e) => e.actor))].sort()

/* ---- Export ------------------------------------------------------------------------------------------------------- */

/** A cell that a spreadsheet would read as a formula starts with an apostrophe, so an export cannot run anything. */
const cell = (v: string) => {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** The entries as CSV: time, who, what kind of thing, which one, what was done, what was said, and why it is sensitive. */
export function auditToCsv(entries: AuditEntry[]): string {
  const head = ['Time', 'Who', 'Kind', 'Id', 'Action', 'What', 'Sensitive']
  const rows = entries.map((e) => [e.at, e.actor, ENTITY_LABEL[e.entity], e.entityId, ACTION_LABEL[e.action], e.summary, sensitivity(e) ?? ''])
  return [head, ...rows].map((r) => r.map((c) => cell(String(c))).join(',')).join('\n')
}

export const findEntry = (entries: AuditEntry[], id: Id | null | undefined) => entries.find((e) => e.id === id)
