import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { crmService } from '../../services/crmService'
import DataTable from '../../components/DataTable'
import { Badge, Button, Input, Select, Modal, Field, Textarea, Pagination, EmptyState, ErrorState, Alert } from '../../components/ui'
import { formatDate, titleCase } from '../../utils/format'
import { CheckSquare } from 'lucide-react'

const PRIORITY_STYLES = {
  HIGH: 'bg-red-100 text-red-700', MEDIUM: 'bg-amber-100 text-amber-800', LOW: 'bg-neutral-100 text-neutral-600',
}
const STATUS_STYLES = {
  PENDING: 'bg-blue-100 text-blue-800', IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800', CANCELLED: 'bg-red-100 text-red-700',
}

export default function Tasks() {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [showOverdue, setShowOverdue] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    crmService.tasks({
      page, size: 20,
      status: status || undefined,
      priority: priority || undefined,
      dueBefore: showOverdue ? new Date().toISOString().slice(0, 10) : undefined,
    }).then(r => { setData(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [page, status, priority, showOverdue])

  useEffect(load, [load])

  const updateStatus = async (task, newStatus) => {
    setActionError(null)
    try { await crmService.updateTask(task.id, { status: newStatus }); load() }
    catch (e) { setActionError(e.message) }
  }

  const columns = [
    { key: 'title', header: 'Task', render: t => (
      <div>
        <p className="font-medium text-neutral-900">{t.title}</p>
        {t.description && <p className="line-clamp-1 text-xs text-neutral-500">{t.description}</p>}
      </div>
    )},
    { key: 'customerId', header: 'Customer', render: t => t.customerId ? <a href={`/admin/customers/${t.customerId}`} className="text-brand-600 hover:underline">#{t.customerId}</a> : '—' },
    { key: 'priority', header: 'Priority', render: t => <Badge className={PRIORITY_STYLES[t.priority] || ''}>{titleCase(t.priority)}</Badge> },
    { key: 'status', header: 'Status', render: t => <Badge className={STATUS_STYLES[t.status] || ''}>{titleCase(t.status)}</Badge> },
    { key: 'dueDate', header: 'Due', render: t => {
      const overdue = t.dueDate && t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date(new Date().toDateString())
      return <span className={overdue ? 'font-medium text-red-600' : ''}>{formatDate(t.dueDate)}{overdue ? ' ⚠' : ''}</span>
    } },
    { key: 'assigneeUsername', header: 'Assignee', render: t => t.assigneeUsername || '—' },
    { key: 'actions', header: '', render: t => (
      <div className="flex gap-1">
        {t.status === 'PENDING' && <Button size="sm" variant="secondary" onClick={() => updateStatus(t, 'IN_PROGRESS')}>Start</Button>}
        {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
          <Button size="sm" onClick={() => updateStatus(t, 'COMPLETED')}>Complete</Button>
        )}
        {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
          <Button size="sm" variant="ghost" onClick={() => updateStatus(t, 'CANCELLED')}>Cancel</Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Follow-up tasks</h1>
          <p className="text-sm text-neutral-500">{data.totalElements ?? 0} tasks</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New task</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }} className="w-44">
          <option value="">All statuses</option>
          {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
        <Select value={priority} onChange={e => { setPriority(e.target.value); setPage(0) }} className="w-40">
          <option value="">All priorities</option>
          {['LOW', 'MEDIUM', 'HIGH'].map(p => <option key={p} value={p}>{titleCase(p)}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" checked={showOverdue} onChange={e => { setShowOverdue(e.target.checked); setPage(0) }} className="rounded border-neutral-300" />
          Due before today
        </label>
      </div>

      {actionError && <Alert onClose={() => setActionError(null)}>{actionError}</Alert>}
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <DataTable columns={columns} rows={data.content} loading={loading} empty="No tasks found" />
          <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); setPage(0); load() }} onError={setActionError} />
    </div>
  )
}

function CreateTaskModal({ open, onClose, onSaved, onError }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', customerId: '', assigneeUsername: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', customerId: '', assigneeUsername: '' }) }, [open])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await crmService.createTask({
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
        customerId: form.customerId ? Number(form.customerId) : null,
        assigneeUsername: form.assigneeUsername || null,
      })
      onSaved()
    } catch (err) { onError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create task">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title *"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
        <Field label="Description"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            </Select>
          </Field>
          <Field label="Due date"><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Customer ID (optional)"><Input type="number" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} placeholder="e.g. 12" /></Field>
          <Field label="Assignee"><Input value={form.assigneeUsername} onChange={e => setForm({ ...form, assigneeUsername: e.target.value })} placeholder="staff username" /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}
