import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { productService, categoryService } from '../services/catalogService'
import ProductGrid, { ProductGridSkeleton } from '../components/ProductGrid'
import { Pagination, EmptyState, ErrorState, Select, Input, Button } from '../components/ui'
import { PackageSearch } from 'lucide-react'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const page = Number(params.get('page') || 0)
  const size = Number(params.get('size') || 12)
  const q = params.get('q') || ''
  const categoryId = params.get('categoryId') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const sort = params.get('sort') || ''

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value === '' || value == null) next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  useEffect(() => {
    categoryService.list().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    productService.list({ page, size, categoryId: categoryId || undefined, minPrice, maxPrice, sort, q })
      .then(res => {
        if (cancelled) return
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message || 'Failed to load products')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, size, q, categoryId, minPrice, maxPrice, sort])

  const clearFilters = () => setParams(new URLSearchParams())

  const filterPanel = (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-neutral-500">Category</label>
        <Select value={categoryId} onChange={e => update('categoryId', e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-neutral-500">Min price</label>
          <Input type="number" min="0" step="0.01" placeholder="0" value={minPrice} onChange={e => update('minPrice', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-neutral-500">Max price</label>
          <Input type="number" min="0" step="0.01" placeholder="∞" value={maxPrice} onChange={e => update('maxPrice', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-neutral-500">Sort by</label>
        <Select value={sort} onChange={e => update('sort', e.target.value)}>
          <option value="">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </Select>
      </div>
      {(categoryId || minPrice || maxPrice || sort) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
      {q && <p className="mt-1 text-sm text-neutral-500">Results for “{q}”</p>}

      {/* Search bar */}
      <form
        className="mt-4 flex gap-2"
        onSubmit={e => {
          e.preventDefault()
          const v = new FormData(e.target).get('q')
          update('q', v)
        }}
      >
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input name="q" defaultValue={q} placeholder="Search products…" className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
        <Button type="button" variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal size={16} /> Filters
        </Button>
      </form>

      <div className="mt-6 flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">{filterPanel}</div>
        </aside>

        {/* Mobile filters */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="text-neutral-500">✕</button>
              </div>
              {filterPanel}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-neutral-500">
            {loading ? 'Loading…' : `${data.totalElements ?? 0} products`}
          </p>
          {error ? (
            <ErrorState message={error} onRetry={() => setParams({ ...params })} />
          ) : loading ? (
            <ProductGridSkeleton />
          ) : data.content?.length ? (
            <>
              <ProductGrid products={data.content} />
              <Pagination page={page} totalPages={data.totalPages} onPage={p => update('page', p)} />
            </>
          ) : (
            <EmptyState icon={PackageSearch} title="No products found"
              description="Try adjusting your search or filters."
              action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} />
          )}
        </div>
      </div>
    </div>
  )
}
