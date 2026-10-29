import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PasswordRule {
  id: string
  label: string
  ok: boolean
}

export function passwordRules(password: string): PasswordRule[] {
  return [
    { id: 'len', label: 'At least 10 characters', ok: password.length >= 10 },
    { id: 'case', label: 'Upper and lower case letters', ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'num', label: 'A number', ok: /\d/.test(password) },
    { id: 'sym', label: 'A symbol', ok: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function passwordScore(password: string): number {
  return password ? passwordRules(password).filter((r) => r.ok).length : 0
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export function PasswordStrength({ password }: { password: string }) {
  const rules = passwordRules(password)
  const score = passwordScore(password)
  return (
    <div className="stack-sm" aria-live="polite">
      <div className="strength" data-level={score} role="img" aria-label={`Password strength: ${LABELS[score] || 'empty'}`}>
        <i />
        <i />
        <i />
        <i />
      </div>
      <ul className="rules">
        {rules.map((r) => (
          <li key={r.id} className={cn(r.ok && 'ok')}>
            {r.ok ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
