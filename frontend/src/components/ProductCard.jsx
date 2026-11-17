import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format'
import { productImage } from '../utils/images'
import { Package } from 'lucide-react'

export default function ProductCard({ product }) {
  const outOfStock = (product.stock ?? 0) <= 0
  const discount = product.originalPrice && product.price && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        {productImage(product) ? (
          <img src={productImage(product)} alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300"><Package size={40} /></div>
        )}
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
            {product.badge}
          </span>
        )}
        {discount && (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-neutral-900/70 py-1 text-center text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-neutral-500">{product.category?.name || 'Uncategorized'}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-neutral-900 group-hover:text-brand-700">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-base font-semibold text-neutral-900">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-neutral-400 line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
