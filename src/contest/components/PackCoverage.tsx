import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import { THIN_WEEKS, type CoverageState, type TopicCoverage } from '../lib/packs'

const TONE: Record<CoverageState, Tone> = { ready: 'success', thin: 'warning', missing: 'neutral', archived: 'neutral' }
const LABEL: Record<CoverageState, string> = { ready: 'Ready', thin: 'Thin', missing: 'Not in the pack', archived: 'Archived' }

interface PackCoverageProps {
  /** One row per topic. See `coverage`. */
  rows: TopicCoverage[]
  /** Makes each row a button. */
  onSelect?: (topicId: string) => void
  selectedId?: string
  className?: string
}

/**
 * Per topic: how many questions the pack serves against how many the bank could give, how they spread over the five levels, how
 * many daily shows of the program use the topic, and how many weeks of those shows the served questions last. "Thin" means less than
 * four weeks. A topic with no daily show has no runway to count.
 */
export function PackCoverage({ rows, onSelect, selectedId, className }: PackCoverageProps) {
  const max = Math.max(1, ...rows.flatMap((r) => r.levels))
  return (
    <ul className={cn('pk-cover', className)} aria-label="Coverage by topic">
      {rows.map((r) => {
        const body = (
          <>
            <span className="pk-cover-name">
              <strong>{r.topic.name}</strong>
              <small>
                {r.served.toLocaleString('en')} served · {r.available.toLocaleString('en')} available
              </small>
            </span>
            <span className="pk-levels" role="img" aria-label={`Questions by level: ${[1, 2, 3, 4, 5].map((l) => `${r.levels[l]} of level ${l}`).join(', ')}${r.levels[0] ? `, ${r.levels[0]} without a level` : ''}`}>
              {[1, 2, 3, 4, 5].map((l) => (
                <i key={l} style={{ height: `${Math.max(r.levels[l] ? 14 : 3, (r.levels[l] / max) * 100)}%`, background: `var(--level-${l})` }} title={`Level ${l}: ${r.levels[l]}`} />
              ))}
            </span>
            <span className="pk-cover-runway">
              {r.weeks === null ? <small>No daily show</small> : <><b>{r.weeks}</b> <small>week{r.weeks === 1 ? '' : 's'} of {r.showsPerWeek} show{r.showsPerWeek === 1 ? '' : 's'}{r.weeks < THIN_WEEKS && r.state !== 'missing' ? ` (needs ${THIN_WEEKS})` : ''}</small></>}
            </span>
            <Tag tone={TONE[r.state]}>{LABEL[r.state]}</Tag>
          </>
        )
        return (
          <li key={r.topic.id}>
            {onSelect ? (
              <button type="button" className={cn('pk-cover-row', selectedId === r.topic.id && 'is-on', r.state === 'archived' && 'is-archived')} aria-pressed={selectedId === r.topic.id} onClick={() => onSelect(r.topic.id)}>
                {body}
              </button>
            ) : (
              <div className={cn('pk-cover-row', r.state === 'archived' && 'is-archived')}>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
