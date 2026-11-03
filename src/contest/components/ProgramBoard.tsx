import { Plus, Trophy } from 'lucide-react'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { ProgramSlot, WeeklyProgram } from '../data/types'
import { WEEKDAYS, occurrenceKey, showState, weekDates, type ShowState } from '../lib/program'
import { instantOn, weekdayOf, zonedDate } from '../lib/zoned'
import { QuotaMeter } from './QuotaMeter'

const STATE: Record<ShowState, { label: string; tone: Tone } | undefined> = {
  upcoming: undefined,
  soon: { label: 'Starting soon', tone: 'warning' },
  live: { label: 'On air', tone: 'error' },
  done: { label: 'Done', tone: 'neutral' },
}

interface ProgramBoardProps {
  program: WeeklyProgram
  /** How many people registered, by occurrence key. See `useRegistrations`. */
  registrations: Record<string, number>
  /** The clock, in milliseconds. The week shown is the one that holds this moment. */
  now: number
  /** The slot being edited. */
  selectedId?: string
  /** Makes each show a button. */
  onSelect?: (slot: ProgramSlot) => void
  /** Shows an "Add" button on days that have no show. */
  onAdd?: (weekday: ProgramSlot['weekday']) => void
  className?: string
}

const dayFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/**
 * The week at a glance: seven day columns, Monday first, each with its shows. A show card has the start time, the topic, the
 * final seats it gives (or "Final") and how full it is. Today's column is marked, shows that are on air or about to start say
 * so, and the final is drawn apart from the daily shows. The columns follow the width of the board, not of the screen: seven,
 * then four, then two, then one.
 */
export function ProgramBoard({ program, registrations, now, selectedId, onSelect, onAdd, className }: ProgramBoardProps) {
  const dates = weekDates(now, program.timezone)
  const today = zonedDate(now, program.timezone)
  return (
    <div className={cn('pg-board', className)}>
      <div className="pg-week">
        {dates.map((date) => {
          const weekday = weekdayOf(date)
          const slots = program.slots.filter((s) => s.weekday === weekday).sort((a, b) => a.time.localeCompare(b.time))
          const isToday = date === today
          const name = WEEKDAYS[weekday - 1]
          const label = dayFormat.format(new Date(`${date}T12:00:00Z`))
          return (
            <section key={date} className={cn('pg-day', isToday && 'is-today')} aria-label={`${name.name} ${label}`}>
              <header>
                <strong>{name.short}</strong>
                <span>{label}</span>
                {isToday && <Tag tone="accent">Today</Tag>}
              </header>
              <ul>
                {slots.map((slot) => {
                  const at = instantOn(date, slot.time, program.timezone)
                  const state = showState({ at, endsAt: at + slot.lengthMin * 60_000 }, now)
                  const registered = registrations[occurrenceKey(slot.id, date)]
                  const tag = STATE[state]
                  const body = (
                    <>
                      <span className="pg-slot-head">
                        <b>{slot.time}</b>
                        {tag && <Tag tone={tag.tone}>{tag.label}</Tag>}
                      </span>
                      <strong className="pg-topic">{slot.topic || 'No topic'}</strong>
                      <span className="pg-kind">
                        {slot.kind === 'final' ? (
                          <>
                            <Trophy aria-hidden="true" /> Final
                          </>
                        ) : (
                          `${slot.seats.toLocaleString('en')} final seat${slot.seats === 1 ? '' : 's'}`
                        )}
                      </span>
                      {registered !== undefined && state !== 'done' && <QuotaMeter value={registered} quota={slot.quota} size="sm" />}
                    </>
                  )
                  const cls = cn('pg-slot', slot.kind === 'final' && 'is-final', `is-${state}`, selectedId === slot.id && 'is-selected')
                  return (
                    <li key={slot.id}>
                      {onSelect ? (
                        <button type="button" className={cls} aria-pressed={selectedId === slot.id} onClick={() => onSelect(slot)}>
                          {body}
                        </button>
                      ) : (
                        <div className={cls}>{body}</div>
                      )}
                    </li>
                  )
                })}
                {slots.length === 0 && (
                  <li className="pg-empty">
                    <span>No show</span>
                    {onAdd && (
                      <button type="button" className="pg-add" onClick={() => onAdd(weekday)} aria-label={`Add a show on ${name.name}`}>
                        <Plus aria-hidden="true" /> Add
                      </button>
                    )}
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
