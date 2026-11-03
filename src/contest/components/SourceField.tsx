import { Checkbox } from '@/kit/components/forms/Controls'
import { Field, Input } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Alert } from '@/kit/components/ui/Feedback'
import type { QuestionSource, SourceKind } from '../data/types'
import { isWikipediaOnly, SOURCE_KINDS } from '../lib/sources'
import { SourceBadge } from './SourceBadge'

interface SourceFieldProps {
  value?: QuestionSource
  onChange: (source: QuestionSource | undefined) => void
  /** Who is checking: written next to the date when "I checked the answer" is ticked. */
  reviewer?: string
  className?: string
}

/**
 * Where the answer to a question was checked: the kind of source, its title and address, and whether an editor verified the
 * answer against it. Warns about a source that is only Wikipedia. Sources are for editors: participants never see them.
 */
export function SourceField({ value, onChange, reviewer = 'Editor', className }: SourceFieldProps) {
  const source = value ?? { kind: 'article' as SourceKind, title: '' }
  const original = source.kind === 'original'
  const set = (patch: Partial<QuestionSource>) => onChange({ ...source, ...patch })
  return (
    <div className={className ? `cs-source ${className}` : 'cs-source'}>
      <div className="cs-source-head">
        <span className="field-label">Source</span>
        <SourceBadge source={value} />
      </div>
      <div className="cs-grid-3">
        <Field label="Kind">
          <Select<SourceKind> ariaLabel="Kind of source" value={source.kind} options={SOURCE_KINDS.map((k) => ({ value: k.value, label: k.label, description: k.hint }))} onChange={(kind) => set(kind === 'original' ? { kind, title: 'Written by the team', url: undefined, checkedBy: undefined, checkedAt: undefined } : { kind, title: source.title === 'Written by the team' ? '' : source.title })} />
        </Field>
        {!original && (
          <>
            <Field label="Title">
              <Input value={source.title} placeholder="Book, article or dataset" onChange={(e) => set({ title: e.target.value, checkedAt: undefined, checkedBy: undefined })} />
            </Field>
            <Field label="Address" optional>
              <Input value={source.url ?? ''} placeholder="https://" inputMode="url" onChange={(e) => set({ url: e.target.value || undefined, checkedAt: undefined, checkedBy: undefined })} />
            </Field>
          </>
        )}
      </div>
      {isWikipediaOnly(value) && (
        <Alert tone="warning" title="Only Wikipedia">
          Anyone can edit it. Use it to find a better source, then cite that one.
        </Alert>
      )}
      {!original && (
        <Checkbox
          checked={Boolean(source.checkedAt)}
          disabled={!source.title.trim()}
          onChange={(on) => set(on ? { checkedBy: reviewer, checkedAt: new Date().toISOString() } : { checkedBy: undefined, checkedAt: undefined })}
          label="I checked the answer against this source"
          description={source.checkedAt ? `Verified by ${source.checkedBy ?? 'an editor'} on ${new Date(source.checkedAt).toLocaleDateString('en', { dateStyle: 'medium' })}.` : 'Changing the source clears this.'}
        />
      )}
    </div>
  )
}
