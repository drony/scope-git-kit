/**
 * Fictional audit trail: about thirty changes over the last weeks by four people, written from the seed itself so the snapshots
 * match what is in the demo (the "after" of the newest entry about a thing is the thing as it is now). It has every kind of entry:
 * edits with a before and an after, approvals, returns, a deletion, decisions about reports, a gate change, a pack, a program, and
 * one change that was reverted. Newest first, as the adapter writes it. Plain data: nothing here renders anything.
 */
import type { AuditEntry, ContentPack, Contest, MediaAsset, Participant, Question, Report, Topic, VersionGate, WeeklyProgram } from '@/contest/data/types'
import { day } from './time'

interface Seed {
  questions: Question[]
  participants: Participant[]
  media: MediaAsset[]
  contest: Contest
  program: WeeklyProgram
  gate: VersionGate
  packs: ContentPack[]
  topics: Topic[]
  reports: Report[]
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const short = (text: string, n = 48) => (text.length > n ? `${text.slice(0, n - 1)}…` : text)

export function seedAudit(s: Seed): AuditEntry[] {
  const out: AuditEntry[] = []
  let n = 0
  const add = (ago: number, hour: number, actor: string, e: Omit<AuditEntry, 'id' | 'at' | 'actor'>) => out.push({ id: `au-${++n}`, at: day(-ago, hour), actor, ...e })
  const q = (id: string) => s.questions.find((x) => x.id === id)!
  const person = (id: string) => s.participants.find((p) => p.id === id)!

  // question edits: the "after" is the question as it is now, the "before" an earlier version
  const edit = (id: string, ago: number, hour: number, actor: string, earlier: Partial<Question>) => {
    const now = q(id)
    add(ago, hour, actor, { entity: 'question', entityId: id, action: 'update', summary: `Edited question "${short(now.prompt)}"`, before: { ...clone(now), ...earlier }, after: clone(now) })
  }
  edit('q23', 1, 15, 'Dev', { timeLimitSec: 30, points: 15 })
  edit('q6', 2, 11, 'Cleo', { hint: undefined, points: 10 })
  edit('q21', 3, 16, 'Bo', { tags: ['science'], difficulty: 3 })
  edit('q27', 5, 10, 'Dev', { timeLimitSec: 20 })
  edit('q14', 6, 14, 'Cleo', { explanation: 'Gold has the symbol Au.' })
  edit('q3', 12, 9, 'Bo', { points: 10 })

  // review decisions, with the question before and after
  const review = (id: string, ago: number, hour: number, actor: string, verb: string, action: AuditEntry['action'], beforePatch: Partial<Question>) => {
    const now = q(id)
    add(ago, hour, actor, { entity: 'question', entityId: id, action, summary: `${verb}: "${short(now.prompt)}"`, before: { ...clone(now), ...beforePatch }, after: clone(now) })
  }
  review('q43', 2, 9, 'Dev', 'Returned', 'update', { status: 'ready', review: { ...q('q43').review!, stage: 'pending', note: undefined } })
  review('q42', 3, 12, 'Cleo', 'Returned', 'update', { status: 'ready', review: { ...q('q42').review!, stage: 'pending', note: undefined } })
  review('q44', 9, 10, 'Dev', 'Moved to trash', 'update', { review: { ...q('q44').review!, stage: 'draft' } })
  review('q45', 7, 10, 'Bo', 'Moved to trash', 'update', { review: { ...q('q45').review!, stage: 'draft' } })
  review('q46', 10, 16, 'Ada', 'Approved', 'publish', { status: 'ready', review: { ...q('q46').review!, stage: 'preapproved' } })
  review('q38', 0, 8, 'Ada', 'Sent for review', 'update', { status: 'draft', review: { ...q('q38').review!, stage: 'draft' } })

  // a change that was reverted: the edit, then the revert that put the question back
  const reverted = q('q9')
  const edited = { ...clone(reverted), points: reverted.points + 10, maxLength: 800 }
  add(4, 11, 'Bo', { entity: 'question', entityId: 'q9', action: 'update', summary: `Edited question "${short(reverted.prompt)}"`, before: clone(reverted), after: edited })
  const editId = out[out.length - 1].id
  add(4, 15, 'Ada', { entity: 'question', entityId: 'q9', action: 'revert', summary: `Reverted: Edited question "${short(reverted.prompt)}"`, of: editId })

  // an answer key and a deleted question
  add(8, 10, 'Cleo', { entity: 'answer-key', entityId: 'q5', action: 'update', summary: `Changed the answer key of "${short(q('q5').prompt)}"`, before: { type: 'text', accepted: [{ id: 'a1', text: 'Canberra', credit: 1 }], caseSensitive: false, ignoreAccents: false, ignorePunctuation: false }, after: { type: 'text', accepted: [{ id: 'a1', text: 'Canberra', credit: 1 }, { id: 'a2', text: 'Canbera', credit: 0.5 }], caseSensitive: false, ignoreAccents: true, ignorePunctuation: true } })
  add(11, 13, 'Dev', { entity: 'question', entityId: 'q99', action: 'delete', summary: 'Deleted question "A duplicate of the Titanic question"', before: { question: { ...clone(q('q37')), id: 'q99', prompt: 'A duplicate of the Titanic question', status: 'draft' }, key: null } })

  // moderation: the handled reports, one entry per decision
  const names = (id: string) => (id.startsWith('q') ? short(q(id)?.prompt ?? id) : (person(id)?.name ?? id))
  const handled = new Map<string, Report[]>()
  for (const r of s.reports.filter((x) => x.resolution)) handled.set(`${r.kind}:${r.targetId}|${r.resolution!.at}`, [...(handled.get(`${r.kind}:${r.targetId}|${r.resolution!.at}`) ?? []), r])
  for (const [, list] of handled) {
    const r = list[0]
    const res = r.resolution!
    const ago = Math.round((Date.now() - Date.parse(res.at)) / 86_400_000)
    add(ago, 14, res.by, { entity: 'report', entityId: `${r.kind}:${r.targetId}`, action: 'update', summary: `${{ dismiss: 'Dismissed', warn: 'Warned', suspend: 'Suspended', disqualify: 'Disqualified', withdraw: 'Withdrew the question' }[res.action]} ${names(r.targetId)} (${list.length} report${list.length === 1 ? '' : 's'})`, before: clone(list.map((x) => ({ ...x, resolution: undefined }))), after: clone(list) })
  }

  // the gate, the pack, the program and a topic
  const gateBefore = clone(s.gate)
  gateBefore.revision = s.gate.revision - 1
  gateBefore.stores = gateBefore.stores.map((g) => (g.store === 'app-store' ? { ...g, minBuild: 372, recommendedBuild: 386, blockedBuilds: [] } : g))
  add(6, 10, 'Ada', { entity: 'gate', entityId: s.gate.id, action: 'update', summary: `Saved version gate revision ${s.gate.revision}`, before: gateBefore, after: clone(s.gate) })
  const [r1, r2, r3] = s.packs
  add(6, 10, 'Ada', { entity: 'pack', entityId: r3.id, action: 'publish', summary: `Published pack revision ${r3.revision} with ${r3.items.length} questions`, before: clone(r2), after: clone(r3) })
  add(20, 10, 'Bo', { entity: 'pack', entityId: r2.id, action: 'publish', summary: `Published pack revision ${r2.revision} with ${r2.items.length} questions`, before: clone(r1), after: clone(r2) })
  add(40, 10, 'Cleo', { entity: 'pack', entityId: r1.id, action: 'publish', summary: `Published pack revision ${r1.revision} with ${r1.items.length} questions`, after: clone(r1) })
  const programBefore = clone(s.program)
  programBefore.revision = s.program.revision - 1
  programBefore.slots = programBefore.slots.map((x) => (x.id === 'd1' ? { ...x, time: '19:00' } : x)).filter((x) => x.id !== 'd6')
  add(9, 10, 'Ada', { entity: 'program', entityId: s.program.id, action: 'update', summary: `Saved program revision ${s.program.revision}: Mon 19:00, Sat 20:00`, before: programBefore, after: clone(s.program) })
  const sport = s.topics.find((t) => t.id === 'sport')!
  add(8, 11, 'Bo', { entity: 'topic', entityId: 'sport', action: 'update', summary: `Archived topic ${sport.name}`, before: { ...clone(sport), archived: false }, after: clone(sport) })

  // media, the contest, a person
  const picture = s.media[s.media.length - 1]
  add(13, 9, 'Cleo', { entity: 'media', entityId: picture.id, action: 'create', summary: `Uploaded image "${short(picture.name)}"`, after: { ...clone(picture), url: '(file)' } })
  const flagged = s.media.find((m) => m.moderation === 'flagged')
  if (flagged) add(5, 12, 'Cleo', { entity: 'media', entityId: flagged.id, action: 'update', summary: `Edited media "${short(flagged.name)}"`, before: { ...clone(flagged), moderation: 'pending', url: '(file)' }, after: { ...clone(flagged), url: '(file)' } })
  add(7, 15, 'Ada', { entity: 'contest', entityId: s.contest.id, action: 'update', summary: `Saved the contest "${short(s.contest.title)}"`, before: { ...clone(s.contest), tagline: 'Nine questions, one photo, one winner.' }, after: clone(s.contest) })
  const dara = person('p4')
  add(10, 13, 'Bo', { entity: 'participant', entityId: dara.id, action: 'update', summary: `Edited ${dara.name}`, before: { ...clone(dara), note: undefined, team: 'Nova' }, after: clone(dara) })
  add(14, 9, 'Ada', { entity: 'announcement', entityId: 'an1', action: 'publish', summary: 'Sent announcement "Welcome to the Aurora Cup" to 12 people' })

  return out.sort((a, b) => b.at.localeCompare(a.at))
}
