/** Where a question's answer was checked, and how far that can be trusted. */
import type { QuestionSource, SourceKind } from '../data/types'

export const SOURCE_KINDS: Array<{ value: SourceKind; label: string; hint: string }> = [
  { value: 'book', label: 'Book', hint: 'A printed reference or textbook.' },
  { value: 'article', label: 'Article', hint: 'A paper, a news story or an encyclopedia entry.' },
  { value: 'web', label: 'Web page', hint: 'A page with a stable address.' },
  { value: 'dataset', label: 'Dataset', hint: 'Official figures or a database.' },
  { value: 'original', label: 'Original', hint: 'Written by the team; nothing to cite.' },
]

export type SourceState = 'missing' | 'unchecked' | 'verified' | 'original' | 'weak'

/** An encyclopedia that anyone can edit is a place to start, not a source. */
export const isWikipediaOnly = (s?: QuestionSource): boolean => Boolean(s && s.kind !== 'original' && /wikipedia\.org/i.test(`${s.url ?? ''} ${s.title}`))

/**
 * `missing`: no source. `weak`: only an open encyclopedia. `unchecked`: a source, but nobody verified the answer against it.
 * `verified`: a person checked it. `original`: written by the team.
 */
export function sourceState(s?: QuestionSource): SourceState {
  if (!s || (!s.title.trim() && s.kind !== 'original')) return 'missing'
  if (s.kind === 'original') return 'original'
  if (isWikipediaOnly(s)) return 'weak'
  return s.checkedAt ? 'verified' : 'unchecked'
}

export const SOURCE_STATE_TEXT: Record<SourceState, { label: string; hint: string }> = {
  missing: { label: 'No source', hint: 'Add where the answer was checked.' },
  weak: { label: 'Wikipedia only', hint: 'Find a second source before this goes on air.' },
  unchecked: { label: 'Not checked', hint: 'Nobody has verified the answer against this source yet.' },
  verified: { label: 'Verified', hint: 'An editor checked the answer against the source.' },
  original: { label: 'Original', hint: 'Written by the team.' },
}
