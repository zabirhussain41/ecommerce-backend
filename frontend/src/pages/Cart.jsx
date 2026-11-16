import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Trash2, Minus, Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Button, Alert, EmptyState, Skeleton } from '../components/ui'
import { formatPrice } from '../utils/format'

const FREE_SHIPPING_THRESHOLD = 50

export default function Cart() {
  const { items, total, update, remove, clear, loading } = useCart()
  const navigate = useNavigate()
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const changeQty = async (item, delta) => {
    const next = item.quantity + delta
    if (next < 1) return
    if (next > (item.stock ?? 99)) { setError(`Only ${item.stock} available for ${item.name}.`); return }
    setBusyId(item.id)
    setError(null)
    try { await update(item.id, next) } catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  const removeItem = async (item) => {
    setBusyId(item.id)
    setError(null)
    try { await remove(item.id) } catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  if (loading && !items.length) {
    return <div className="mx-auto max-w-4xl px-4 py-10"><Skeleton className="h-64 w-full" /></div>
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our products and add something you like."
          action={<Link to="/products"><Button>Continue shopping</Button></Link>}
        />
      </div>
    )
  }

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 5
  const grandTotal = total + shipping

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Shopping cart</h1>
        <Button variant="ghost" size="sm" onClick={async () => { try { await clear() } catch (e) { setError(e.message) } }}>
          <Trash2 size={15} /> Clear cart
        </Button>
      </div>

      {error && <div className="mt-4"><Alert onClose={() => setError(null)}>{error}</Alert></div>}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4">
              <Link to={`/products/${item.productId}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-neutral-300 text-xs">No img</div>}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/products/${item.productId}`} className="font-medium text-neutral-900 hover:text-brand-700 line-clamp-2">
                    {item.name}
                  </Link>
                  <button onClick={() => removeItem(item)} disabled={busyId === item.id}
                    className="text-neutral-400 hover:text-red-600" aria-label={`Remove ${item.name}`}>
                    <Trash2 size={17} />
                  </button>
                </div>
                <p className="mt-0.5 text-sm text-neutral-500">{formatPrice(item.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-neutral-300">
                    <button className="px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                      disabled={busyId === item.id || item.quantity <= 1} onClick={() => changeQty(item, -1)} aria-label="Decrease">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button className="px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                      disabled={busyId === item.id || item.quantity >= (item.stock ?? 99)} onClick={() => changeQty(item, 1)} aria-label="Increase">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-semibold text-neutral-900">{formatPrice(item.lineTotal)}</span>
                </div>
                {item.quantity >= (item.stock ?? 0) && item.stock > 0 && (
                  <p className="mt-1 text-xs text-amber-600">Max available: {item.stock}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatPrice(total)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Shipping</dt><dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd></div>
              {shipping > 0 && (
                <p className="text-xs text-neutral-400">Add {formatPrice(FREE_SHIPPING_THRESHOLD - total)} more for free shipping</p>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
                <dt>Total</dt><dd>{formatPrice(grandTotal)}</dd>
              </div>
            </dl>
            <Button size="lg" className="mt-5 w-full" onClick={() => navigate('/checkout')}>Proceed to checkout</Button>
            <p className="mt-3 text-center text-xs text-neutral-400">Cash on delivery · No online payment required</p>
          </div>
        </div>
      </div>
    </div>
  )
}
