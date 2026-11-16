import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ShoppingBag, Search, User, Menu, X, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products')
    setMobileOpen(false)
  }

  const linkCls = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-neutral-600 hover:text-neutral-900'}`

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-neutral-900">
          <Store size={22} className="text-brand-600" />
          <span className="hidden sm:inline">ShopX</span>
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-full border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavLink to="/products" className={linkCls}>Products</NavLink>
          {user && <NavLink to="/account" className={linkCls}>Account</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}

          <Link to="/cart" className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900" aria-label="Cart">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 sm:block">Login</Link>
              <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Sign up
              </Link>
            </>
          )}
          <button className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 md:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-4 text-sm focus:outline-none" />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            <NavLink to="/products" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMobileOpen(false)}>Products</NavLink>
            {user && <NavLink to="/account" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMobileOpen(false)}>Account</NavLink>}
            {isAdmin && <NavLink to="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMobileOpen(false)}>Admin</NavLink>}
            {!user && <NavLink to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMobileOpen(false)}>Login</NavLink>}
          </div>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-neutral-900"><Store size={20} className="text-brand-600" /> ShopX</div>
          <p className="mt-2 text-sm text-neutral-500">Quality products, honest prices, fast delivery.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">Shop</h4>
          <ul className="mt-2 space-y-1 text-sm text-neutral-500">
            <li><Link to="/products" className="hover:text-neutral-900">All products</Link></li>
            <li><Link to="/products?sort=price_asc" className="hover:text-neutral-900">Price: low to high</Link></li>
            <li><Link to="/products?sort=newest" className="hover:text-neutral-900">New arrivals</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">Account</h4>
          <ul className="mt-2 space-y-1 text-sm text-neutral-500">
            <li><Link to="/account" className="hover:text-neutral-900">My account</Link></li>
            <li><Link to="/account/orders" className="hover:text-neutral-900">Order history</Link></li>
            <li><Link to="/cart" className="hover:text-neutral-900">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">Support</h4>
          <ul className="mt-2 space-y-1 text-sm text-neutral-500">
            <li>support@shopx.example</li>
            <li>Mon–Fri, 9am–6pm</li>
            <li>Cash on delivery available</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} ShopX. All rights reserved.
      </div>
    </footer>
  )
}

export default function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
