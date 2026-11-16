import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { adminService } from '../../services/adminService'
import DataTable from '../../components/DataTable'
import { Badge, Button, Input, Select, Pagination, ErrorState } from '../../components/ui'
import { formatPrice, formatDateTime, titleCase, ORDER_STATUS_STYLES } from '../../utils/format'

const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function Orders() {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminService.orders({
      page, size: 20,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      search: search || undefined,
    }).then(r => { setData(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [page, status, from, to, search])

  useEffect(load, [load])

  const columns = [
    { key: 'id', header: 'Order', render: o => <Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-600 hover:underline">#{o.id}</Link> },
    { key: 'userId', header: 'Customer', render: o => <Link to={`/admin/customers/${o.userId}`} className="text-neutral-700 hover:text-brand-700">User #{o.userId}</Link> },
    { key: 'createdAt', header: 'Date', render: o => formatDateTime(o.createdAt) },
    { key: 'totalAmount', header: 'Total', render: o => formatPrice(o.totalAmount) },
    { key: 'paymentMethod', header: 'Payment', render: o => titleCase(o.paymentMethod || 'COD') },
    { key: 'status', header: 'Status', render: o => <Badge className={ORDER_STATUS_STYLES[o.status] || ''}>{titleCase(o.status)}</Badge> },
    { key: 'actions', header: '', render: o => <Link to={`/admin/orders/${o.id}`} className="text-sm font-medium text-brand-600 hover:underline">Details</Link> },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
        <p className="text-sm text-neutral-500">{data.totalElements ?? 0} orders</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={e => { e.preventDefault(); setSearch(input.trim()); setPage(0) }} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Order # or customer…" className="w-56 pl-9" />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }} className="w-40">
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
        <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0) }} className="w-40" aria-label="From date" />
        <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0) }} className="w-40" aria-label="To date" />
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <DataTable columns={columns} rows={data.content} loading={loading} empty="No orders found" />
          <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  )
}
