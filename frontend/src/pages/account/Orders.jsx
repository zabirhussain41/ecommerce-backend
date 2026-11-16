import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import DataTable from '../../components/DataTable'
import { Badge, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { formatPrice, formatDate, ORDER_STATUS_STYLES, titleCase } from '../../utils/format'
import { Package } from 'lucide-react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    orderService.myOrders()
      .then(r => { setOrders(r.data || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }
  useEffect(load, [])

  if (loading) return <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!orders.length) return <EmptyState icon={Package} title="No orders yet" description="When you place an order it will appear here." action={<Link to="/products" className="text-brand-600 font-medium hover:underline">Start shopping</Link>} />

  const columns = [
    { key: 'id', header: 'Order', render: o => <span className="font-medium">#{o.id}</span> },
    { key: 'createdAt', header: 'Date', render: o => formatDate(o.createdAt) },
    { key: 'items', header: 'Items', render: o => `${(o.items || []).reduce((s, i) => s + i.quantity, 0)} item(s)` },
    { key: 'totalAmount', header: 'Total', render: o => formatPrice(o.totalAmount) },
    { key: 'paymentMethod', header: 'Payment', render: o => titleCase(o.paymentMethod || 'COD') },
    { key: 'status', header: 'Status', render: o => <Badge className={ORDER_STATUS_STYLES[o.status] || 'bg-neutral-100'}>{titleCase(o.status)}</Badge> },
    { key: 'actions', header: '', render: o => <Link to={`/account/orders/${o.id}`} className="text-sm font-medium text-brand-600 hover:underline">View</Link> },
  ]

  return <DataTable columns={columns} rows={orders} />
}
