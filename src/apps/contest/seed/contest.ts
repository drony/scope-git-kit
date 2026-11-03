/**
 * Fictional contest data for the Contest Scope demo. Plain data: nothing here renders anything.
 * Names, questions and numbers are invented; the questions are ordinary general knowledge.
 */
import type {
  Announcement,
  Answer,
  AnswerKey,
  AnswerValue,
  ContestState,
  MediaAsset,
  Notification,
  Participant,
  Question,
  Submission,
} from '@/contest/data/types'
import { scoreSubmission } from '@/contest/lib/scoring'
import { mulberry32 } from '@/kit/lib/random'

/** The demo's "today" at 09:00 UTC, so dates, countdowns and "Yesterday" labels always make sense. */
const T0 = new Date().setUTCHours(9, 0, 0, 0)
const day = (n: number, hour = 9) => new Date(T0 + n * 86_400_000 + (hour - 9) * 3_600_000).toISOString()

/* ---- Media: small generated pictures, so the demo needs no files ------------------------------------------------ */

type Art = { id: string; name: string; alt: string; tags: string[]; a: string; b: string; shape: 'rainbow' | 'waves' | 'mountains' | 'sun' | 'grid' | 'dots'; state: MediaAsset['moderation'] }

function art({ a, b, shape }: Pick<Art, 'a' | 'b' | 'shape'>): string {
  const body: Record<Art['shape'], string> = {
    rainbow: ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6']
      .map((c, i) => `<circle cx="160" cy="190" r="${120 - i * 14}" fill="none" stroke="${c}" stroke-width="12"/>`)
      .join(''),
    waves: [0, 1, 2, 3].map((i) => `<path d="M0 ${110 + i * 28} Q40 ${90 + i * 28} 80 ${110 + i * 28} T160 ${110 + i * 28} T240 ${110 + i * 28} T320 ${110 + i * 28} V240 H0Z" fill="#fff" opacity="${0.18 + i * 0.1}"/>`).join(''),
    mountains: '<path d="M0 200 L70 90 L120 160 L190 60 L260 170 L320 120 V240 H0Z" fill="#fff" opacity=".35"/><path d="M0 220 L90 140 L170 205 L250 130 L320 190 V240 H0Z" fill="#fff" opacity=".55"/>',
    sun: '<circle cx="160" cy="105" r="46" fill="#fff" opacity=".85"/><rect x="0" y="170" width="320" height="70" fill="#000" opacity=".22"/>',
    grid: Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, c) => `<rect x="${12 + c * 38}" y="${14 + r * 44}" width="30" height="36" rx="6" fill="#fff" opacity="${0.15 + ((r * 3 + c * 5) % 7) * 0.08}"/>`).join('')).join(''),
    dots: Array.from({ length: 28 }, (_, i) => `<circle cx="${20 + ((i * 53) % 280)}" cy="${20 + ((i * 37) % 200)}" r="${6 + (i % 5) * 4}" fill="#fff" opacity="${0.2 + (i % 4) * 0.12}"/>`).join(''),
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="240" fill="url(#g)"/>${body[shape]}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const ARTS: Art[] = [
  { id: 'm-rainbow', name: 'rainbow-over-hills.svg', alt: 'A rainbow arching over a blue sky', tags: ['sky', 'weather'], a: '#38bdf8', b: '#a5f3fc', shape: 'rainbow', state: 'approved' },
  { id: 'm-waves', name: 'quiet-waves.svg', alt: 'Layered teal waves', tags: ['sea'], a: '#0ea5e9', b: '#14b8a6', shape: 'waves', state: 'approved' },
  { id: 'm-peaks', name: 'peaks-at-dusk.svg', alt: 'Two ranges of mountains at dusk', tags: ['mountains'], a: '#6366f1', b: '#f472b6', shape: 'mountains', state: 'approved' },
  { id: 'm-sunrise', name: 'sunrise-field.svg', alt: 'A low sun over a dark field', tags: ['sun', 'light'], a: '#f59e0b', b: '#ef4444', shape: 'sun', state: 'approved' },
  { id: 'm-city', name: 'city-grid-night.svg', alt: 'Lit windows in a city block at night', tags: ['city', 'light'], a: '#1e1b4b', b: '#4f46e5', shape: 'grid', state: 'pending' },
  { id: 'm-confetti', name: 'confetti.svg', alt: 'Soft round confetti on pink', tags: ['party'], a: '#ec4899', b: '#f59e0b', shape: 'dots', state: 'flagged' },
  { id: 'm-forest', name: 'forest-mist.svg', alt: 'Green hills in the mist', tags: ['forest', 'light'], a: '#10b981', b: '#a7f3d0', shape: 'mountains', state: 'pending' },
  { id: 'm-dunes', name: 'golden-dunes.svg', alt: 'Warm layered dunes', tags: ['desert', 'light'], a: '#f59e0b', b: '#fde68a', shape: 'waves', state: 'approved' },
]

const media: MediaAsset[] = ARTS.map((m, i) => {
  const url = art(m)
  return {
    id: m.id,
    kind: 'image',
    name: m.name,
    url,
    mime: 'image/svg+xml',
    sizeBytes: 1800 + i * 240,
    width: 320,
    height: 240,
    alt: m.alt,
    tags: m.tags,
    focal: { x: 0.5, y: 0.45 },
    moderation: m.state,
    uploadedBy: i >= 4 ? `p${i - 2}` : undefined,
    createdAt: day(-3 + i),
  }
})

/* ---- Questions and keys ----------------------------------------------------------------------------------------- */

const opt = (id: string, label: string, extra: { mediaId?: string; feedback?: string } = {}) => ({ id, label, ...extra })
const base = (id: string, prompt: string, points: number, extra: Partial<Question> = {}) => ({
  id,
  prompt,
  mediaIds: [] as string[],
  points,
  tags: [] as string[],
  status: 'published' as const,
  updatedAt: day(-2),
  ...extra,
})

const questions: Question[] = [
  { ...base('q1', 'Which planet in our solar system has the shortest day?', 10, { tags: ['space'], timeLimitSec: 30, explanation: 'Jupiter turns once in about ten hours.' }), type: 'single', options: [opt('a', 'Mercury'), opt('b', 'Venus'), opt('c', 'Jupiter', { feedback: 'Fast spinner: a day lasts about ten hours.' }), opt('d', 'Neptune')] },
  { ...base('q2', 'Which of these are prime numbers? Pick all that apply.', 15, { tags: ['maths'], timeLimitSec: 45, hint: 'A prime has exactly two divisors.' }), type: 'multiple', options: [opt('a', '2'), opt('b', '9'), opt('c', '11'), opt('d', '15'), opt('e', '17')] },
  { ...base('q3', 'Lightning never strikes the same place twice.', 5, { tags: ['science'], timeLimitSec: 20, explanation: 'It often does: tall buildings are hit many times a year.' }), type: 'truefalse', options: [opt('t', 'True'), opt('f', 'False')] },
  { ...base('q4', 'Which of these pictures shows a rainbow?', 10, { tags: ['pictures'], timeLimitSec: 30 }), type: 'image-choice', options: [opt('a', 'Picture A', { mediaId: 'm-peaks' }), opt('b', 'Picture B', { mediaId: 'm-rainbow' }), opt('c', 'Picture C', { mediaId: 'm-waves' })] },
  { ...base('q5', 'What is the capital city of Australia?', 10, { tags: ['geography'], timeLimitSec: 30 }), type: 'short', maxLength: 40 },
  { ...base('q6', 'Roughly how many kilometres around is the Earth at the equator?', 15, { tags: ['geography', 'maths'], timeLimitSec: 60, hint: 'Think of a number with five digits.' }), type: 'number', unit: 'km' },
  { ...base('q7', 'Put these animals in order from the lightest to the heaviest.', 15, { tags: ['nature'], timeLimitSec: 60 }), type: 'ordering', items: [opt('mouse', 'Mouse'), opt('cat', 'Cat'), opt('horse', 'Horse'), opt('elephant', 'Elephant')] },
  { ...base('q8', 'Match each country with its capital.', 20, { tags: ['geography'], timeLimitSec: 90 }), type: 'matching', left: [opt('jp', 'Japan'), opt('ke', 'Kenya'), opt('pe', 'Peru')], right: [opt('tokyo', 'Tokyo'), opt('nairobi', 'Nairobi'), opt('lima', 'Lima')] },
  { ...base('q9', 'In about fifty words, describe your favourite season and why.', 20, { tags: ['writing'] }), type: 'long', maxLength: 400 },
  { ...base('q10', 'Upload one photo that shows light. A phone picture is fine.', 30, { tags: ['photo'], status: 'ready' }), type: 'upload', accept: 'image/*', maxMb: 5, maxFiles: 1 },
]

const answerKeys: Record<string, AnswerKey> = {
  q1: { type: 'choice', correct: ['c'], partialCredit: false },
  q2: { type: 'choice', correct: ['a', 'c', 'e'], partialCredit: true },
  q3: { type: 'choice', correct: ['f'], partialCredit: false },
  q4: { type: 'choice', correct: ['b'], partialCredit: false },
  q5: { type: 'text', accepted: [{ id: 'k1', text: 'Canberra', credit: 1 }, { id: 'k2', text: 'Canbera', credit: 0.5 }], caseSensitive: false, ignoreAccents: true, ignorePunctuation: true },
  q6: { type: 'number', value: 40075, tolerance: 500 },
  q7: { type: 'ordering', order: ['mouse', 'cat', 'horse', 'elephant'] },
  q8: { type: 'matching', pairs: { jp: 'tokyo', ke: 'nairobi', pe: 'lima' } },
  q9: { type: 'manual', rubric: [{ id: 'r1', label: 'Clarity', maxPoints: 10 }, { id: 'r2', label: 'Voice', maxPoints: 10 }] },
  q10: { type: 'manual', rubric: [{ id: 'r1', label: 'Use of light', maxPoints: 15 }, { id: 'r2', label: 'Composition', maxPoints: 15 }] },
}

/* ---- People and their submissions ------------------------------------------------------------------------------- */

const NAMES: Array<[string, string]> = [
  ['Ada Lindqvist', 'Comets'], ['Bo Tanaka', 'Orbit'], ['Cleo Mensah', 'Nova'], ['Dara Okafor', 'Comets'], ['Eli Vasquez', 'Orbit'], ['Fay Brennan', 'Nova'],
  ['Gus Petrov', 'Comets'], ['Hana Sato', 'Orbit'], ['Ivo Kovac', 'Nova'], ['Jun Park', 'Comets'], ['Kai Moreau', 'Orbit'], ['Lia Haddad', 'Nova'],
]

const participants: Participant[] = NAMES.map(([name, team], i) => ({
  id: `p${i + 1}`,
  name,
  email: `${name.split(' ')[0].toLowerCase()}@example.test`,
  team,
  status: i < 8 ? 'finished' : i < 10 ? 'active' : 'invited',
  joinedAt: i < 10 ? day(-1, 9) : undefined,
}))

/** A right or a wrong answer for a question, depending on a coin. */
function answerFor(q: Question, right: boolean, rnd: () => number): AnswerValue | null {
  const key = answerKeys[q.id]
  switch (q.type) {
    case 'single': case 'truefalse': case 'image-choice': case 'multiple': {
      const correct = key.type === 'choice' ? key.correct : []
      const all = q.options.map((o) => o.id)
      if (right) return { type: 'choice', selected: correct }
      const wrong = all.filter((id) => !correct.includes(id))
      return { type: 'choice', selected: q.type === 'multiple' ? [correct[0], wrong[Math.floor(rnd() * wrong.length)]] : [wrong[Math.floor(rnd() * wrong.length)]] }
    }
    case 'short': return { type: 'text', text: right ? 'canberra' : ['Sydney', 'Melbourne', 'Perth'][Math.floor(rnd() * 3)] }
    case 'number': return { type: 'number', value: right ? 40000 + Math.round(rnd() * 100) : 24000 }
    case 'ordering': return { type: 'ordering', order: right ? ['mouse', 'cat', 'horse', 'elephant'] : ['cat', 'mouse', 'elephant', 'horse'] }
    case 'matching': return { type: 'matching', pairs: right ? { jp: 'tokyo', ke: 'nairobi', pe: 'lima' } : { jp: 'lima', ke: 'nairobi', pe: 'tokyo' } }
    case 'long': return { type: 'text', text: 'Autumn, because the light is low and the air smells of rain and woodsmoke. Everything slows down, and the evenings feel like a gift.' }
    default: return null
  }
}

const rnd = mulberry32(2027)
const submissions: Submission[] = participants
  .filter((p) => p.status === 'finished' || p.status === 'active')
  .map((p, i) => {
    const skill = 0.45 + ((i * 37) % 50) / 100
    const answers: Answer[] = []
    for (const q of questions.filter((x) => x.status === 'published')) {
      if (p.status === 'active' && q.id > 'q4') continue
      const value = answerFor(q, rnd() < skill, rnd)
      if (value) answers.push({ questionId: q.id, value, answeredAt: day(-1, 11), spentSec: 8 + Math.round(rnd() * 40) })
    }
    const results = scoreSubmission(questions.filter((q) => q.status === 'published'), answerKeys, answers)
    const scores = Object.fromEntries(Object.entries(results).map(([id, r]) => [id, { points: r.points, max: r.max, auto: r.auto, note: r.reason }]))
    return {
      id: `sub-${p.id}`,
      contestId: 'aurora-cup',
      participantId: p.id,
      startedAt: day(-1, 10),
      submittedAt: p.status === 'finished' ? day(-1, 11) : undefined,
      status: p.status === 'finished' ? 'submitted' : 'in-progress',
      answers,
      scores: p.status === 'finished' ? scores : {},
    }
  })

/* ---- Communication ---------------------------------------------------------------------------------------------- */

const announcements: Announcement[] = [
  { id: 'an1', title: 'Welcome to the Aurora Cup', body: 'Hi {{name}}, the first round opens tomorrow at 09:00. You have ten questions and 45 minutes. Good luck, and have fun.', audience: { kind: 'all' }, channels: ['in-app', 'email', 'push'], pinned: true, status: 'sent', sentAt: day(-4), delivery: { 'in-app': { sent: 12, failed: 0 }, email: { sent: 12, failed: 0 }, push: { sent: 10, failed: 2, reason: 'Invited but never opened the app, so there is no device to notify.' } } },
  { id: 'an2', title: 'Photo round: one picture, any light', body: 'Round two is a photo challenge. Upload one picture that shows light. Phone photos are welcome; please do not edit the faces of other people.', audience: { kind: 'segment', segment: 'finished' }, channels: ['in-app', 'push'], pinned: false, status: 'scheduled', scheduledAt: day(2) },
  { id: 'an3', title: 'Reminder: round one closes soon', body: 'Answers lock at 23:59. Finished already? Nothing to do: we will post scores on Friday.', audience: { kind: 'segment', segment: 'not-started' }, channels: ['push', 'email'], pinned: false, status: 'draft' },
  { id: 'an4', title: '{{team}}, send us your team logo', body: 'Hi {{name}}, every team in the {{contest}} gets a badge on the leaderboard. Reply with a square logo by Friday.', audience: { kind: 'segment', segment: 'team', team: 'Comets' }, channels: ['in-app'], pinned: false, status: 'draft' },
]

const notifications: Notification[] = [
  { id: 'n1', recipientId: 'p11', kind: 'announcement', title: 'Welcome to the Aurora Cup', body: 'Hi Kai, the first round opens tomorrow at 09:00.', createdAt: day(-4), readAt: day(-4, 12), href: '/announcements' },
  { id: 'n2', recipientId: 'p11', kind: 'deadline', title: 'Round one closes soon', body: 'Answers lock the day after tomorrow at 23:59.', createdAt: day(-1, 8), href: '/play' },
  { id: 'n3', recipientId: 'p11', kind: 'system', title: 'Your profile is complete', body: 'Teammates in Orbit can now see your name on the leaderboard.', createdAt: day(0, 8), href: '/leaderboard' },
]

/* ---- The whole state -------------------------------------------------------------------------------------------- */

export const CONTEST_SEED: ContestState = {
  contest: {
    id: 'aurora-cup',
    title: 'Aurora Cup',
    tagline: 'Ten questions, one photo, one winner.',
    status: 'live',
    startsAt: day(-1),
    endsAt: day(9),
    rounds: [
      { id: 'r1', title: 'Round one: the quiz', opensAt: day(-1), closesAt: day(1, 23), questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'] },
      { id: 'r2', title: 'Round two: words and light', opensAt: day(2), closesAt: day(8, 23), questionIds: ['q9', 'q10'] },
    ],
    prizes: [
      { id: 'pz1', place: 1, title: 'The Aurora trophy', description: 'A hand-blown glass trophy and a year of bragging rights.' },
      { id: 'pz2', place: 2, title: 'Mountain weekend', description: 'Two nights in a lodge of your choice.' },
      { id: 'pz3', place: 3, title: 'Book bundle', description: 'Five books chosen by the judges.' },
    ],
  },
  questions,
  answerKeys,
  media,
  participants,
  submissions,
  announcements,
  notifications,
  audit: [],
}

/** The signed-in participant in the demo. */
export const DEMO_PARTICIPANT_ID = 'p11'
