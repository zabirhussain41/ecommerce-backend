import { useEffect, useState, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts'
import { analyticsService } from '../../services/analyticsService'
import { Badge, ErrorState, Select, Skeleton } from '../../components/ui'
import { formatPrice, titleCase } from '../../utils/format'

const SEGMENT_STYLES = {
  HIGH_VALUE: 'bg-purple-100 text-purple-800', REPEAT: 'bg-blue-100 text-blue-800',
  RECENT: 'bg-emerald-100 text-emerald-800', NEW: 'bg-cyan-100 text-cyan-800',
  INACTIVE: 'bg-neutral-200 text-neutral-600', NONE: 'bg-neutral-100 text-neutral-500',
}

export default function Analytics() {
  const [groupBy, setGroupBy] = useState('day')
  const [days, setDays] = useState(30)
  const [sales, setSales] = useState([])
  const [cust, setCust] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      analyticsService.sales({ groupBy }),
      analyticsService.customers(days).catch(() => ({ data: null })),
    ]).then(([s, c]) => {
      setSales(s.data || [])
      setCust(c.data)
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [groupBy, days])

  useEffect(load, [load])

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-80" /><Skeleton className="h-64" /></div>
  if (error) return <ErrorState message={error} onRetry={load} />

  const regData = (cust?.registrations || []).map(r => ({ ...r, date: r.date.slice(5) }))
  const segmentData = Object.entries(cust?.segments || {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: titleCase(name), value }))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Analytics & reports</h1>
          <p className="text-sm text-neutral-500">Sales, orders and customer trends</p>
        </div>
        <div className="flex gap-3">
          <Select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="w-36" aria-label="Group sales by">
            <option value="day">By day</option>
            <option value="week">By week</option>
            <option value="month">By month</option>
          </Select>
          <Select value={days} onChange={e => setDays(Number(e.target.value))} className="w-40" aria-label="Customer analytics window">
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </Select>
        </div>
      </div>

      {/* Sales */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Sales & order volume</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sales} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [n === 'revenue' ? formatPrice(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
              <Legend />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev2)" strokeWidth={2} name="Revenue" />
              <Area yAxisId="ord" type="monotone" dataKey="orderCount" stroke="#3b5bdb" fill="none" strokeWidth={2} name="Orders" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Customer acquisition */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold text-neutral-900">New customer registrations</h2>
          <div className="mt-4 h-64">
            {regData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b5bdb" radius={[3, 3, 0, 0]} name="Signups" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="py-20 text-center text-sm text-neutral-400">No registrations in this period</p>}
          </div>
        </section>

        {/* Segments */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold text-neutral-900">Customer segments</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Definitions: High-value = spend ≥ $500 · Repeat = 2+ orders · Recent = ordered ≤30d ·
            New = registered ≤30d, no orders · Inactive = no order in 90d.
          </p>
          <div className="mt-4 space-y-2.5">
            {Object.entries(cust?.segments || {}).map(([seg, count]) => (
              <div key={seg} className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2.5">
                <Badge className={SEGMENT_STYLES[seg] || SEGMENT_STYLES.NONE}>{titleCase(seg)}</Badge>
                <span className="font-semibold text-neutral-900">{count}</span>
              </div>
            ))}
          </div>
          {cust && (
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 text-sm">
              <div><p className="text-neutral-500">Customers with orders</p><p className="font-semibold">{cust.customersWithOrders}</p></div>
              <div><p className="text-neutral-500">Repeat purchase rate</p><p className="font-semibold">{cust.repeatPurchaseRate}%</p></div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
