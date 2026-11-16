import api from '../api/client'

export const analyticsService = {
  summary: () => api.get('/api/admin/dashboard/summary'),
  sales: ({ from, to, groupBy = 'day' } = {}) =>
    api.get('/api/admin/analytics/sales', { params: { from, to, groupBy } }),
  customers: (days = 30) => api.get('/api/admin/analytics/customers', { params: { days } }),
}
