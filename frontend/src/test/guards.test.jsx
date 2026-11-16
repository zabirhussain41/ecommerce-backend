import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute, AdminRoute } from '../components/guards'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))
import { useAuth } from '../context/AuthContext'

function renderAt(route, element) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/" element={<div>HOME</div>} />
        <Route element={element}><Route path="/secret" element={<div>SECRET</div>} /></Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Route guards', () => {
  it('redirects unauthenticated users to /login', () => {
    useAuth.mockReturnValue({ user: null, loading: false, isAdmin: false })
    renderAt('/secret', <ProtectedRoute />)
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument()
  })

  it('shows protected content for authenticated users', () => {
    useAuth.mockReturnValue({ user: { username: 'bob' }, loading: false, isAdmin: false })
    renderAt('/secret', <ProtectedRoute />)
    expect(screen.getByText('SECRET')).toBeInTheDocument()
  })

  it('blocks non-admin users from admin routes', () => {
    useAuth.mockReturnValue({ user: { username: 'bob', role: 'USER' }, loading: false, isAdmin: false })
    renderAt('/secret', <AdminRoute />)
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('allows admins into admin routes', () => {
    useAuth.mockReturnValue({ user: { username: 'root', role: 'ADMIN' }, loading: false, isAdmin: true })
    renderAt('/secret', <AdminRoute />)
    expect(screen.getByText('SECRET')).toBeInTheDocument()
  })
})
