/**
 * Reads a pasted list of people. One person per line (or separated by `;`), in any of these shapes:
 *
 *   ada@example.com
 *   Ada Lindqvist <ada@example.com>, Comets
 *   Ada Lindqvist, ada@example.com, Comets
 *
 * The line is checked as it is read, so the dialog can say exactly which lines are wrong and why.
 */

export interface InvitePerson {
  name: string
  email: string
  team?: string
}

export type InviteProblem = 'no-email' | 'bad-email' | 'duplicate' | 'repeated'

export interface InviteLine {
  /** 1-based, among the non-empty lines. */
  line: number
  raw: string
  person?: InvitePerson
  problem?: InviteProblem
}

export const INVITE_PROBLEMS: Record<InviteProblem, string> = {
  'no-email': 'There is no e-mail address on this line.',
  'bad-email': 'This e-mail address does not look right.',
  duplicate: 'This person is already in the contest.',
  repeated: 'This address is on an earlier line.',
}

const FIND_EMAIL = /[^\s<>,;"]+@[^\s<>,;"]+/
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const nameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

export function parseInvites(text: string, existingEmails: string[] = []): { lines: InviteLine[]; valid: InvitePerson[] } {
  const taken = new Set(existingEmails.map((e) => e.toLowerCase()))
  const seen = new Set<string>()
  const lines: InviteLine[] = []

  for (const raw of text.split(/[\n;]/).map((l) => l.trim()).filter(Boolean)) {
    const line = lines.length + 1
    const match = raw.match(FIND_EMAIL)
    if (!match) {
      lines.push({ line, raw, problem: 'no-email' })
      continue
    }
    const email = match[0].replace(/[.]+$/, '')
    if (!VALID_EMAIL.test(email)) {
      lines.push({ line, raw, problem: 'bad-email' })
      continue
    }
    const rest = raw.replace(match[0], ' ').replace(/[<>"]/g, ' ').split(/[,\t]/).map((s) => s.trim()).filter(Boolean)
    const person: InvitePerson = { name: rest[0] ?? nameFromEmail(email), email, ...(rest[1] ? { team: rest[1] } : {}) }
    const key = email.toLowerCase()
    if (taken.has(key)) lines.push({ line, raw, person, problem: 'duplicate' })
    else if (seen.has(key)) lines.push({ line, raw, person, problem: 'repeated' })
    else {
      seen.add(key)
      lines.push({ line, raw, person })
    }
  }
  return { lines, valid: lines.flatMap((l) => (l.person && !l.problem ? [l.person] : [])) }
}
