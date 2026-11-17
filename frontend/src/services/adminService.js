import api from '../api/client'

export const adminService = {
  // customers
  customers: ({ page = 0, size = 20, search, sort } = {}) =>
    api.get('/api/admin/customers', { params: { page, size, search, sort } }),
  customer: (id) => api.get(`/api/admin/customers/${id}`),
  customerOrders: (id, { page = 0, size = 10 } = {}) =>
    api.get(`/api/admin/customers/${id}/orders`, { params: { page, size } }),

  // orders
  orders: ({ page = 0, size = 20, status, from, to, search } = {}) =>
    api.get('/api/admin/orders', { params: { page, size, status, from, to, search } }),
  order: (id) => api.get(`/api/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api.put(`/api/orders/${id}/status`, null, { params: { status } }),

  // products
  products: ({ page = 0, size = 20, q, categoryId, active } = {}) =>
    api.get('/api/admin/products', { params: { page, size, q, categoryId, active } }),
  createProduct: (data) => api.post('/api/products', data),
  updateProduct: (id, data) => api.put(`/api/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),

  // product images (admin)
  product: (id) => api.get(`/api/products/${id}`),
  uploadProductImage: (productId, file, primary = false) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('primary', primary)
    return api.post(`/api/products/${productId}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteProductImage: (productId, imageId) =>
    api.delete(`/api/products/${productId}/images/${imageId}`),
  setPrimaryImage: (productId, imageId) =>
    api.put(`/api/products/${productId}/images/${imageId}/primary`),
  reorderImages: (productId, orderedIds) =>
    api.put(`/api/products/${productId}/images/order`, orderedIds),

  // categories
  categories: () => api.get('/api/admin/categories'),
  createCategory: (data) => api.post('/api/admin/categories', data),
  updateCategory: (id, data) => api.put(`/api/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/admin/categories/${id}`),
}
