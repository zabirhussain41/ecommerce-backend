import api from '../api/client'

export const cartService = {
  get: () => api.get('/api/cart'),
  add: (productId, quantity = 1) =>
    api.post('/api/cart/add', null, { params: { productId, quantity } }),
  update: (itemId, quantity) =>
    api.put(`/api/cart/item/${itemId}`, null, { params: { quantity } }),
  remove: (itemId) => api.delete(`/api/cart/item/${itemId}`),
  clear: () => api.delete('/api/cart/clear'),
}
