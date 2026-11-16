import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react'
import { addressService } from '../../services/addressService'
import { Button, Alert, Modal, Field, Input, EmptyState, Skeleton, ConfirmDialog } from '../../components/ui'

const schema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
})

const EMPTY = { label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '', isDefault: false }

export default function Addresses() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // {mode:'create'} | {mode:'edit', address}
  const [deleting, setDeleting] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema), defaultValues: EMPTY,
  })

  const load = () => {
    setLoading(true)
    addressService.list()
      .then(r => setAddresses(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => { reset(EMPTY); setModal({ mode: 'create' }) }
  const openEdit = (a) => {
    reset({ ...EMPTY, ...a, isDefault: a.defaultAddress })
    setModal({ mode: 'edit', address: a })
  }

  const save = async (data) => {
    setError(null)
    const payload = { ...data, defaultAddress: data.isDefault }
    delete payload.isDefault
    try {
      if (modal.mode === 'create') await addressService.create(payload)
      else await addressService.update(modal.address.id, payload)
      setModal(null)
      load()
    } catch (e) { setError(e.message) }
  }

  const remove = async () => {
    try { await addressService.remove(deleting.id); setDeleting(null); load() }
    catch (e) { setError(e.message) }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved addresses</h2>
        <Button size="sm" onClick={openCreate}><Plus size={15} /> Add address</Button>
      </div>
      {error && <div className="mt-4"><Alert onClose={() => setError(null)}>{error}</Alert></div>}

      {!addresses.length ? (
        <div className="mt-4">
          <EmptyState icon={MapPin} title="No saved addresses"
            description="Add a shipping address for faster checkout."
            action={<Button onClick={openCreate}><Plus size={15} /> Add address</Button>} />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {addresses.map(a => (
            <div key={a.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  {a.label && <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium">{a.label}</span>}
                  {a.defaultAddress && <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600"><Star size={12} fill="currentColor" /> Default</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Edit"><Pencil size={15} /></button>
                  <button onClick={() => setDeleting(a)} className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-neutral-900">{a.fullName || '—'}</p>
              <p className="mt-1 text-sm text-neutral-600">
                {[a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}
              </p>
              {a.phone && <p className="mt-1 text-sm text-neutral-500">{a.phone}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit address' : 'Add address'} wide>
        <form onSubmit={handleSubmit(save)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" error={errors.label?.message}><Input {...register('label')} placeholder="Home" /></Field>
            <Field label="Full name" error={errors.fullName?.message}><Input {...register('fullName')} /></Field>
            <Field label="Phone" error={errors.phone?.message} className="sm:col-span-2"><Input {...register('phone')} /></Field>
            <Field label="Address line 1 *" error={errors.addressLine1?.message} className="sm:col-span-2"><Input {...register('addressLine1')} /></Field>
            <Field label="Address line 2" error={errors.addressLine2?.message} className="sm:col-span-2"><Input {...register('addressLine2')} /></Field>
            <Field label="City" error={errors.city?.message}><Input {...register('city')} /></Field>
            <Field label="State" error={errors.state?.message}><Input {...register('state')} /></Field>
            <Field label="Postal code" error={errors.postalCode?.message}><Input {...register('postalCode')} /></Field>
            <Field label="Country" error={errors.country?.message}><Input {...register('country')} /></Field>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" className="rounded border-neutral-300" {...register('isDefault')} /> Set as default
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove}
        title="Delete address" message={`Delete the address for ${deleting?.fullName || 'this entry'}?`} confirmLabel="Delete" danger />
    </div>
  )
}
