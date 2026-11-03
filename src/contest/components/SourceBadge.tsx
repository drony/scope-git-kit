import { BadgeCheck, CircleHelp, FilePenLine, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import type { QuestionSource } from '../data/types'
import { SOURCE_STATE_TEXT, sourceState, type SourceState } from '../lib/sources'

const ICON: Record<SourceState, LucideIcon> = { verified: BadgeCheck, original: FilePenLine, unchecked: CircleHelp, weak: TriangleAlert, missing: TriangleAlert }

/** How far a question's source can be trusted, as a small pill: verified, original, not checked, Wikipedia only, or missing. */
export function SourceBadge({ source, className }: { source?: QuestionSource; className?: string }) {
  const state = sourceState(source)
  const Icon = ICON[state]
  return (
    <span className={cn('src', `is-${state}`, className)} title={`${SOURCE_STATE_TEXT[state].hint}${source?.title && state !== 'original' ? ` (${source.title})` : ''}`}>
      <Icon aria-hidden="true" /> {SOURCE_STATE_TEXT[state].label}
    </span>
  )
}
