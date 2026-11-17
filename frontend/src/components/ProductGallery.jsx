import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, Package, X } from 'lucide-react'

/**
 * Product image gallery: main image + thumbnails + prev/next arrows,
 * keyboard navigation, touch swipe, and click-to-zoom lightbox.
 * Renders a clean placeholder when there are no images.
 */
export default function ProductGallery({ images = [], name = 'Product' }) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const touchStart = useRef(null)
  const count = images.length

  const go = useCallback((dir) => {
    setIndex(i => (i + dir + count) % count)
  }, [count])

  useEffect(() => { setIndex(0) }, [images])

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, go])

  if (!count) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-neutral-300">
        <Package size={64} />
      </div>
    )
  }

  const current = images[index]

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStart.current == null || count < 2) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
    touchStart.current = null
  }

  return (
    <div>
      {/* Main image */}
      <div
        className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setLightbox(true)}
        role="button"
        aria-label={`View ${name} image ${index + 1} fullscreen`}
      >
        <img
          key={current}
          src={current}
          alt={`${name} — image ${index + 1}`}
          className="h-full w-full object-contain transition-opacity duration-200"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 text-neutral-600 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <Expand size={16} />
        </span>

        {count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); go(-1) }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-700 shadow hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); go(1) }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-700 shadow hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/60 px-2.5 py-0.5 text-xs font-medium text-white">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-neutral-100 transition-colors ${
                i === index ? 'border-brand-600' : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} image viewer`}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
            aria-label="Close viewer"
          >
            <X size={22} />
          </button>
          {count > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); go(1) }}
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <img
            src={current}
            alt={name}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {count > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {index + 1} / {count}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
