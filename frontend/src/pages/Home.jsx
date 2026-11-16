import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { productService, categoryService } from '../services/catalogService'
import ProductGrid, { ProductGridSkeleton } from '../components/ProductGrid'
import { Button } from '../components/ui'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [newest, setNewest] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      categoryService.list().catch(() => ({ data: [] })),
      productService.list({ size: 8, sort: 'newest' }).catch(() => ({ data: { content: [] } })),
      productService.list({ size: 8 }).catch(() => ({ data: { content: [] } })),
    ]).then(([cats, feat, nw]) => {
      if (cancelled) return
      setCategories(cats.data || [])
      setFeatured(feat.data?.content || [])
      setNewest(nw.data?.content || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">New season collection</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Quality products, delivered to your door
          </h1>
          <p className="mt-4 max-w-xl text-neutral-300">
            Browse our curated catalog of everyday essentials at honest prices.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/products"><Button size="lg">Shop now <ArrowRight size={18} /></Button></Link>
            <Link to="/products?sort=price_asc"><Button size="lg" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">Best prices</Button></Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {!loading && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-2xl font-bold text-neutral-900">Shop by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map(c => (
              <Link key={c.id} to={`/products?categoryId=${c.id}`}
                className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-5 text-center transition-shadow hover:shadow-md">
                {c.imageUrl
                  ? <img src={c.imageUrl} alt={c.name} className="mb-3 h-14 w-14 rounded-full object-cover" />
                  : <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">{c.name[0]}</div>}
                <span className="text-sm font-medium text-neutral-800">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Featured products</h2>
          <Link to="/products" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>
        </div>
        <div className="mt-6">
          {loading ? <ProductGridSkeleton count={8} /> : <ProductGrid products={featured} />}
        </div>
      </section>

      {/* Newest */}
      {!loading && newest.length > 0 && newest[0]?.id !== featured[0]?.id && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">New arrivals</h2>
            <Link to="/products?sort=newest" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          <div className="mt-6"><ProductGrid products={newest} /></div>
        </section>
      )}

      {/* Trust badges */}
      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3">
          {[
            { icon: Truck, title: 'Fast delivery', text: 'Free shipping on orders over $50' },
            { icon: ShieldCheck, title: 'Secure checkout', text: 'Your data is protected' },
            { icon: RotateCcw, title: 'Easy returns', text: '30-day return policy' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-50 p-2.5"><Icon size={20} className="text-brand-600" /></div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                <p className="text-sm text-neutral-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
