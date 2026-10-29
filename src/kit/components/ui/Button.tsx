import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/kit/lib/cn'

type Variant = 'primary' | 'ghost' | 'plain' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Look {
  variant?: Variant
  size?: Size
  /** Adds the trailing → used by ascope.app's call-to-action buttons. */
  arrow?: boolean
  block?: boolean
  /** Square, icon-only button. */
  icon?: boolean
}

function look({ variant = 'primary', size = 'md', arrow, block, icon }: Look, extra?: string) {
  return cn(
    'btn',
    variant === 'ghost' && 'btn-ghost',
    variant === 'plain' && 'btn-plain',
    variant === 'danger' && 'btn-danger',
    size === 'sm' && 'btn-small',
    size === 'lg' && 'btn-large',
    arrow && 'has-arrow',
    block && 'btn-block',
    icon && 'btn-icon',
    extra,
  )
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Look & { loading?: boolean }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, arrow, block, icon, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={look({ variant, size, arrow, block, icon }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  )
})

export function ButtonLink({
  variant,
  size,
  arrow,
  block,
  icon,
  className,
  ...rest
}: LinkProps & Look) {
  return <Link className={look({ variant, size, arrow, block, icon }, className)} {...rest} />
}
