import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { adminService } from '../../services/adminService'
import DataTable from '../../components/DataTable'
import { Badge, Button, Input, Pagination, EmptyState, ErrorState } from '../../components/ui'
import { formatPrice, formatDate, titleCase } from '../../utils/format'

const SEGMENT_STYLES = {
  HIGH_VALUE: 'bg-purple-100 text-purple-800',
  REPEAT: 'bg-blue-100 text-blue-800',
  RECENT: 'bg-emerald-100 text-emerald-800',
  NEW: 'bg-cyan-100 text-cyan-800',
  INACTIVE: 'bg-neutral-200 text-neutral-600',
  NONE: 'bg-neutral-100 text-neutral-500',
}

export default function Customers() {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminService.customers({ page, size: 20, search: search || undefined })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [page, search])

  useEffect(load, [load])

  const columns = [
    { key: 'id', header: 'ID', render: c => `#${c.id}` },
    { key: 'name', header: 'Customer', render: c => (
      <div>
        <p className="font-medium text-neutral-900">{c.fullName || c.username}</p>
        <p className="text-xs text-neutral-500">@{c.username}{c.email ? ` · ${c.email}` : ''}</p>
      </div>
    )},
    { key: 'phone', header: 'Phone', render: c => c.phone || '—' },
    { key: 'createdAt', header: 'Joined', render: c => formatDate(c.createdAt) },
    { key: 'orderCount', header: 'Orders', render: c => c.orderCount },
    { key: 'totalSpent', header: 'Total spent', render: c => formatPrice(c.totalSpent) },
    { key: 'lastOrderAt', header: 'Last order', render: c => formatDate(c.lastOrderAt) },
    { key: 'segment', header: 'Segment', render: c => <Badge className={SEGMENT_STYLES[c.segment] || SEGMENT_STYLES.NONE}>{titleCase(c.segment)}</Badge> },
    { key: 'actions', header: '', render: c => <Link to={`/admin/customers/${c.id}`} className="text-sm font-medium text-brand-600 hover:underline">View</Link> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Customers</h1>
          <p className="text-sm text-neutral-500">{data.totalElements ?? 0} registered customers</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); setSearch(input.trim()); setPage(0) }} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Search name, email, username…"
              className="w-72 pl-9" />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <DataTable columns={columns} rows={data.content} loading={loading} empty="No customers found" />
          <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  )
}
