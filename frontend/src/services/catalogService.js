import api from '../api/client'

export const productService = {
  list: ({ page = 0, size = 12, categoryId, minPrice, maxPrice, sort, q } = {}) => {
    const params = { page, size }
    if (categoryId) params.categoryId = categoryId
    if (minPrice != null && minPrice !== '') params.minPrice = minPrice
    if (maxPrice != null && maxPrice !== '') params.maxPrice = maxPrice
    if (sort) params.sort = sort
    if (q) return api.get('/api/products/search', { params: { q, ...params } })
    return api.get('/api/products', { params })
  },
  get: (id) => api.get(`/api/products/${id}`),
}

export const categoryService = {
  list: () => api.get('/api/categories'),
}
