import { X, Loader2 } from 'lucide-react'

// ---------- Button ----------
export function Button({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
    secondary: 'bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50 focus-visible:ring-neutral-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

// ---------- Form primitives ----------
export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className="mb-4">
      {label && <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 ' +
  'placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ' +
  'disabled:bg-neutral-100 disabled:cursor-not-allowed'

export function Input({ className = '', ...props }) {
  return <input className={`${inputCls} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return <select className={`${inputCls} ${className}`} {...props}>{children}</select>
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputCls} min-h-[80px] ${className}`} {...props} />
}

// ---------- Feedback ----------
export function Alert({ type = 'error', children, onClose }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  }
  return (
    <div className={`flex items-start justify-between gap-2 rounded-lg border px-4 py-3 text-sm ${styles[type]}`} role="alert">
      <span>{children}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss"><X size={16} /></button>}
    </div>
  )
}

export function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-brand-600 ${className}`} size={24} />
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-200 ${className}`} />
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
      {Icon && <Icon size={40} className="text-neutral-300 mb-3" />}
      <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-neutral-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <p className="text-red-700 font-medium">{message || 'Failed to load data.'}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-neutral-600 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

// ---------- Pagination ----------
export function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null
  const pages = []
  const start = Math.max(0, Math.min(page - 2, totalPages - 5))
  for (let i = start; i < Math.min(totalPages, start + 5); i++) pages.push(i)
  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>Prev</Button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)}
          className={`min-w-9 rounded-lg px-3 py-1.5 text-sm ${p === page ? 'bg-brand-600 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}>
          {p + 1}
        </button>
      ))}
      <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Next</Button>
    </nav>
  )
}
