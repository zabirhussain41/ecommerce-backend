import api from '../api/client'

export const crmService = {
  interactions: (customerId) => api.get(`/api/admin/customers/${customerId}/interactions`),
  addInteraction: (customerId, data) =>
    api.post(`/api/admin/customers/${customerId}/interactions`, data),

  tasks: ({ page = 0, size = 20, status, priority, assignee, dueBefore, customerId } = {}) =>
    api.get('/api/admin/crm/tasks', {
      params: { page, size, status, priority, assignee, dueBefore, customerId },
    }),
  createTask: (data) => api.post('/api/admin/crm/tasks', data),
  updateTask: (id, data) => api.patch(`/api/admin/crm/tasks/${id}`, data),
}
