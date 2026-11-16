import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button, Alert, Field, Input } from '../../components/ui'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  const from = location.state?.from || '/'

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      const user = await login(data.username, data.password)
      navigate(user.role === 'ADMIN' && from === '/' ? '/admin' : from, { replace: true })
    } catch (e) {
      setServerError(e.message || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">Log in to your account</p>

        {serverError && <div className="mt-4"><Alert onClose={() => setServerError(null)}>{serverError}</Alert></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <Field label="Username" error={errors.username?.message} htmlFor="username">
            <Input id="username" autoComplete="username" {...register('username')} />
          </Field>
          <Field label="Password" error={errors.password?.message} htmlFor="password">
            <div className="relative">
              <Input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                className="pr-10" {...register('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="lg" className="w-full mt-2" loading={isSubmitting}>Log in</Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
