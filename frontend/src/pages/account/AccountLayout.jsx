import { NavLink, Outlet } from 'react-router-dom'
import { User, MapPin, Package, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const TABS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/orders', label: 'Orders', icon: Package },
]

export default function AccountLayout() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">My account</h1>
        <p className="mt-1 text-sm text-neutral-500">Signed in as <span className="font-medium text-neutral-700">{user?.username}</span></p>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-2 md:flex-col">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
