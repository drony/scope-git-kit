import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AuthLayout } from '@/demo/components/AuthLayout'
import { Alert } from '@/kit/components/ui/Feedback'
import { Button, ButtonLink } from '@/kit/components/ui/Button'
import { Field, Input } from '@/kit/components/forms/Field'

export default function Forgot() {
  usePageTitle('Reset password')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError(undefined)
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 600)
  }

  return (
    <AuthLayout
      title="Reset your password"
      lead="Enter the email you signed up with and we will send you a link to choose a new password."
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="stack">
          <Alert tone="success" title="Check your inbox">
            If an account exists for {email}, a reset link is on its way. It is valid for one hour.
          </Alert>
          <ButtonLink to="/login" variant="ghost" block>
            Back to sign in
          </ButtonLink>
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <Field label="Email" error={error}>
            <Input type="email" size="lg" autoComplete="email" icon={<Mail aria-hidden="true" />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Button type="submit" size="lg" block loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
