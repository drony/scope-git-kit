import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Building2, Fingerprint, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/demo/context/AuthContext'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AuthLayout } from '@/demo/components/AuthLayout'
import { Alert } from '@/kit/components/ui/Feedback'
import { Button } from '@/kit/components/ui/Button'
import { Checkbox } from '@/kit/components/forms/Controls'
import { Field, Input, PasswordField } from '@/kit/components/forms/Field'
import { OtpInput } from '@/kit/components/forms/OtpInput'

const DEMO_CODE = '123456'

function nameFromEmail(email: string) {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return local.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Friend'
}

export default function Login() {
  usePageTitle('Sign in')
  const { user, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)

  if (user) return <Navigate to={from} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setStep('code')
    }, 600)
  }

  const verify = (value: string) => {
    if (value !== DEMO_CODE) {
      setCodeError(true)
      return
    }
    login({ name: nameFromEmail(email), email })
    toast.push({ tone: 'success', title: 'Welcome back', description: remember ? 'You will stay signed in on this device.' : undefined })
    navigate(from, { replace: true })
  }

  if (step === 'code') {
    return (
      <AuthLayout
        title="Check your phone"
        lead={
          <>
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
          </>
        }
        footer={
          <>
            Wrong address?{' '}
            <button type="button" className="link-button" onClick={() => setStep('credentials')}>
              Go back
            </button>
          </>
        }
      >
        <div className="stack">
          <Alert tone="info" title="Demo mode">
            Use code {DEMO_CODE} to continue.
          </Alert>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v)
              setCodeError(false)
            }}
            onComplete={verify}
            invalid={codeError}
          />
          {codeError && (
            <p className="field-error" role="alert">
              That code is not correct. Try again.
            </p>
          )}
          <Button block onClick={() => verify(code)} disabled={code.length < 6}>
            Verify and sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Welcome back"
      lead="Sign in to see where you stand this morning."
      footer={
        <>
          New to Finscope? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" size="lg" icon={<Mail aria-hidden="true" />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <PasswordField
          size="lg"
          icon={<Lock aria-hidden="true" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="At least 8 characters"
        />
        <div className="row spread">
          <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in" />
          <Link to="/forgot-password" className="small">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" block loading={loading} arrow>
          Sign in
        </Button>
        <div className="divider">or</div>
        <div className="form-grid">
          <Button variant="ghost" onClick={() => toast.push({ title: 'Passkeys are not enabled in the demo' })}>
            <Fingerprint aria-hidden="true" />
            Passkey
          </Button>
          <Button variant="ghost" onClick={() => toast.push({ title: 'Single sign-on is not enabled in the demo' })}>
            <Building2 aria-hidden="true" />
            Single sign-on
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
