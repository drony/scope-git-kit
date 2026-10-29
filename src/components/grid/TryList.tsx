import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Feedback'

export interface TryTask {
  id: string
  title: string
  hint: string
  /** A button that does the step for the visitor, so they can see the result without knowing the shortcut. */
  action?: { label: string; run: () => void }
}

interface TryListProps {
  heading: string
  tasks: TryTask[]
  done: ReadonlySet<string>
  allDoneText: string
  closeLabel: string
  onClose: () => void
}

/** A checklist of things to try. Steps tick themselves off as the visitor does them. */
export function TryList({ heading, tasks, done, allDoneText, closeLabel, onClose }: TryListProps) {
  const count = tasks.filter((t) => done.has(t.id)).length
  return (
    <section className="try card" aria-label={heading}>
      <div className="try-head">
        <strong>{heading}</strong>
        <span className="mono small tnum">
          {count}/{tasks.length}
        </span>
        <Meter value={count} max={tasks.length} label={heading} />
        <span className="grow" />
        <Button variant="plain" size="sm" icon aria-label={closeLabel} onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <ul className="try-list">
        {tasks.map((task, i) => {
          const isDone = done.has(task.id)
          return (
            <li key={task.id} className={cn(isDone && 'is-done')}>
              <span className="try-mark" aria-hidden="true">
                {isDone ? <Check /> : i + 1}
              </span>
              <span className="grow">
                <strong>
                  {task.title}
                  {isDone && <span className="sr-only"> ✓</span>}
                </strong>
                <small>{task.hint}</small>
                {task.action && !isDone && (
                  <Button variant="ghost" size="sm" onClick={task.action.run} className="try-action">
                    {task.action.label}
                  </Button>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      {count === tasks.length && <p className="small try-done">{allDoneText}</p>}
    </section>
  )
}
