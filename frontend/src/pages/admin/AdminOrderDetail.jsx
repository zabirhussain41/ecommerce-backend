import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { Badge, Button, Select, Skeleton, ErrorState, Alert } from '../../components/ui'
import { formatPrice, formatDateTime, titleCase, ORDER_STATUS_STYLES } from '../../utils/format'

// Allowed next states mirror backend OrderService.TRANSITIONS
const NEXT_STATES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = () => {
    setLoading(true)
    adminService.order(id)
      .then(r => { setOrder(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }
  useEffect(load, [id])

  const updateStatus = async () => {
    if (!newStatus) return
    setUpdating(true)
    setNotice(null)
    try {
      await adminService.updateOrderStatus(id, newStatus)
      setNotice({ type: 'success', text: `Order status updated to ${titleCase(newStatus)}.` })
      setNewStatus('')
      load()
    } catch (e) {
      setNotice({ type: 'error', text: e.message })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!order) return null

  const addr = order.shippingAddress
  const nextStates = NEXT_STATES[order.status] || []

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft size={15} /> Back to orders
      </Link>

      {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Order #{order.id}</h1>
            <p className="text-sm text-neutral-500">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <Badge className={ORDER_STATUS_STYLES[order.status] || ''}>{titleCase(order.status)}</Badge>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div className="text-sm">
            <p className="font-medium text-neutral-700">Customer</p>
            <Link to={`/admin/customers/${order.userId}`} className="text-brand-600 hover:underline">User #{order.userId}</Link>
            <p className="mt-3 font-medium text-neutral-700">Payment</p>
            <p className="text-neutral-500">{titleCase(order.paymentMethod || 'COD')} — pay on delivery</p>
          </div>
          {addr && (
            <div className="text-sm">
              <p className="font-medium text-neutral-700">Ship to</p>
              <p className="text-neutral-500">
                {[addr.fullName, addr.phone, addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        {nextStates.length > 0 && (
          <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-5">
            <Select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-48">
              <option value="">Update status…</option>
              {nextStates.map(s => <option key={s} value={s}>{titleCase(s)}</option>)}
            </Select>
            <Button onClick={updateStatus} loading={updating} disabled={!newStatus}>Apply</Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">Product</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-neutral-500">Unit price</th>
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
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">Order total</td>
              <td className="px-4 py-3 text-right font-bold">{formatPrice(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
