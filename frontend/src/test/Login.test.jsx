import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/auth/Login'
import { AuthProvider } from '../context/AuthContext'
import { tokenStore } from '../api/client'

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(() => Promise.resolve({ data: {} })),
    register: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}))

import { authService } from '../services/authService'

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    tokenStore.clear()
    vi.clearAllMocks()
  })

  it('shows validation errors for empty fields', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('calls login service and stores token on success', async () => {
    authService.login.mockResolvedValue({
      data: { token: 'tok123', id: 1, username: 'alice', email: 'a@b.c', role: 'USER' },
    })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/username/i), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => expect(authService.login).toHaveBeenCalledWith('alice', 'secret123'))
    expect(tokenStore.get()).toBe('tok123')
  })

  it('shows server error on invalid credentials', async () => {
    authService.login.mockRejectedValue({ message: 'Invalid username or password', status: 401 })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/username/i), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
    expect(tokenStore.get()).toBeNull()
  })
})
