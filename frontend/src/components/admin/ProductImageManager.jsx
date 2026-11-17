import { useEffect, useRef, useState } from 'react'
import { Star, Trash2, Upload, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { resolveImageUrl } from '../../utils/images'
import { Button, Alert } from '../ui'

/**
 * Admin image manager for a product: upload multiple images,
 * preview, set primary, reorder, delete.
 */
export default function ProductImageManager({ productId, onError }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const report = (msg) => { setError(msg); onError?.(msg) }

  const loadRecords = () => {
    setLoading(true)
    adminService.product(productId)
      .then(r => {
        const imgs = (r.data.images || [])
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0))
        setImages(imgs)
      })
      .catch(e => report(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRecords() }, [productId])

  const upload = async (files) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) { report(`${file.name}: not an image file`); continue }
        if (file.size > 5 * 1024 * 1024) { report(`${file.name}: exceeds 5 MB`); continue }
        // first image of an empty product becomes primary automatically
        await adminService.uploadProductImage(productId, file, images.length === 0)
      }
      loadRecords()
    } catch (e) { report(e.message) } finally { setUploading(false) }
  }

  const remove = async (img) => {
    try {
      await adminService.deleteProductImage(productId, img.id)
      loadRecords()
    } catch (e) { report(e.message) }
  }

  const makePrimary = async (img) => {
    try {
      await adminService.setPrimaryImage(productId, img.id)
      loadRecords()
    } catch (e) { report(e.message) }
  }

  const move = async (img, dir) => {
    const ids = images.map(i => i.id)
    const from = ids.indexOf(img.id)
    const to = from + dir
    if (to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    try {
      await adminService.reorderImages(productId, ids)
      loadRecords()
    } catch (e) { report(e.message) }
  }

  return (
    <div className="sm:col-span-2 rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800">Product images</p>
        <Button type="button" size="sm" variant="secondary" loading={uploading}
          onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Upload images
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { upload(e.target.files); e.target.value = '' }} />
      </div>
      {error && <div className="mt-2"><Alert onClose={() => setError(null)}>{error}</Alert></div>}

      {loading ? (
        <p className="mt-3 text-sm text-neutral-400">Loading images…</p>
      ) : images.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-neutral-400"><ImagePlus size={16} /> No images yet — upload some (JPG/PNG/WebP/SVG/GIF, max 5 MB each).</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.id}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-neutral-100 ${
                img.primaryImage ? 'border-brand-500' : 'border-neutral-200'}`}>
              <img src={resolveImageUrl(img.url)} alt="" className="h-full w-full object-cover" />
              {img.primaryImage && (
                <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PRIMARY</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-neutral-900/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.primaryImage && (
                  <button type="button" onClick={() => makePrimary(img)} title="Set as primary"
                    className="rounded p-1 text-amber-300 hover:bg-white/10"><Star size={13} /></button>
                )}
                <button type="button" onClick={() => move(img, -1)} disabled={i === 0} title="Move left"
                  className="rounded p-1 text-white hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={13} /></button>
                <button type="button" onClick={() => move(img, 1)} disabled={i === images.length - 1} title="Move right"
                  className="rounded p-1 text-white hover:bg-white/10 disabled:opacity-30"><ChevronRight size={13} /></button>
                <button type="button" onClick={() => remove(img)} title="Delete"
                  className="rounded p-1 text-red-300 hover:bg-white/10"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-neutral-400">Star = primary image shown on cards. Arrows reorder the gallery.</p>
    </div>
  )
}
