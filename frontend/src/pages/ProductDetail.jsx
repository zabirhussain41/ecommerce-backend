import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Zap, Check, Package } from 'lucide-react'
import { productService } from '../services/catalogService'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import ProductGrid from '../components/ProductGrid'
import { Button, Alert, Skeleton, ErrorState } from '../components/ui'
import { formatPrice } from '../utils/format'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productService.get(id)
      .then(res => {
        if (cancelled) return
        setProduct(res.data)
        setQty(1)
        setLoading(false)
        productService.list({ size: 4, categoryId: res.data.category?.id })
          .then(r => {
            if (!cancelled) setRelated((r.data?.content || []).filter(p => p.id !== res.data.id).slice(0, 4))
          })
          .catch(() => {})
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message || 'Product not found')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }
  if (error || !product) return <div className="mx-auto max-w-7xl px-4 py-16"><ErrorState message={error} /></div>

  const outOfStock = (product.stock ?? 0) <= 0
  const maxQty = Math.min(product.stock ?? 99, 99)

  const handleAdd = async (buyNow = false) => {
    if (!user) { navigate('/login', { state: { from: `/products/${id}` } }); return }
    setAdding(true)
    setNotice(null)
    try {
      await add(product.id, qty)
      if (buyNow) navigate('/checkout')
      else setNotice({ type: 'success', text: `Added ${qty} × ${product.name} to cart.` })
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">Home</Link> /{' '}
        <Link to="/products" className="hover:text-neutral-900">Products</Link> /{' '}
        <span className="text-neutral-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            : <div className="flex h-full items-center justify-center text-neutral-300"><Package size={64} /></div>}
        </div>

        <div>
          <p className="text-sm text-neutral-500">{product.category?.name || 'Uncategorized'}</p>
          <h1 className="mt-1 text-3xl font-bold text-neutral-900">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="text-lg text-neutral-400 line-through">{formatPrice(product.originalPrice)}</span>
            )}
            {product.badge && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{product.badge}</span>}
          </div>

          <p className={`mt-3 text-sm font-medium ${outOfStock ? 'text-red-600' : 'text-emerald-600'}`}>
            {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </p>

          {product.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-neutral-600">{product.description}</p>
          )}

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-neutral-300">
              <button className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                disabled={qty >= maxQty} onClick={() => setQty(q => Math.min(maxQty, q + 1))} aria-label="Increase quantity">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {notice && <div className="mt-4"><Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert></div>}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1" loading={adding} disabled={outOfStock}
              onClick={() => handleAdd(false)}>
              <ShoppingCart size={18} /> Add to cart
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" loading={adding} disabled={outOfStock}
              onClick={() => handleAdd(true)}>
              <Zap size={18} /> Buy now
            </Button>
          </div>
          {!user && <p className="mt-3 text-xs text-neutral-500 flex items-center gap-1"><Check size={12} /> You'll be asked to log in to purchase.</p>}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-neutral-900">You may also like</h2>
          <div className="mt-6"><ProductGrid products={related} /></div>
        </section>
      )}
    </div>
  )
}
