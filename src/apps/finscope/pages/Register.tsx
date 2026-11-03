import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/apps/finscope/context/AuthContext'
import { useToast } from '@/kit/context/ToastContext'
import { addMonths, today } from '@/kit/lib/date'
import { PLANS } from '@/apps/finscope/seed/content'
import { useFormat } from '@/kit/lib/format'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AuthLayout } from '@/apps/finscope/components/AuthLayout'
import { Alert } from '@/kit/components/ui/Feedback'
import { Button, ButtonLink } from '@/kit/components/ui/Button'
import { Stepper } from '@/kit/components/nav/Stepper'
import { Checkbox, RadioGroup, Switch } from '@/kit/components/forms/Controls'
import { Field, Input, PasswordField } from '@/kit/components/forms/Field'
import { PasswordStrength, passwordScore } from '@/kit/components/forms/PasswordStrength'
import { PhotoPicker } from '@/kit/components/forms/Dropzone'
import { Select } from '@/kit/components/forms/Select'
import { DatePicker } from '@/kit/components/calendar/DatePicker'

const COUNTRIES = [
  ['TR', 'Türkiye'],
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['NL', 'Netherlands'],
  ['SE', 'Sweden'],
  ['CH', 'Switzerland'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['JP', 'Japan'],
  ['SG', 'Singapore'],
  ['AE', 'United Arab Emirates'],
  ['BR', 'Brazil'],
  ['IN', 'India'],
].map(([value, label]) => ({ value, label }))

const STEPS = ['Account', 'Profile', 'Plan']

interface Form {
  first: string
  last: string
  email: string
  password: string
  dob: Date | null
  country: string | null
  phone: string
  photo: File | null
  plan: string
  alerts: boolean
  weekly: boolean
  terms: boolean
}

export default function Register() {
  usePageTitle('Create account')
  const { login } = useAuth()
  const toast = useToast()
  const fmt = useFormat()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<Form>({
    first: '',
    last: '',
    email: '',
    password: '',
    dob: null,
    country: null,
    phone: '',
    photo: null,
    plan: 'plus',
    alerts: true,
    weekly: true,
    terms: false,
  })

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const oldestAllowed = addMonths(today(), -216) // 18 years
  const validate = (s: number) => {
    const next: Record<string, string> = {}
    if (s === 0) {
      if (!form.first.trim()) next.first = 'Enter your first name.'
      if (!form.last.trim()) next.last = 'Enter your last name.'
      if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
      if (passwordScore(form.password) < 3) next.password = 'Choose a stronger password (at least 3 of 4 checks).'
    }
    if (s === 1) {
      if (!form.dob) next.dob = 'Select your date of birth.'
      if (!form.country) next.country = 'Select your country.'
      if (form.phone && form.phone.replace(/\D/g, '').length < 7) next.phone = 'Enter a valid phone number.'
    }
    if (s === 2 && !form.terms) next.terms = 'You need to accept the terms to continue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const next = (e: FormEvent) => {
    e.preventDefault()
    if (!validate(step)) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      return
    }
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      login({ name: `${form.first} ${form.last}`.trim(), email: form.email })
      setDone(true)
      toast.push({ tone: 'success', title: 'Account created' })
    }, 800)
  }

  if (done) {
    return (
      <AuthLayout title={`Welcome, ${form.first}`} lead="Your account is ready. Link your first account to see everything on one page.">
        <div className="stack">
          <Alert tone="success" title="You are all set">
            You are on the {PLANS.find((p) => p.id === form.plan)?.name} plan. Change it anytime from Settings.
          </Alert>
          <ButtonLink to="/dashboard" size="lg" block arrow>
            Go to your dashboard
          </ButtonLink>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      lead="It takes about two minutes. No card needed for the free plan."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <div className="stack-lg">
        <Stepper steps={STEPS} current={step} />
        <form className="stack" onSubmit={next} noValidate>
          {step === 0 && (
            <>
              <div className="form-grid">
                <Field label="First name" error={errors.first}>
                  <Input autoComplete="given-name" value={form.first} onChange={(e) => set('first', e.target.value)} />
                </Field>
                <Field label="Last name" error={errors.last}>
                  <Input autoComplete="family-name" value={form.last} onChange={(e) => set('last', e.target.value)} />
                </Field>
              </div>
              <Field label="Email" error={errors.email}>
                <Input type="email" autoComplete="email" icon={<Mail aria-hidden="true" />} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
              </Field>
              <PasswordField
                label="Password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                error={errors.password}
              />
              <PasswordStrength password={form.password} />
            </>
          )}

          {step === 1 && (
            <>
              <div className="stack-sm">
                <span className="field-label">Profile photo</span>
                <PhotoPicker value={form.photo} onChange={(f) => set('photo', f)} />
              </div>
              <div className="form-grid">
                <Field label="Date of birth" error={errors.dob} hint="You must be 18 or older.">
                  <DatePicker
                    value={form.dob}
                    onChange={(d) => set('dob', d)}
                    min={new Date(1900, 0, 1)}
                    max={oldestAllowed}
                    defaultMonth={oldestAllowed}
                    placeholder="Select date"
                  />
                </Field>
                <Field label="Country" error={errors.country}>
                  <Select value={form.country} onChange={(c) => set('country', c)} options={COUNTRIES} searchable placeholder="Select country" />
                </Field>
              </div>
              <Field label="Phone" optional error={errors.phone} hint="Used only for two-step verification.">
                <Input type="tel" autoComplete="tel" icon={<Phone aria-hidden="true" />} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+90 555 000 00 00" />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <RadioGroup
                cards
                legend="Choose a plan"
                value={form.plan}
                onChange={(p) => set('plan', p)}
                options={PLANS.map((p) => ({
                  value: p.id,
                  label: p.name,
                  price: p.monthly === 0 ? 'Free' : `${fmt.money(p.yearly, 0)} / mo`,
                  description: p.note,
                }))}
              />
              <div className="stack-sm card" style={{ padding: '1rem' }}>
                <Switch checked={form.alerts} onChange={(v) => set('alerts', v)} label="Market alerts" description="Tell me when a watched asset moves a lot." />
                <hr className="hr" />
                <Switch checked={form.weekly} onChange={(v) => set('weekly', v)} label="Weekly summary" description="One email every Monday morning." />
              </div>
              <div className="stack-sm">
                <Checkbox
                  checked={form.terms}
                  onChange={(v) => set('terms', v)}
                  error={Boolean(errors.terms)}
                  label={
                    <>
                      I agree to the <Link to="/help/terms">Terms</Link> and <Link to="/help/privacy">Privacy policy</Link>.
                    </>
                  }
                />
                {errors.terms && (
                  <span className="field-error" role="alert">
                    {errors.terms}
                  </span>
                )}
              </div>
            </>
          )}

          <div className="row spread">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" loading={loading} arrow={step < STEPS.length - 1}>
              {step < STEPS.length - 1 ? 'Continue' : (
                <>
                  <CircleCheck aria-hidden="true" />
                  Create account
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
