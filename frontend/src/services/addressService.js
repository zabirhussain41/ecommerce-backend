import api from '../api/client'

export const addressService = {
  list: () => api.get('/api/addresses'),
  create: (data) => api.post('/api/addresses', data),
  update: (id, data) => api.put(`/api/addresses/${id}`, data),
  remove: (id) => api.delete(`/api/addresses/${id}`),
}
