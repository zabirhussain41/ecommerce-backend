import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Plus, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { addressService } from '../services/addressService'
import { orderService } from '../services/orderService'
import { Button, Alert, Modal, Field, Input, Select, EmptyState, Skeleton } from '../components/ui'
import { formatPrice } from '../utils/format'
import { ShoppingBag } from 'lucide-react'

const addressSchema = z.object({
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

const FREE_SHIPPING = 50

export default function Checkout() {
  const { items, total, refresh } = useCart()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [selected, setSelected] = useState(null)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'United States' },
  })

  const loadAddresses = () => {
    setLoadingAddresses(true)
    addressService.list()
      .then(res => {
        const list = res.data || []
        setAddresses(list)
        setSelected(prev => prev ?? (list.find(a => a.defaultAddress) || list[0])?.id ?? null)
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddresses(false))
  }

  useEffect(loadAddresses, [])

  const createAddress = async (data) => {
    const payload = { ...data, defaultAddress: data.isDefault }
    delete payload.isDefault
    const res = await addressService.create(payload)
    setShowAddressForm(false)
    reset()
    loadAddresses()
    setSelected(res.data.id)
  }

  const placeOrder = async () => {
    setPlacing(true)
    setError(null)
    try {
      const res = await orderService.place('COD', selected)
      await refresh()
      navigate('/checkout/success', { state: { orderId: res.data.orderId, total: res.data.total } })
    } catch (e) {
      setError(e.message || 'Failed to place order. Please try again.')
      setPlacing(false)
    }
  }

  if (!items.length && !placing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState icon={ShoppingBag} title="Nothing to check out"
          description="Your cart is empty." action={<Link to="/products"><Button>Browse products</Button></Link>} />
      </div>
    )
  }

  const shipping = total >= FREE_SHIPPING ? 0 : 5

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
      <p className="mt-1 text-sm text-neutral-500">Cash on delivery — pay when your order arrives.</p>

      {error && <div className="mt-4"><Alert onClose={() => setError(null)}>{error}</Alert></div>}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Shipping address */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18} className="text-brand-600" /> Shipping address</h2>
              <Button variant="secondary" size="sm" onClick={() => setShowAddressForm(true)}>
                <Plus size={15} /> New address
              </Button>
            </div>

            {loadingAddresses ? (
              <div className="mt-4 space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
            ) : addresses.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No saved addresses. Add one to continue.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {addresses.map(a => (
                  <label key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selected === a.id ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500' : 'border-neutral-200 hover:border-neutral-300'
                    }`}>
                    <input type="radio" name="address" className="mt-1" checked={selected === a.id}
                      onChange={() => setSelected(a.id)} />
                    <span className="text-sm">
                      <span className="block font-medium text-neutral-900">
                        {a.label && <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{a.label}</span>}
                        {a.fullName || '—'}
                        {a.defaultAddress && <span className="ml-2 text-xs text-brand-600">Default</span>}
                      </span>
                      <span className="mt-0.5 block text-neutral-600">
                        {[a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}
                      </span>
                      {a.phone && <span className="mt-0.5 block text-neutral-500">{a.phone}</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Payment method</h2>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <Check size={18} className="text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Cash on Delivery (COD)</p>
                <p className="text-xs text-neutral-500">Pay in cash when your order is delivered.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-neutral-900">Order summary</h2>
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {items.map(i => (
                <li key={i.id} className="flex items-center gap-3 text-sm">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {i.imageUrl && <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{i.quantity}</span>
                  </div>
                  <span className="min-w-0 flex-1 truncate text-neutral-700">{i.name}</span>
                  <span className="font-medium">{formatPrice(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatPrice(total)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Shipping</dt><dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd></div>
              <div className="flex justify-between text-base font-semibold pt-1"><dt>Total</dt><dd>{formatPrice(total + shipping)}</dd></div>
            </dl>
            <Button size="lg" className="mt-5 w-full" loading={placing}
              disabled={!selected || addresses.length === 0}
              onClick={placeOrder}>
              Place order · {formatPrice(total + shipping)}
            </Button>
            {!selected && addresses.length > 0 && (
              <p className="mt-2 text-center text-xs text-amber-600">Select a shipping address</p>
            )}
          </div>
        </div>
      </div>

      {/* New address modal */}
      <Modal open={showAddressForm} onClose={() => setShowAddressForm(false)} title="Add new address" wide>
        <form onSubmit={handleSubmit(createAddress)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label (e.g. Home)" error={errors.label?.message}>
              <Input {...register('label')} placeholder="Home" />
            </Field>
            <Field label="Full name" error={errors.fullName?.message}>
              <Input {...register('fullName')} placeholder="John Doe" />
            </Field>
            <Field label="Phone" error={errors.phone?.message} className="sm:col-span-2">
              <Input {...register('phone')} placeholder="+1 555 000 0000" />
            </Field>
            <Field label="Address line 1 *" error={errors.addressLine1?.message} className="sm:col-span-2">
              <Input {...register('addressLine1')} placeholder="123 Main St" />
            </Field>
            <Field label="Address line 2" error={errors.addressLine2?.message} className="sm:col-span-2">
              <Input {...register('addressLine2')} placeholder="Apt, suite, etc." />
            </Field>
            <Field label="City" error={errors.city?.message}><Input {...register('city')} /></Field>
            <Field label="State" error={errors.state?.message}><Input {...register('state')} /></Field>
            <Field label="Postal code" error={errors.postalCode?.message}><Input {...register('postalCode')} /></Field>
            <Field label="Country" error={errors.country?.message}><Input {...register('country')} /></Field>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" {...register('isDefault')} className="rounded border-neutral-300" />
            Set as default address
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddressForm(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save address</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
