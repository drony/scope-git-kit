import { Copy, Plus, Trash2 } from 'lucide-react'
import { DataGrid } from '@/kit/components/grid/DataGrid'
import type { FilterDef, GridColumn } from '@/kit/components/grid/types'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import type { AnswerKey, Id, Question, QuestionStatus } from '../data/types'
import { keyProblems, QUESTION_TYPES, typeInfo } from '../lib/questionTypes'

interface QuestionBankProps {
  questions: Question[]
  /** The answer keys, to show which questions still need one. */
  keys?: Record<Id, AnswerKey>
  /** The question open in the editor. */
  selectedId?: Id | null
  onSelect: (id: Id) => void
  onAdd?: () => void
  onDuplicate?: (question: Question) => void
  onDelete?: (question: Question) => void
  className?: string
}

const STATUS_TONE: Record<QuestionStatus, 'neutral' | 'warning' | 'success'> = { draft: 'neutral', ready: 'warning', published: 'success' }

const filters: FilterDef<Question>[] = [
  { id: 'status', label: 'Status', options: (['draft', 'ready', 'published'] as const).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })), test: (q, v) => q.status === v },
  { id: 'type', label: 'Type', options: QUESTION_TYPES.map((t) => ({ value: t.type, label: t.label })), test: (q, v) => q.type === v },
]

/**
 * All questions in a searchable, sortable, filterable table (the kit's DataGrid). Click a question to open it; the table
 * shows type, points, time, status and whether the answer key is complete. Add, duplicate and delete are buttons you wire up.
 */
export function QuestionBank({ questions, keys = {}, selectedId, onSelect, onAdd, onDuplicate, onDelete, className }: QuestionBankProps) {
  const columns: GridColumn<Question>[] = [
    {
      id: 'prompt',
      header: 'Question',
      locked: true,
      minWidth: 260,
      value: (q) => q.prompt,
      render: (q) => (
        <button type="button" className="cs-bank-open" aria-current={selectedId === q.id ? 'true' : undefined} onClick={() => onSelect(q.id)}>
          {q.prompt || <em>Untitled question</em>}
        </button>
      ),
    },
    { id: 'type', header: 'Type', value: (q) => typeInfo(q.type).label },
    { id: 'points', header: 'Points', value: (q) => q.points, summary: 'sum' },
    { id: 'time', header: 'Time (s)', noSum: true, value: (q) => q.timeLimitSec ?? null, render: (_q, v) => (v == null ? '—' : String(v)) },
    { id: 'status', header: 'Status', value: (q) => q.status, render: (q) => <Tag tone={STATUS_TONE[q.status]}>{q.status}</Tag> },
    {
      id: 'key',
      header: 'Answer key',
      value: (q) => keyProblems(q, keys[q.id]).length,
      render: (q) => {
        const n = keyProblems(q, keys[q.id]).length
        return n === 0 ? <Tag tone="success">complete</Tag> : <Tag tone="error">{keys[q.id] ? `${n} to fix` : 'missing'}</Tag>
      },
    },
    { id: 'tags', header: 'Tags', value: (q) => q.tags.join(', ') },
  ]
  if (onDuplicate || onDelete) {
    columns.push({
      id: 'actions',
      header: '',
      noSum: true,
      value: () => null,
      render: (q) => (
        <span className="cs-bank-actions">
          {onDuplicate && (
            <Button variant="ghost" size="sm" icon aria-label={`Duplicate “${q.prompt}”`} onClick={() => onDuplicate(q)}>
              <Copy aria-hidden="true" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" icon aria-label={`Delete “${q.prompt}”`} onClick={() => onDelete(q)}>
              <Trash2 aria-hidden="true" />
            </Button>
          )}
        </span>
      ),
    })
  }

  return (
    <div className={className}>
      <DataGrid
        title="Questions"
        storageKey="contest.question-bank"
        rows={questions}
        rowId={(q) => q.id}
        columns={columns}
        filters={filters}
        searchText={(q) => `${q.prompt} ${q.tags.join(' ')} ${typeInfo(q.type).label}`}
        defaultDensity="compact"
        totalLabel="Total points"
        actions={
          onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus aria-hidden="true" /> New question
            </Button>
          )
        }
      />
    </div>
  )
}
