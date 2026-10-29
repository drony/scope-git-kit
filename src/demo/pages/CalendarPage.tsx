import { useMemo, useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/kit/context/ToastContext'
import { useFormat } from '@/kit/lib/format'
import { addMonths, isSameDay, startOfMonth, toKey, today } from '@/kit/lib/date'
import { eventsForMonth } from '@/demo/seed/market'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { Button } from '@/kit/components/ui/Button'
import { Card } from '@/kit/components/ui/Card'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { Reveal } from '@/kit/components/ui/Reveal'
import { Calendar, type CalendarMarks, type MarkTone } from '@/kit/components/calendar/Calendar'
import { EventCalendar, type CalendarEvent } from '@/kit/components/calendar/EventCalendar'
import { DatePicker } from '@/kit/components/calendar/DatePicker'
import { MonthField } from '@/kit/components/calendar/MonthPicker'
import { TimeField } from '@/kit/components/calendar/TimePicker'
import { Field, Input } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Switch } from '@/kit/components/forms/Controls'
import { Modal } from '@/kit/components/overlays/Modal'

const KINDS: { value: MarkTone; label: string }[] = [
  { value: 'warning', label: 'Bill or payment' },
  { value: 'success', label: 'Income or dividend' },
  { value: 'accent', label: 'Market event' },
  { value: 'error', label: 'Deadline' },
]

function AddReminder({ open, onClose, initialDate, onAdd }: { open: boolean; onClose: () => void; initialDate: Date; onAdd: (e: CalendarEvent) => void }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<Date | null>(initialDate)
  const [time, setTime] = useState('09:00')
  const [kind, setKind] = useState<MarkTone>('warning')
  const [repeat, setRepeat] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({})

  const save = () => {
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Give the reminder a name.'
    if (!date) next.date = 'Pick a date.'
    setErrors(next)
    if (Object.keys(next).length || !date) return
    onAdd({ id: `custom-${Date.now()}`, date, title: `${title.trim()} · ${time}`, tone: kind })
    toast.push({ tone: 'success', title: 'Reminder added', description: repeat ? 'It repeats every month.' : undefined })
    setTitle('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a reminder"
      description="Bills, paydays or anything else you want to see on the calendar."
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Add reminder</Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Name" error={errors.title}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Car insurance" autoFocus />
        </Field>
        <div className="form-grid">
          <Field label="Date" error={errors.date}>
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="Time">
            <TimeField value={time} onChange={setTime} />
          </Field>
        </div>
        <Field label="Type">
          <Select value={kind} onChange={setKind} options={KINDS} />
        </Field>
        <Switch checked={repeat} onChange={setRepeat} label="Repeat monthly" description="Show it again on the same day each month." />
      </div>
    </Modal>
  )
}

export default function CalendarPage() {
  usePageTitle('Calendar')
  const fmt = useFormat()
  const [month, setMonth] = useState(() => startOfMonth(today()))
  const [selected, setSelected] = useState<Date | null>(today())
  const [extra, setExtra] = useState<CalendarEvent[]>([])
  const [adding, setAdding] = useState(false)

  const events = useMemo(() => {
    const base = [-1, 0, 1].flatMap((d) => {
      const m = addMonths(month, d)
      return eventsForMonth(m.getFullYear(), m.getMonth())
    })
    return [...base, ...extra]
  }, [month, extra])

  const marks: CalendarMarks = useMemo(() => Object.fromEntries(events.map((e) => [toKey(e.date), e.tone])), [events])
  const dayEvents = selected ? events.filter((e) => isSameDay(e.date, selected)) : []
  const upcoming = events.filter((e) => e.date >= today()).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5)

  const go = (d: Date) => {
    setMonth(startOfMonth(d))
    setSelected(d)
  }

  return (
    <>
      <section className="page-bar">
        <div className="container">
          <div className="row spread wrap top">
            <div>
              <span className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                Calendar
              </span>
              <h1 style={{ fontSize: 'clamp(1.75rem, 1.3rem + 1.7vw, 2.375rem)' }}>Money calendar</h1>
            </div>
            <div className="row wrap">
              <Button variant="ghost" size="sm" icon aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
                <ChevronLeft aria-hidden="true" />
              </Button>
              <div style={{ width: '11.5rem' }}>
                <MonthField ariaLabel="Choose month" value={{ year: month.getFullYear(), month: month.getMonth() }} onChange={({ year, month: m }) => setMonth(new Date(year, m, 1))} />
              </div>
              <Button variant="ghost" size="sm" icon aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
                <ChevronRight aria-hidden="true" />
              </Button>
              <Button variant="ghost" onClick={() => go(today())}>
                Today
              </Button>
              <Button onClick={() => setAdding(true)}>
                <CalendarPlus aria-hidden="true" />
                Add reminder
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section dash-section">
        <div className="container">
          <div className="cal-layout">
            <Reveal>
              <h2 className="sr-only">{fmt.date(month, 'monthYear')}</h2>
              <EventCalendar month={month} events={events} selected={selected} onSelect={setSelected} />
            </Reveal>
            <aside className="stack-lg">
              <Card className="cal-side">
                <Calendar mode="single" value={selected} onChange={go} marks={marks} month={month} onMonthChange={setMonth} />
              </Card>
              <Card className="stack-sm">
                <h2 className="card-title">{selected ? fmt.date(selected, 'long') : 'Pick a day'}</h2>
                {dayEvents.length ? (
                  <ul className="agenda">
                    {dayEvents.map((e) => (
                      <li key={e.id}>
                        <span className={`dot ${e.tone === 'warning' ? 'dot-warning' : e.tone === 'error' ? 'dot-error' : ''}`} aria-hidden="true" />
                        {e.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="Nothing scheduled">Add a reminder for this day.</EmptyState>
                )}
              </Card>
              <Card className="stack-sm">
                <h2 className="card-title">Coming up</h2>
                <ul className="agenda">
                  {upcoming.map((e) => (
                    <li key={e.id}>
                      <span className="mono small agenda-date">{fmt.date(e.date, 'day')}</span>
                      {e.title}
                    </li>
                  ))}
                </ul>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      <AddReminder open={adding} onClose={() => setAdding(false)} initialDate={selected ?? today()} onAdd={(e) => setExtra((list) => [...list, e])} />
    </>
  )
}
