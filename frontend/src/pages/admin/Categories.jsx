import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import DataTable from '../../components/DataTable'
import { Button, Input, Modal, Field, ConfirmDialog, Alert, ErrorState } from '../../components/ui'
import { Tags } from 'lucide-react'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // {mode:'create'} | {mode:'edit', category}
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', imageUrl: '' })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    adminService.categories()
      .then(r => { setCategories(r.data || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])
  useEffect(load, [load])

  const openCreate = () => { setForm({ name: '', slug: '', imageUrl: '' }); setModal({ mode: 'create' }) }
  const openEdit = (c) => { setForm({ name: c.name, slug: c.slug || '', imageUrl: c.imageUrl || '' }); setModal({ mode: 'edit', category: c }) }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.mode === 'create') await adminService.createCategory(form)
      else await adminService.updateCategory(modal.category.id, form)
      setModal(null)
      setNotice({ type: 'success', text: 'Category saved.' })
      load()
    } catch (err) { setNotice({ type: 'error', text: err.message }) } finally { setSaving(false) }
  }

  const columns = [
    { key: 'id', header: 'ID', render: c => `#${c.id}` },
    { key: 'name', header: 'Name', render: c => <span className="font-medium">{c.name}</span> },
    { key: 'slug', header: 'Slug', render: c => <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{c.slug}</code> },
    { key: 'imageUrl', header: 'Image', render: c => c.imageUrl ? <img src={c.imageUrl} alt="" className="h-8 w-8 rounded object-cover" /> : '—' },
    { key: 'actions', header: '', render: c => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(c)} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Edit"><Pencil size={15} /></button>
        <button onClick={() => setDeleting(c)} className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categories</h1>
          <p className="text-sm text-neutral-500">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add category</Button>
      </div>

      {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <DataTable columns={columns} rows={categories} loading={loading}
          empty={<div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500"><Tags className="mx-auto mb-2 text-neutral-300" size={28} />No categories yet</div>} />
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit category' : 'Add category'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Slug" hint="Leave blank to auto-generate"><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. home-garden" /></Field>
          <Field label="Image URL"><Input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={async () => {
          try { await adminService.deleteCategory(deleting.id); setNotice({ type: 'success', text: 'Category deleted.' }); load() }
          catch (e) { setNotice({ type: 'error', text: e.message }) }
        }}
        title="Delete category" message={`Delete "${deleting?.name}"? This fails if products use it.`} confirmLabel="Delete" danger />
    </div>
  )
}
