import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, ListOrdered, Package, Tags,
  CheckSquare, BarChart3, LogOut, Store, User as UserIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/admin/orders', label: 'Orders', icon: ListOrdered },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="flex w-60 flex-col border-r border-neutral-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5">
          <Store size={20} className="text-brand-600" />
          <span className="font-bold text-neutral-900">ShopX Admin</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center gap-2 px-2 py-1 text-sm text-neutral-600">
            <UserIcon size={16} />
            <span className="truncate">{user?.username}</span>
          </div>
          <div className="mt-1 flex gap-1">
            <Link to="/" className="flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-medium text-neutral-600 hover:bg-neutral-100">
              View store
            </Link>
            <button onClick={logout}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
