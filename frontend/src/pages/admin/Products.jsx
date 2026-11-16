import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { categoryService } from '../../services/catalogService'
import DataTable from '../../components/DataTable'
import { Badge, Button, Input, Select, Modal, Field, Textarea, Pagination, EmptyState, ErrorState, ConfirmDialog, Alert } from '../../components/ui'
import { formatPrice } from '../../utils/format'
import { Package } from 'lucide-react'

const EMPTY_FORM = { name: '', description: '', price: '', originalPrice: '', stock: '', imageUrl: '', badge: '', categoryId: '', active: true }

export default function AdminProducts() {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [input, setInput] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(null) // {mode:'create'} | {mode:'edit', product}
  const [deleting, setDeleting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminService.products({ page, size: 20, q: q || undefined, active: showInactive ? undefined : true })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [page, q, showInactive])

  useEffect(load, [load])
  useEffect(() => { categoryService.list().then(r => setCategories(r.data || [])).catch(() => {}) }, [])

  const columns = [
    { key: 'id', header: 'ID', render: p => `#${p.id}` },
    { key: 'name', header: 'Product', render: p => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-lg bg-neutral-100">
          {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div>
          <p className="font-medium text-neutral-900">{p.name}</p>
          <p className="text-xs text-neutral-500">{p.category?.name || 'Uncategorized'}</p>
        </div>
      </div>
    )},
    { key: 'price', header: 'Price', render: p => formatPrice(p.price) },
    { key: 'stock', header: 'Stock', render: p => (
      <span className={p.stock <= 0 ? 'font-medium text-red-600' : p.stock < 10 ? 'text-amber-600' : ''}>{p.stock}</span>
    )},
    { key: 'active', header: 'Status', render: p => <Badge className={p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}>{p.active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: '', render: p => (
      <div className="flex gap-1">
        <button onClick={() => setModal({ mode: 'edit', product: p })} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Edit"><Pencil size={15} /></button>
        {p.active && <button onClick={() => setDeleting(p)} className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600" aria-label="Deactivate"><Trash2 size={15} /></button>}
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-500">{data.totalElements ?? 0} products</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input type="checkbox" checked={showInactive} onChange={e => { setShowInactive(e.target.checked); setPage(0) }} className="rounded border-neutral-300" />
            Show inactive
          </label>
          <Button onClick={() => setModal({ mode: 'create' })}><Plus size={16} /> Add product</Button>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); setQ(input.trim()); setPage(0) }} className="flex gap-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Search products…" className="w-72 pl-9" />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <DataTable columns={columns} rows={data.content} loading={loading}
            empty={<EmptyState icon={Package} title="No products" description="Add your first product to get started." />} />
          <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}

      {modal && (
        <ProductFormModal modal={modal} categories={categories}
          onClose={() => setModal(null)}
          onSaved={(msg) => { setModal(null); setNotice({ type: 'success', text: msg }); load() }}
          onError={(m) => setNotice({ type: 'error', text: m })} />
      )}

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={async () => {
          try { await adminService.deleteProduct(deleting.id); setNotice({ type: 'success', text: 'Product deactivated.' }); load() }
          catch (e) { setNotice({ type: 'error', text: e.message }) }
        }}
        title="Deactivate product" message={`Deactivate "${deleting?.name}"? It will be hidden from the store.`} confirmLabel="Deactivate" danger />
    </div>
  )
}

function ProductFormModal({ modal, categories, onClose, onSaved, onError }) {
  const isEdit = modal.mode === 'edit'
  const p = modal.product || {}
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    name: p.name || '', description: p.description || '',
    price: p.price ?? '', originalPrice: p.originalPrice ?? '',
    stock: p.stock ?? '', imageUrl: p.imageUrl || '', badge: p.badge || '',
    categoryId: p.category?.id ?? '', active: p.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      originalPrice: form.originalPrice === '' ? null : Number(form.originalPrice),
      stock: Number(form.stock),
      imageUrl: form.imageUrl || null,
      badge: form.badge || null,
      active: form.active,
      category: form.categoryId ? { id: Number(form.categoryId) } : null,
    }
    try {
      if (isEdit) await adminService.updateProduct(p.id, payload)
      else await adminService.createProduct(payload)
      onSaved(isEdit ? 'Product updated.' : 'Product created.')
    } catch (err) { onError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit: ${p.name}` : 'Add product'} wide>
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *" className="sm:col-span-2"><Input value={form.name} onChange={set('name')} required /></Field>
          <Field label="Price *"><Input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required /></Field>
          <Field label="Original price"><Input type="number" step="0.01" min="0" value={form.originalPrice} onChange={set('originalPrice')} placeholder="For discounts" /></Field>
          <Field label="Stock *"><Input type="number" min="0" value={form.stock} onChange={set('stock')} required /></Field>
          <Field label="Badge"><Input value={form.badge} onChange={set('badge')} placeholder="e.g. NEW, SALE" /></Field>
          <Field label="Category">
            <Select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Uncategorized</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Image URL" className="sm:col-span-2"><Input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" /></Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={set('description')} className="min-h-[100px]" />
          </Field>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded border-neutral-300" />
              Active (visible in store)
            </label>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create product'}</Button>
        </div>
      </form>
    </Modal>
  )
}
