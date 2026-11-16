import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ListOrdered, DollarSign, TrendingUp, UserPlus, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { analyticsService } from '../../services/analyticsService'
import { adminService } from '../../services/adminService'
import DataTable from '../../components/DataTable'
import { Badge, Skeleton, ErrorState } from '../../components/ui'
import { formatPrice, formatDateTime, formatDate, titleCase, ORDER_STATUS_STYLES } from '../../utils/format'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#ef4444']

function StatCard({ icon: Icon, label, value, sub, to }) {
  const inner = (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="rounded-lg bg-brand-50 p-3"><Icon size={20} className="text-brand-600" /></div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="truncate text-xl font-bold text-neutral-900">{value}</p>
        {sub && <p className="text-xs text-neutral-500">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block transition-shadow hover:shadow-sm">{inner}</Link> : inner
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      analyticsService.summary(),
      analyticsService.sales({ groupBy: 'day' }).catch(() => ({ data: [] })),
    ]).then(([s, sa]) => {
      setSummary(s.data)
      setSales(sa.data || [])
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }
  useEffect(load, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-72" />
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!summary) return null

  const statusData = Object.entries(summary.ordersByStatus || {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: titleCase(name), value }))

  const orderCols = [
    { key: 'id', header: 'Order', render: o => <span className="font-medium">#{o.id}</span> },
    { key: 'userId', header: 'Customer', render: o => `User #${o.userId}` },
    { key: 'createdAt', header: 'Date', render: o => formatDateTime(o.createdAt) },
    { key: 'totalAmount', header: 'Total', render: o => formatPrice(o.totalAmount) },
    { key: 'status', header: 'Status', render: o => <Badge className={ORDER_STATUS_STYLES[o.status] || ''}>{titleCase(o.status)}</Badge> },
  ]

  const customerCols = [
    { key: 'id', header: 'Customer', render: c => (
      <div><p className="font-medium">{c.fullName || c.username}</p><p className="text-xs text-neutral-500">@{c.username}</p></div>
    )},
    { key: 'createdAt', header: 'Joined', render: c => formatDate(c.createdAt) },
    { key: 'totalSpent', header: 'Spent', render: c => formatPrice(c.totalSpent) },
    { key: 'segment', header: 'Segment', render: c => <Badge className="bg-neutral-100 text-neutral-700">{titleCase(c.segment)}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Store performance at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Customers" value={summary.totalCustomers} sub={`+${summary.newCustomers30d} in 30d`} to="/admin/customers" />
        <StatCard icon={ListOrdered} label="Orders" value={summary.totalOrders} sub={`${summary.orders30d} in last 30d`} to="/admin/orders" />
        <StatCard icon={DollarSign} label="Revenue" value={formatPrice(summary.totalRevenue)} sub={`${formatPrice(summary.revenue30d)} last 30d`} />
        <StatCard icon={TrendingUp} label="Avg order value" value={formatPrice(summary.avgOrderValue)} />
      </div>

      {(summary.overdueTasks ?? 0) > 0 && (
        <Link to="/admin/tasks" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 hover:bg-amber-100">
          <AlertTriangle size={18} /> {summary.overdueTasks} overdue task{summary.overdueTasks === 1 ? '' : 's'} need attention
        </Link>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 xl:col-span-2">
          <h2 className="font-semibold text-neutral-900">Sales — last 30 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b5bdb" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b5bdb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? formatPrice(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b5bdb" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold text-neutral-900">Orders by status</h2>
          <div className="mt-2 h-56">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="py-16 text-center text-sm text-neutral-400">No orders yet</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold text-neutral-900">Recent orders</h2>
          <DataTable columns={orderCols} rows={summary.recentOrders || []} empty="No orders yet" />
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-neutral-900">New customers</h2>
          <DataTable columns={customerCols} rows={summary.recentCustomers || []} empty="No customers yet" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-neutral-900">Top products</h2>
        <DataTable
          rows={(summary.topProducts || []).map((p, i) => ({ ...p, id: p.productId }))}
          empty="No sales yet"
          columns={[
            { key: 'name', header: 'Product', render: p => <span className="font-medium">{p.name}</span> },
            { key: 'quantity', header: 'Units sold' },
            { key: 'revenue', header: 'Revenue', render: p => formatPrice(p.revenue) },
          ]}
        />
      </div>
    </div>
  )
}
