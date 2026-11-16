import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { Badge, ErrorState, Skeleton } from '../../components/ui'
import { formatPrice, formatDateTime, ORDER_STATUS_STYLES, titleCase } from '../../utils/format'
import { ArrowLeft } from 'lucide-react'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    orderService.get(id)
      .then(r => { setOrder(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }
  useEffect(load, [id])

  if (loading) return <Skeleton className="h-96 w-full" />
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!order) return null

  const addr = order.shippingAddress

  return (
    <div className="space-y-6">
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft size={15} /> Back to orders
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Order #{order.id}</h2>
            <p className="text-sm text-neutral-500">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <Badge className={ORDER_STATUS_STYLES[order.status] || 'bg-neutral-100'}>{titleCase(order.status)}</Badge>
        </div>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium text-neutral-700">Payment</p>
            <p className="text-neutral-500">{titleCase(order.paymentMethod || 'COD')} — pay on delivery</p>
          </div>
          {addr && (
            <div>
              <p className="font-medium text-neutral-700">Shipping to</p>
              <p className="text-neutral-500">
                {[addr.fullName, addr.phone, addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Product</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(order.items || []).map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <Link to={`/products/${item.productId}`} className="font-medium text-neutral-900 hover:text-brand-700">{item.name}</Link>
                </td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatPrice(item.price)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200">
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td>
              <td className="px-4 py-3 text-right font-bold">{formatPrice(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
