import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Button, Alert, Field, Input } from '../../components/ui'
import { formatDate } from '../../utils/format'

const profileSchema = z.object({
  email: z.string().email('Invalid email').or(z.literal('')),
  fullName: z.string().max(100),
  phone: z.string().max(30),
})

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Must be at least 8 characters'),
  confirmNew: z.string(),
}).refine(d => d.newPassword === d.confirmNew, { message: 'Passwords do not match', path: ['confirmNew'] })

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const [msg, setMsg] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)

  const profile = useForm({
    resolver: zodResolver(profileSchema),
    values: { email: user?.email || '', fullName: user?.fullName || '', phone: user?.phone || '' },
  })
  const pw = useForm({ resolver: zodResolver(pwSchema), defaultValues: { currentPassword: '', newPassword: '', confirmNew: '' } })

  const saveProfile = async (data) => {
    setMsg(null)
    try {
      await authService.updateProfile({ email: data.email || null, fullName: data.fullName || null, phone: data.phone || null })
      await refreshProfile()
      setMsg({ type: 'success', text: 'Profile updated.' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
  }

  const changePw = async (data) => {
    setPwMsg(null)
    try {
      await authService.changePassword(data.currentPassword, data.newPassword)
      pw.reset()
      setPwMsg({ type: 'success', text: 'Password changed.' })
    } catch (e) {
      setPwMsg({ type: 'error', text: e.message })
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-neutral-500">Username</dt><dd className="font-medium">{user?.username}</dd></div>
          <div><dt className="text-neutral-500">Member since</dt><dd className="font-medium">{formatDate(user?.createdAt)}</dd></div>
        </dl>
        {msg && <div className="mt-4"><Alert type={msg.type} onClose={() => setMsg(null)}>{msg.text}</Alert></div>}
        <form onSubmit={profile.handleSubmit(saveProfile)} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={profile.formState.errors.email?.message}>
            <Input type="email" {...profile.register('email')} />
          </Field>
          <Field label="Full name" error={profile.formState.errors.fullName?.message}>
            <Input {...profile.register('fullName')} />
          </Field>
          <Field label="Phone" error={profile.formState.errors.phone?.message}>
            <Input {...profile.register('phone')} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" loading={profile.formState.isSubmitting}>Save changes</Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound size={18} className="text-brand-600" /> Change password</h2>
        {pwMsg && <div className="mt-4"><Alert type={pwMsg.type} onClose={() => setPwMsg(null)}>{pwMsg.text}</Alert></div>}
        <form onSubmit={pw.handleSubmit(changePw)} className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Current password" error={pw.formState.errors.currentPassword?.message}>
            <Input type="password" autoComplete="current-password" {...pw.register('currentPassword')} />
          </Field>
          <Field label="New password" error={pw.formState.errors.newPassword?.message}>
            <Input type="password" autoComplete="new-password" {...pw.register('newPassword')} />
          </Field>
          <Field label="Confirm new password" error={pw.formState.errors.confirmNew?.message}>
            <Input type="password" autoComplete="new-password" {...pw.register('confirmNew')} />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" loading={pw.formState.isSubmitting}>Update password</Button>
          </div>
        </form>
      </section>
    </div>
  )
}
