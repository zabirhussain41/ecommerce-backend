import api from '../api/client'

export const authService = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/me', data),
  changePassword: (currentPassword, newPassword) =>
    api.put('/api/auth/password', { currentPassword, newPassword }),
}
