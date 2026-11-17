const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/**
 * Resolves an image URL returned by the backend.
 * - absolute http(s) URLs pass through
 * - backend-relative paths like /uploads/x.png get the API origin prepended
 * - data: URIs pass through
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`
  return url
}

/**
 * Returns the ordered list of image URLs for a product.
 * Prefers the `images` collection (primary first by sortOrder),
 * falls back to the legacy single `imageUrl` field.
 */
export function productImages(product) {
  if (!product) return []
  const list = Array.isArray(product.images) ? product.images : []
  const urls = list
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0))
    .map(img => resolveImageUrl(img.url || img))
    .filter(Boolean)
  if (urls.length) return urls
  const single = resolveImageUrl(product.imageUrl)
  return single ? [single] : []
}

/** Primary/first image for cards. */
export function productImage(product) {
  return productImages(product)[0] || null
}
