import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button, Alert, Field, Input } from '../../components/ui'

const schema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Letters, numbers, _ . - only'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  fullName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, { error: 'You must accept the terms' }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(password), label: 'uppercase letter' },
    { ok: /[0-9]/.test(password), label: 'number' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'symbol' },
  ]
  const score = checks.filter(c => c.ok).length
  const color = score <= 1 ? 'bg-red-500' : score <= 2 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full rounded-full bg-neutral-200">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(score / 4) * 100}%` }} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {c.ok ? <Check size={11} /> : <X size={11} />} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const { register: registerUser, login } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', fullName: '', phone: '', password: '', confirmPassword: '', acceptTerms: false },
  })
  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      await registerUser({
        username: data.username,
        email: data.email || null,
        fullName: data.fullName || null,
        phone: data.phone || null,
        password: data.password,
      })
      setSuccess(true)
      // Auto-login for convenience
      await login(data.username, data.password)
      navigate('/', { replace: true })
    } catch (e) {
      setServerError(e.message || 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500">Join us — it takes less than a minute</p>

        {serverError && <div className="mt-4"><Alert onClose={() => setServerError(null)}>{serverError}</Alert></div>}
        {success && <div className="mt-4"><Alert type="success">Account created! Logging you in…</Alert></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-1">
          <Field label="Full name" error={errors.fullName?.message} htmlFor="fullName">
            <Input id="fullName" autoComplete="name" {...register('fullName')} />
          </Field>
          <Field label="Username *" error={errors.username?.message} htmlFor="username">
            <Input id="username" autoComplete="username" {...register('username')} />
          </Field>
          <Field label="Email" error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Phone" error={errors.phone?.message} htmlFor="phone">
            <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
          </Field>
          <Field label="Password *" error={errors.password?.message} htmlFor="password">
            <div className="relative">
              <Input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                className="pr-10" {...register('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </Field>
          <Field label="Confirm password *" error={errors.confirmPassword?.message} htmlFor="confirmPassword">
            <Input id="confirmPassword" type={showPw ? 'text' : 'password'} autoComplete="new-password" {...register('confirmPassword')} />
          </Field>
          <Field error={errors.acceptTerms?.message}>
            <label className="flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="mt-0.5 rounded border-neutral-300" {...register('acceptTerms')} />
              <span>I agree to the <span className="font-medium">Terms of Service</span> and <span className="font-medium">Privacy Policy</span></span>
            </label>
          </Field>
          <Button type="submit" size="lg" className="w-full mt-4" loading={isSubmitting}>Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Log in</Link>
        </p>
      </div>
    </div>
  )
}
