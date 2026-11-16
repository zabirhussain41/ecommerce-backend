import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, CalendarDays, ShoppingBag, DollarSign, Repeat, StickyNote, CheckSquare } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { crmService } from '../../services/crmService'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/DataTable'
import { Badge, Button, Field, Input, Select, Textarea, Modal, Skeleton, ErrorState, EmptyState, Alert, Pagination } from '../../components/ui'
import { formatPrice, formatDate, formatDateTime, titleCase, ORDER_STATUS_STYLES } from '../../utils/format'

const SEGMENT_STYLES = {
  HIGH_VALUE: 'bg-purple-100 text-purple-800', REPEAT: 'bg-blue-100 text-blue-800',
  RECENT: 'bg-emerald-100 text-emerald-800', NEW: 'bg-cyan-100 text-cyan-800',
  INACTIVE: 'bg-neutral-200 text-neutral-600', NONE: 'bg-neutral-100 text-neutral-500',
}

const INTERACTION_TYPES = ['NOTE', 'CALL', 'EMAIL', 'MEETING']
const INTERACTION_COLORS = {
  NOTE: 'bg-neutral-100 text-neutral-700', CALL: 'bg-blue-100 text-blue-800',
  EMAIL: 'bg-purple-100 text-purple-800', MEETING: 'bg-amber-100 text-amber-800',
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState({ content: [], totalPages: 0 })
  const [orderPage, setOrderPage] = useState(0)
  const [interactions, setInteractions] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [actionError, setActionError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      adminService.customer(id),
      adminService.customerOrders(id, { page: orderPage, size: 5 }),
      crmService.interactions(id).catch(() => ({ data: [] })),
      crmService.tasks({ customerId: id, size: 20 }).catch(() => ({ data: { content: [] } })),
    ]).then(([c, o, i, t]) => {
      setCustomer(c.data)
      setOrders(o.data)
      setInteractions(i.data || [])
      setTasks(t.data?.content || [])
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [id, orderPage])

  useEffect(load, [load])

  const orderCols = [
    { key: 'id', header: 'Order', render: o => <Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-600 hover:underline">#{o.id}</Link> },
    { key: 'createdAt', header: 'Date', render: o => formatDate(o.createdAt) },
    { key: 'totalAmount', header: 'Total', render: o => formatPrice(o.totalAmount) },
    { key: 'status', header: 'Status', render: o => <Badge className={ORDER_STATUS_STYLES[o.status] || ''}>{titleCase(o.status)}</Badge> },
  ]

  if (loading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!customer) return null

  return (
    <div className="space-y-6">
      <Link to="/admin/customers" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft size={15} /> Back to customers
      </Link>

      {/* Profile card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {(customer.fullName || customer.username || '?')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{customer.fullName || customer.username}</h1>
                <p className="text-sm text-neutral-500">@{customer.username}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
              {customer.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {customer.email}</span>}
              {customer.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {customer.phone}</span>}
              <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Joined {formatDate(customer.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={SEGMENT_STYLES[customer.segment] || SEGMENT_STYLES.NONE}>{titleCase(customer.segment)}</Badge>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setNoteOpen(true)}><StickyNote size={14} /> Add note</Button>
              <Button size="sm" onClick={() => setTaskOpen(true)}><CheckSquare size={14} /> New task</Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-4">
          {[
            { icon: ShoppingBag, label: 'Orders', value: customer.orderCount },
            { icon: DollarSign, label: 'Total spent', value: formatPrice(customer.totalSpent) },
            { icon: Repeat, label: 'Repeat buyer', value: customer.orderCount >= 2 ? 'Yes' : 'No' },
            { icon: CalendarDays, label: 'Last order', value: formatDate(customer.lastOrderAt) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={18} className="text-neutral-400" />
              <div><p className="text-xs text-neutral-500">{label}</p><p className="font-semibold text-neutral-900">{value}</p></div>
            </div>
          ))}
        </div>
      </div>

      {actionError && <Alert onClose={() => setActionError(null)}>{actionError}</Alert>}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Orders */}
        <div>
          <h2 className="mb-3 font-semibold text-neutral-900">Order history</h2>
          <DataTable columns={orderCols} rows={orders.content} empty="No orders yet" />
          <Pagination page={orderPage} totalPages={orders.totalPages} onPage={setOrderPage} />
        </div>

        {/* Activity timeline */}
        <div>
          <h2 className="mb-3 font-semibold text-neutral-900">Activity & notes</h2>
          <div className="space-y-3">
            {interactions.length === 0 && <EmptyState title="No interactions recorded" description="Log calls, emails, meetings and notes about this customer." />}
            {interactions.map(i => (
              <div key={i.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <Badge className={INTERACTION_COLORS[i.type] || INTERACTION_COLORS.NOTE}>{titleCase(i.type)}</Badge>
                  <span className="text-xs text-neutral-400">{formatDateTime(i.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-700 whitespace-pre-line">{i.description}</p>
                <p className="mt-2 text-xs text-neutral-400">
                  by {i.staffUsername}
                  {i.dueDate && ` · due ${formatDate(i.dueDate)}`}
                  {i.completed && ' · completed'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div>
        <h2 className="mb-3 font-semibold text-neutral-900">Follow-up tasks</h2>
        <DataTable
          rows={tasks}
          empty="No tasks for this customer"
          columns={[
            { key: 'title', header: 'Task', render: t => <span className="font-medium">{t.title}</span> },
            { key: 'priority', header: 'Priority', render: t => <Badge className={t.priority === 'HIGH' ? 'bg-red-100 text-red-700' : t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-600'}>{titleCase(t.priority)}</Badge> },
            { key: 'status', header: 'Status', render: t => <Badge className={t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : t.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'}>{titleCase(t.status)}</Badge> },
            { key: 'dueDate', header: 'Due', render: t => formatDate(t.dueDate) },
          ]}
        />
      </div>

      <NoteModal open={noteOpen} onClose={() => setNoteOpen(false)} customerId={id}
        onSaved={() => { setNoteOpen(false); load() }} onError={setActionError} />
      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} customerId={id} defaultAssignee={user?.username}
        onSaved={() => { setTaskOpen(false); load() }} onError={setActionError} />
    </div>
  )
}

function NoteModal({ open, onClose, customerId, onSaved, onError }) {
  const [type, setType] = useState('NOTE')
  const [desc, setDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await crmService.addInteraction(customerId, { type, description: desc, dueDate: dueDate || null })
      setDesc(''); setDueDate(''); setType('NOTE')
      onSaved()
    } catch (err) { onError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add interaction">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Type">
          <Select value={type} onChange={e => setType(e.target.value)}>
            {INTERACTION_TYPES.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
          </Select>
        </Field>
        <Field label="Description *">
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} required
            placeholder="What happened?" className="min-h-[100px]" />
        </Field>
        <Field label="Due date (optional)">
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}

function TaskModal({ open, onClose, customerId, defaultAssignee, onSaved, onError }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState(defaultAssignee || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setAssignee(defaultAssignee || '') }, [open, defaultAssignee])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await crmService.createTask({
        title, description: desc || null, priority, dueDate: dueDate || null,
        customerId: Number(customerId), assigneeUsername: assignee || null,
      })
      setTitle(''); setDesc(''); setPriority('MEDIUM'); setDueDate('')
      onSaved()
    } catch (err) { onError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create follow-up task">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title *"><Input value={title} onChange={e => setTitle(e.target.value)} required /></Field>
        <Field label="Description"><Textarea value={desc} onChange={e => setDesc(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <Select value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            </Select>
          </Field>
          <Field label="Due date"><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
        </div>
        <Field label="Assignee"><Input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="staff username" /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create task</Button>
        </div>
      </form>
    </Modal>
  )
}
