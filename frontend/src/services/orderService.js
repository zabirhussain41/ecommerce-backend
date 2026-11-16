import api from '../api/client'

export const orderService = {
  place: (paymentMethod = 'COD', addressId = null) =>
    api.post('/api/orders/place', null, { params: { paymentMethod, addressId } }),
  myOrders: () => api.get('/api/orders/my'),
  get: (id) => api.get(`/api/orders/${id}`),
}
