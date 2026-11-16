import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui'
import { formatPrice } from '../utils/format'

export default function OrderSuccess() {
  const location = useLocation()
  const orderId = location.state?.orderId
  const total = location.state?.total

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-neutral-500">We couldn't find your order confirmation.</p>
        <Link to="/account/orders" className="mt-6 inline-block"><Button>View my orders</Button></Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">Order placed successfully!</h1>
      <p className="mt-2 text-neutral-500">
        Thank you for your order. We've received it and will start preparing it right away.
      </p>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 text-left">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Package size={16} />
          <span>Order <span className="font-semibold text-neutral-900">#{orderId}</span></span>
          {total != null && <span className="ml-auto font-semibold">{formatPrice(total)}</span>}
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Payment: Cash on delivery. You'll pay when your order arrives.
        </p>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link to={`/account/orders/${orderId}`}><Button variant="secondary">View order</Button></Link>
        <Link to="/products"><Button>Continue shopping <ArrowRight size={16} /></Button></Link>
      </div>
    </div>
  )
}
