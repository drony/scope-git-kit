import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Check, CircleCheck, ImagePlus, Plus, TriangleAlert, X } from 'lucide-react'
import { SortableList } from '@/kit/components/data/SortableList'
import { Checkbox } from '@/kit/components/forms/Controls'
import { Field, Input, Textarea } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { AcceptedText, AnswerKey, ChoiceOption, Difficulty, Question } from '../data/types'
import { defaultsFor, readiness } from '../lib/quick'
import { blankKey, convertQuestion, QUESTION_TYPES, typeInfo } from '../lib/questionTypes'
import { AnswerKeyEditor } from './AnswerKeyEditor'
import type { MediaLookup } from './Answers'
import { DifficultyMeter } from './DifficultyMeter'
import type { MediaTarget } from './QuestionComposer'
import { SourceField } from './SourceField'
import { TimeDial } from './TimeDial'

interface QuestionQuickEditorProps {
  question: Question
  /** The answer key. Null is fine: the editor makes a blank one that fits. */
  answerKey: AnswerKey | null
  /** Called with the whole question and key on every change. The key is always kept in step with the question. */
  onChange: (question: Question, key: AnswerKey) => void
  media?: MediaLookup
  onPickMedia?: (target: MediaTarget) => void
  /** Topics used elsewhere, offered while typing tags. */
  knownTags?: string[]
  /** Written into "I checked the answer" on the source. */
  reviewer?: string
  className?: string
}

const PLACEHOLDER = /^(Option [A-D]|Picture [A-C]|First|Second|Third|Left \d|Right \d)$/
const LETTER = (i: number) => String.fromCharCode(65 + i)
const nextOptionId = (list: ChoiceOption[], prefix: string) => {
  let n = list.length + 1
  while (list.some((o) => o.id === `${prefix}${n}`)) n++
  return `${prefix}${n}`
}
const cleared = (list: ChoiceOption[]) => list.map((o) => (PLACEHOLDER.test(o.label) ? { ...o, label: '' } : o))

/** Lines pasted into one box become one option each. A leading `*` or ✓ marks the right one; list markers like "a)" are dropped. */
function optionsFromPaste(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => ({ right: /^(\*|✓|✔|\[x\])\s*/i.test(line), label: line.replace(/^(\*|✓|✔|\[x\])\s*/i, '').replace(/^([a-hA-H][).]|\d+[).]|[-•])\s+/, '') }))
}

/**
 * Write a question and its answer in one place. Type the question, type the options, tick the right one next to it: the
 * answer key is made as you go, so there is no second step. Enter adds an option, Backspace on an empty one removes it, and a
 * list pasted into an option becomes many options. Difficulty, time and points start from sensible defaults. Everything the
 * writer rarely needs (source, hint, explanation, pictures, partial credit) waits under "More".
 */
export function QuestionQuickEditor({ question: q, answerKey, onChange, media, onPickMedia, knownTags = [], reviewer, className }: QuestionQuickEditorProps) {
  const wanted = typeInfo(q.type).key
  const key: AnswerKey = answerKey && answerKey.type === wanted ? answerKey : blankKey(q)
  const [focus, setFocus] = useState<string | null>(null)
  const [tagText, setTagText] = useState('')
  const inputs = useRef(new Map<string, HTMLInputElement | null>())

  useEffect(() => {
    if (focus) {
      inputs.current.get(focus)?.focus()
      setFocus(null)
    }
  }, [focus])

  const emit = (nq: Question, nk: AnswerKey = key) => onChange(nq, nk)
  const ref = (id: string) => (el: HTMLInputElement | null) => void inputs.current.set(id, el)
  const problems = readiness(q, key)

  const changeType = (type: Question['type']) => {
    if (type === q.type) return
    let nq = convertQuestion(q, type)
    if ('options' in nq && type !== 'truefalse') nq = { ...nq, options: cleared(nq.options) }
    if (nq.type === 'ordering') nq = { ...nq, items: cleared(nq.items) }
    if (nq.type === 'matching') nq = { ...nq, left: cleared(nq.left), right: cleared(nq.right) }
    const keep = typeInfo(type).key === 'choice' && key.type === 'choice' && type !== 'truefalse'
    emit(nq, keep && 'options' in nq ? { type: 'choice', correct: key.type === 'choice' ? key.correct.filter((id) => (nq as { options: ChoiceOption[] }).options.some((o) => o.id === id)) : [], partialCredit: type === 'multiple' } : blankKey(nq))
  }

  const changeLevel = (level: Difficulty) => {
    const was = q.difficulty ? defaultsFor(q, q.difficulty) : undefined
    const now = defaultsFor(q, level)
    emit({ ...q, difficulty: level, points: !was || q.points === was.points ? now.points : q.points, timeLimitSec: !was || q.timeLimitSec === was.timeLimitSec || q.timeLimitSec === undefined ? now.timeLimitSec : q.timeLimitSec })
  }

  /* ---- choice ---- */
  const choice = 'options' in q ? q : null
  const correct = key.type === 'choice' ? key.correct : []
  const setOptions = (options: ChoiceOption[]) => emit({ ...(q as Extract<Question, { options: ChoiceOption[] }>), options }, { type: 'choice', correct: correct.filter((id) => options.some((o) => o.id === id)), partialCredit: q.type === 'multiple' })
  const markRight = (id: string) => {
    if (key.type !== 'choice') return
    const next = q.type === 'multiple' ? (correct.includes(id) ? correct.filter((c) => c !== id) : [...correct, id]) : [id]
    emit(q, { ...key, correct: next })
  }
  const optionKeys = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (!choice) return
    const list = choice.options
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const id = nextOptionId(list, 'o')
      const next = [...list.slice(0, i + 1), { id, label: '' }, ...list.slice(i + 1)]
      setOptions(next)
      setFocus(id)
    } else if (e.key === 'Backspace' && !list[i].label && list.length > 2 && q.type !== 'image-choice') {
      e.preventDefault()
      setOptions(list.filter((_, n) => n !== i))
      setFocus(list[Math.max(0, i - 1)].id)
    } else if (e.key === 'ArrowDown' && list[i + 1]) setFocus(list[i + 1].id)
    else if (e.key === 'ArrowUp' && list[i - 1]) setFocus(list[i - 1].id)
  }
  const pasteOptions = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (!choice || !text.includes('\n')) return
    e.preventDefault()
    const parsed = optionsFromPaste(text)
    if (parsed.length === 0) return
    const list = [...choice.options]
    const startAt = list[i].label.trim() ? i + 1 : i
    const made = parsed.map((p, n) => ({ id: nextOptionId([...list, ...parsed.slice(0, n).map((_, k) => ({ id: `o${list.length + k + 1}`, label: '' }))], 'o'), label: p.label, right: p.right }))
    const next = [...list.slice(0, startAt), ...made.map(({ id, label }) => ({ id, label })), ...list.slice(startAt + (list[i].label.trim() ? 0 : 1))]
    const rights = made.filter((m) => m.right).map((m) => m.id)
    emit({ ...(q as Extract<Question, { options: ChoiceOption[] }>), options: next }, { type: 'choice', correct: rights.length ? (q.type === 'multiple' ? [...correct, ...rights] : [rights[0]]) : correct, partialCredit: q.type === 'multiple' })
  }

  /* ---- short answer ---- */
  const accepted = key.type === 'text' ? key.accepted : []
  const setAccepted = (list: AcceptedText[]) => key.type === 'text' && emit(q, { ...key, accepted: list })

  /* ---- ordering and matching ---- */
  const setItems = (items: ChoiceOption[]) => q.type === 'ordering' && emit({ ...q, items }, { type: 'ordering', order: items.map((i) => i.id) })
  const setPairs = (left: ChoiceOption[], right: ChoiceOption[]) => q.type === 'matching' && emit({ ...q, left, right }, { type: 'matching', pairs: Object.fromEntries(left.map((l, i) => [l.id, right[i].id])) })

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '')
    if (tag && !q.tags.includes(tag)) emit({ ...q, tags: [...q.tags, tag] })
    setTagText('')
  }

  return (
    <div className={cn('qe', className)}>
      <Textarea
        className="qe-prompt"
        rows={2}
        value={q.prompt}
        placeholder="Type the question"
        aria-label="Question"
        onChange={(e) => emit({ ...q, prompt: e.target.value })}
      />

      <div className="qe-types" role="radiogroup" aria-label="Type of question">
        {QUESTION_TYPES.map((t) => (
          <button key={t.type} type="button" role="radio" aria-checked={q.type === t.type} className={cn('qe-type', q.type === t.type && 'is-on')} title={t.description} onClick={() => changeType(t.type)}>
            <t.icon aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>

      <section className="qe-answers" aria-label="Answer">
        {choice && q.type === 'truefalse' && (
          <div className="qe-tf" role="radiogroup" aria-label="The right answer">
            {choice.options.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={correct.includes(o.id)} className={cn('qe-tf-btn', correct.includes(o.id) && 'is-right')} onClick={() => markRight(o.id)}>
                {correct.includes(o.id) && <Check aria-hidden="true" />} {o.label}
              </button>
            ))}
            <span className="qe-hint">Click the right answer.</span>
          </div>
        )}

        {choice && q.type !== 'truefalse' && (
          <>
            <span className="qe-label">{q.type === 'multiple' ? 'Options: tick every right one' : 'Options: tick the right one'}</span>
            <ul className="qe-opts">
              {choice.options.map((o, i) => {
                const right = correct.includes(o.id)
                return (
                  <li key={o.id} className={cn('qe-opt', right && 'is-right')}>
                    <button type="button" role={q.type === 'multiple' ? 'checkbox' : 'radio'} aria-checked={right} className={cn('qe-mark', q.type === 'multiple' && 'is-box', right && 'is-right')} aria-label={`Option ${LETTER(i)} is right`} onClick={() => markRight(o.id)}>
                      {right && <Check aria-hidden="true" />}
                    </button>
                    <span className="qe-letter" aria-hidden="true">
                      {LETTER(i)}
                    </span>
                    <input ref={ref(o.id)} className="qe-input" value={o.label} placeholder={`Option ${LETTER(i)}`} aria-label={`Option ${LETTER(i)}`} onChange={(e) => setOptions(choice.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))} onKeyDown={(e) => optionKeys(i, e)} onPaste={(e) => pasteOptions(i, e)} />
                    {q.type === 'image-choice' && onPickMedia && (
                      <Button variant="plain" size="sm" icon aria-label={`Picture for option ${LETTER(i)}`} onClick={() => onPickMedia({ kind: 'option', id: o.id })}>
                        {o.mediaId && media?.(o.mediaId) ? <img className="qe-thumb" src={media(o.mediaId)!.url} alt="" /> : <ImagePlus aria-hidden="true" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" icon aria-label={`Remove option ${LETTER(i)}`} disabled={choice.options.length <= 2} onClick={() => setOptions(choice.options.filter((x) => x.id !== o.id))}>
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                )
              })}
            </ul>
            <button type="button" className="qe-add" disabled={choice.options.length >= 8} onClick={() => {
              const id = nextOptionId(choice.options, 'o')
              setOptions([...choice.options, { id, label: '' }])
              setFocus(id)
            }}>
              <Plus aria-hidden="true" /> Add an option <kbd>Enter</kbd>
            </button>
            <span className="qe-hint">Tip: paste a list into an option to make them all at once. Start the right one with *.</span>
          </>
        )}

        {q.type === 'short' && (
          <>
            <span className="qe-label">Accepted answers</span>
            <ul className="qe-opts">
              {accepted.map((a, i) => (
                <li key={a.id} className="qe-opt">
                  <input
                    ref={ref(a.id)}
                    className="qe-input"
                    value={a.text}
                    placeholder={i === 0 ? 'The right answer' : 'Another accepted wording'}
                    aria-label={`Accepted answer ${i + 1}`}
                    onChange={(e) => setAccepted(accepted.map((x) => (x.id === a.id ? { ...x, text: e.target.value } : x)))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault()
                        const id = `k${accepted.length + 1}${Date.now() % 1000}`
                        setAccepted([...accepted, { id, text: '', credit: 1 }])
                        setFocus(id)
                      } else if (e.key === 'Backspace' && !a.text && accepted.length > 1) {
                        e.preventDefault()
                        setAccepted(accepted.filter((x) => x.id !== a.id))
                      }
                    }}
                  />
                  <Button variant="ghost" size="sm" icon aria-label={`Remove accepted answer ${i + 1}`} disabled={accepted.length <= 1} onClick={() => setAccepted(accepted.filter((x) => x.id !== a.id))}>
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <Checkbox
              checked={key.type === 'text' && !key.caseSensitive && key.ignoreAccents && key.ignorePunctuation}
              onChange={(on) => key.type === 'text' && emit(q, { ...key, caseSensitive: !on, ignoreAccents: on, ignorePunctuation: on })}
              label="Ignore capitals, accents and punctuation"
            />
          </>
        )}

        {q.type === 'number' && key.type === 'number' && (
          <div className="cs-grid-3">
            <Field label="Right number">
              <Input type="number" step="any" value={key.value} onChange={(e) => emit(q, { ...key, value: Number(e.target.value) })} />
            </Field>
            <Field label="Counts if within" hint="0 means exact.">
              <Input type="number" min={0} step="any" value={key.tolerance} onChange={(e) => emit(q, { ...key, tolerance: Math.max(0, Number(e.target.value)) })} />
            </Field>
            <Field label="Unit" optional>
              <Input value={q.unit ?? ''} placeholder="km" onChange={(e) => emit({ ...q, unit: e.target.value || undefined }, key)} />
            </Field>
          </div>
        )}

        {q.type === 'ordering' && (
          <>
            <span className="qe-label">Items, in the right order (players see them shuffled)</span>
            <SortableList
              label="Items in the right order"
              items={q.items}
              getId={(i) => i.id}
              onChange={setItems}
              renderItem={(item, { handle, index }) => (
                <div className="qe-opt">
                  {handle}
                  <span className="qe-letter" aria-hidden="true">
                    {index + 1}
                  </span>
                  <input
                    ref={ref(item.id)}
                    className="qe-input"
                    value={item.label}
                    placeholder={`Item ${index + 1}`}
                    aria-label={`Item ${index + 1}`}
                    onChange={(e) => setItems(q.items.map((x) => (x.id === item.id ? { ...x, label: e.target.value } : x)))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault()
                        const id = nextOptionId(q.items, 'i')
                        setItems([...q.items.slice(0, index + 1), { id, label: '' }, ...q.items.slice(index + 1)])
                        setFocus(id)
                      } else if (e.key === 'Backspace' && !item.label && q.items.length > 2) {
                        e.preventDefault()
                        setItems(q.items.filter((x) => x.id !== item.id))
                      }
                    }}
                  />
                  <Button variant="ghost" size="sm" icon aria-label={`Remove item ${index + 1}`} disabled={q.items.length <= 2} onClick={() => setItems(q.items.filter((x) => x.id !== item.id))}>
                    <X aria-hidden="true" />
                  </Button>
                </div>
              )}
            />
            <button type="button" className="qe-add" disabled={q.items.length >= 10} onClick={() => setItems([...q.items, { id: nextOptionId(q.items, 'i'), label: '' }])}>
              <Plus aria-hidden="true" /> Add an item
            </button>
          </>
        )}

        {q.type === 'matching' && (
          <>
            <span className="qe-label">Pairs: the left item belongs with the one on its right</span>
            <ul className="qe-opts">
              {q.left.map((l, i) => (
                <li key={l.id} className="qe-pair">
                  <input className="qe-input" value={l.label} placeholder={`Item ${i + 1}`} aria-label={`Left ${i + 1}`} onChange={(e) => setPairs(q.left.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)), q.right)} />
                  <span aria-hidden="true">↔</span>
                  <input className="qe-input" value={q.right[i]?.label ?? ''} placeholder="Its match" aria-label={`Right ${i + 1}`} onChange={(e) => setPairs(q.left, q.right.map((x, n) => (n === i ? { ...x, label: e.target.value } : x)))} />
                  <Button variant="ghost" size="sm" icon aria-label={`Remove pair ${i + 1}`} disabled={q.left.length <= 2} onClick={() => setPairs(q.left.filter((_, n) => n !== i), q.right.filter((_, n) => n !== i))}>
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <button type="button" className="qe-add" disabled={q.left.length >= 8} onClick={() => setPairs([...q.left, { id: nextOptionId(q.left, 'l'), label: '' }], [...q.right, { id: nextOptionId(q.right, 'r'), label: '' }])}>
              <Plus aria-hidden="true" /> Add a pair
            </button>
          </>
        )}

        {key.type === 'manual' && (
          <>
            <span className="qe-label">A person scores this answer. What should they look for?</span>
            <ul className="qe-opts">
              {key.rubric.map((r, i) => (
                <li key={r.id} className="qe-opt">
                  <input className="qe-input" value={r.label} placeholder="Criterion, for example Clarity" aria-label={`Criterion ${i + 1}`} onChange={(e) => emit(q, { ...key, rubric: key.rubric.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)) })} />
                  <input className="qe-input qe-points" type="number" min={0} value={r.maxPoints} aria-label={`Points for criterion ${i + 1}`} onChange={(e) => emit(q, { ...key, rubric: key.rubric.map((x) => (x.id === r.id ? { ...x, maxPoints: Math.max(0, Number(e.target.value)) } : x)) })} />
                  <Button variant="ghost" size="sm" icon aria-label={`Remove criterion ${i + 1}`} disabled={key.rubric.length <= 1} onClick={() => emit(q, { ...key, rubric: key.rubric.filter((x) => x.id !== r.id) })}>
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <button type="button" className="qe-add" onClick={() => emit(q, { ...key, rubric: [...key.rubric, { id: `r${key.rubric.length + 1}${Date.now() % 1000}`, label: '', maxPoints: 5 }] })}>
              <Plus aria-hidden="true" /> Add a criterion
            </button>
          </>
        )}
      </section>

      <section className="qe-meta" aria-label="Level, time and points">
        <div className="qe-meta-level">
          <span className="qe-label">Level</span>
          <DifficultyMeter value={q.difficulty} onChange={changeLevel} compact />
        </div>
        <div className="qe-meta-time">
          <span className="qe-label">Time to answer</span>
          <TimeDial value={q.timeLimitSec ?? 20} question={q} onChange={(timeLimitSec) => emit({ ...q, timeLimitSec })} />
        </div>
        <div className="qe-meta-pts">
          <Field label="Points">
            <Input type="number" min={0} value={q.points} onChange={(e) => emit({ ...q, points: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
        </div>
        <div className="qe-meta-tags">
          <span className="qe-label">Topics</span>
          <div className="qe-tags">
            {q.tags.map((t) => (
              <span key={t} className="qe-tag">
                {t}
                <button type="button" aria-label={`Remove ${t}`} onClick={() => emit({ ...q, tags: q.tags.filter((x) => x !== t) })}>
                  <X aria-hidden="true" />
                </button>
              </span>
            ))}
            <input
              className="qe-tag-in"
              list="qe-known-tags"
              value={tagText}
              placeholder={q.tags.length ? 'Add' : 'Add a topic'}
              aria-label="Add a topic"
              onChange={(e) => (e.target.value.endsWith(',') ? addTag(e.target.value.slice(0, -1)) : setTagText(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(tagText)
                } else if (e.key === 'Backspace' && !tagText && q.tags.length) emit({ ...q, tags: q.tags.slice(0, -1) })
              }}
              onBlur={() => tagText && addTag(tagText)}
            />
            <datalist id="qe-known-tags">
              {knownTags.filter((t) => !q.tags.includes(t)).map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      <details className="qe-more">
        <summary>More: source, hint, explanation, pictures, partial credit</summary>
        <div className="qe-more-body">
          <SourceField value={q.source} onChange={(source) => emit({ ...q, source })} reviewer={reviewer} />
          <Field label="Hint" optional hint="Players can open it while answering.">
            <Input value={q.hint ?? ''} onChange={(e) => emit({ ...q, hint: e.target.value || undefined })} />
          </Field>
          <Field label="Explanation" optional hint="Shown after the answer is locked.">
            <Textarea rows={2} value={q.explanation ?? ''} onChange={(e) => emit({ ...q, explanation: e.target.value || undefined })} />
          </Field>
          {onPickMedia && (
            <div className="cs-attach-row">
              {q.mediaIds.map((id) => (
                <span key={id} className="cs-attach">
                  {media?.(id)?.kind === 'image' ? <img src={media(id)!.url} alt={media(id)!.alt ?? ''} /> : <span>{media?.(id)?.name ?? id}</span>}
                  <button type="button" aria-label="Remove" onClick={() => emit({ ...q, mediaIds: q.mediaIds.filter((x) => x !== id) })}>
                    <X aria-hidden="true" />
                  </button>
                </span>
              ))}
              <Button variant="plain" size="sm" onClick={() => onPickMedia({ kind: 'prompt' })}>
                <ImagePlus aria-hidden="true" /> Add a picture or sound
              </Button>
            </div>
          )}
          <AnswerKeyEditor question={q} value={key} onChange={(k) => emit(q, k)} media={media} />
        </div>
      </details>

      <p className={cn('qe-ready', problems.length === 0 && 'is-ok')} role="status">
        {problems.length === 0 ? (
          <>
            <CircleCheck aria-hidden="true" /> Ready to publish
          </>
        ) : (
          <>
            <TriangleAlert aria-hidden="true" /> Still needed: {problems.join(' ')}
          </>
        )}
      </p>
    </div>
  )
}
