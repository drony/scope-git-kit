import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { CircleAlert, Eye, EyeOff, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ---- Field: label + control + hint + error ------------------------------ */

interface FieldContextValue {
  id: string
  describedBy?: string
  invalid: boolean
}
const FieldContext = createContext<FieldContextValue | null>(null)

/** Props a control should spread to be wired to the surrounding <Field>. */
export function useFieldProps() {
  const ctx = useContext(FieldContext)
  if (!ctx) return {}
  return { id: ctx.id, 'aria-describedby': ctx.describedBy, 'aria-invalid': ctx.invalid || undefined }
}

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn('field', className)}>
        {label && (
          <label className="field-label" htmlFor={id}>
            <span>{label}</span>
            {optional && <span className="optional">Optional</span>}
          </label>
        )}
        {children}
        {hint && !error && (
          <span className="field-hint" id={hintId}>
            {hint}
          </span>
        )}
        {error && (
          <span className="field-error" id={errorId} role="alert">
            <CircleAlert aria-hidden="true" />
            {error}
          </span>
        )}
      </div>
    </FieldContext.Provider>
  )
}

/* ---- Input ---------------------------------------------------------------- */

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'md' | 'lg'
  /** Icon on the left. */
  icon?: ReactNode
  /** Content on the right (buttons, shortcuts). */
  affix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', icon, affix, className, ...rest },
  ref,
) {
  const field = useFieldProps()
  return (
    <div className={cn('input-wrap', Boolean(icon) && 'has-left', Boolean(affix) && 'has-right', size === 'lg' && 'input-lg-wrap')}>
      {icon && <span className="input-icon">{icon}</span>}
      <input ref={ref} className={cn('input', size === 'lg' && 'input-lg', className)} {...field} {...rest} />
      {affix && <div className="input-affix">{affix}</div>}
    </div>
  )
})

interface TextFieldProps extends InputProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  fieldClassName?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, fieldClassName, ...input },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={fieldClassName}>
      <Input ref={ref} {...input} />
    </Field>
  )
})

export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(function PasswordField(
  { label = 'Password', hint, error, optional, fieldClassName, ...input },
  ref,
) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={fieldClassName}>
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        affix={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
          >
            {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        }
        {...input}
      />
    </Field>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  const field = useFieldProps()
  return <textarea ref={ref} className={cn('input', className)} {...field} {...rest} />
})

interface SearchInputProps extends Omit<InputProps, 'icon' | 'affix' | 'onChange' | 'value'> {
  value: string
  onValueChange: (value: string) => void
  /** Shown as a keyboard hint when the box is empty, e.g. "/". */
  shortcut?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, shortcut, placeholder = 'Search', ...rest },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      icon={<Search aria-hidden="true" />}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onValueChange(e.target.value)}
      affix={
        value ? (
          <button type="button" onClick={() => onValueChange('')} aria-label="Clear search">
            <X aria-hidden="true" />
          </button>
        ) : shortcut ? (
          <kbd className="kbd">{shortcut}</kbd>
        ) : undefined
      }
      {...rest}
    />
  )
})
