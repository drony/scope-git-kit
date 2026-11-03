import { useState } from 'react'
import { Input } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Topic } from '../data/types'

interface TopicManagerProps {
  topics: Topic[]
  /** Called with the topic to create or change. The id of an existing topic never changes. */
  onSave: (topic: Topic) => void
  /** How many approved questions each topic has, by id. */
  counts?: Record<string, number>
  busy?: boolean
  className?: string
}

/**
 * The topics as a list: the id (a tag, fixed once it exists), the name people see, and whether the topic is archived. An archived
 * topic is hidden and no new pack serves it. A form adds a topic. Renaming changes the name only: questions are tied to the id.
 */
export function TopicManager({ topics, onSave, counts = {}, busy, className }: TopicManagerProps) {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  return (
    <div className={cn('pk-topics', className)}>
      <ul>
        {topics.map((t) => (
          <li key={t.id} className={cn(t.archived && 'is-off')}>
            <code>{t.id}</code>
            {editing?.id === t.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onSave({ ...t, name: editing.name })
                  setEditing(null)
                }}
              >
                <Input autoFocus value={editing.name} aria-label={`Name of ${t.id}`} onChange={(e) => setEditing({ id: t.id, name: e.target.value })} />
                <Button size="sm" type="submit">
                  Save
                </Button>
              </form>
            ) : (
              <span className="pk-topic-name">
                {t.name} {t.archived && <Tag>archived</Tag>}
                <small>{counts[t.id] ?? 0} approved</small>
              </span>
            )}
            <span className="pk-topic-actions">
              {editing?.id !== t.id && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing({ id: t.id, name: t.name })}>
                  Rename
                </Button>
              )}
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSave({ ...t, archived: !t.archived })}>
                {t.archived ? 'Bring back' : 'Archive'}
              </Button>
            </span>
          </li>
        ))}
      </ul>
      <form
        className="pk-topic-add"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ id: id.trim(), name: name.trim(), archived: false })
          setId('')
          setName('')
        }}
      >
        <Input value={id} placeholder="id, for example cinema" aria-label="Id of the new topic" onChange={(e) => setId(e.target.value.toLowerCase())} />
        <Input value={name} placeholder="Name" aria-label="Name of the new topic" onChange={(e) => setName(e.target.value)} />
        <Button type="submit" size="sm" variant="plain" disabled={!id.trim() || !name.trim() || busy}>
          Add a topic
        </Button>
      </form>
    </div>
  )
}
