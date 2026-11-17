#!/usr/bin/env node
/**
 * Seeds a demo catalog into the running backend:
 *  - categories with generated SVG cover images
 *  - products across categories
 *  - 2 images per product uploaded through the real image-upload API
 *
 * Usage:
 *   node scripts/seed-catalog.mjs [apiBase] [adminUser] [adminPass]
 * Defaults: http://localhost:8080  admin  Admin@Dev123
 *
 * Images are generated SVG files (gradient + label) uploaded via
 * POST /api/products/{id}/images — the same path the admin UI uses.
 */

const API = process.argv[2] || 'http://localhost:8080'
const ADMIN_USER = process.argv[3] || 'admin'
const ADMIN_PASS = process.argv[4] || 'Admin@Dev123'

// ---------- SVG image generation ----------
const PALETTES = [
  ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#22d3ee'], ['#f59e0b', '#f97316'],
  ['#10b981', '#34d399'], ['#ef4444', '#f87171'], ['#ec4899', '#f472b6'],
  ['#8b5cf6', '#d946ef'], ['#14b8a6', '#2dd4bf'], ['#f97316', '#fb923c'],
  ['#64748b', '#94a3b8'],
]

function svgImage(text, sub, paletteIdx, variant = 0) {
  const [c1, c2] = PALETTES[paletteIdx % PALETTES.length]
  const shift = variant * 40
  const initials = text.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="${650 + shift}" cy="${150 - shift}" r="220" fill="#ffffff" opacity="0.08"/>
  <circle cx="${120 - shift}" cy="${680 + shift}" r="180" fill="#ffffff" opacity="0.07"/>
  <rect x="60" y="60" width="680" height="680" rx="36" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>
  <text x="400" y="330" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#ffffff" text-anchor="middle" opacity="0.95">${initials}</text>
  <text x="400" y="470" font-family="Arial, sans-serif" font-size="52" font-weight="600" fill="#ffffff" text-anchor="middle">${escapeXml(text)}</text>
  ${sub ? `<text x="400" y="530" font-family="Arial, sans-serif" font-size="30" fill="#ffffff" text-anchor="middle" opacity="0.8">${escapeXml(sub)}</text>` : ''}
  <rect x="0" y="620" width="800" height="180" fill="url(#s)"/>
</svg>`
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function toFile(svg, name) {
  return new File([svg], name, { type: 'image/svg+xml' })
}

// ---------- API helpers ----------
async function api(path, { method = 'GET', body, token, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  const res = await fetch(`${API}${path}`, { method, headers, body: payload })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  return data
}

// ---------- Catalog definition ----------
const CATEGORIES = [
  { name: 'Electronics',        slug: 'electronics',        image: 'Electronics' },
  { name: "Men's Clothing",     slug: 'mens-clothing',      image: "Men's Fashion" },
  { name: "Women's Clothing",   slug: 'womens-clothing',    image: "Women's Fashion" },
  { name: 'Shoes',              slug: 'shoes',              image: 'Footwear' },
  { name: 'Watches',            slug: 'watches',            image: 'Watches' },
  { name: 'Home & Kitchen',     slug: 'home-kitchen',       image: 'Home & Kitchen' },
  { name: 'Beauty',             slug: 'beauty',             image: 'Beauty & Care' },
  { name: 'Accessories',        slug: 'accessories',        image: 'Accessories' },
  { name: 'Sports',             slug: 'sports',             image: 'Sports & Fitness' },
  { name: 'Toys & Games',       slug: 'toys-games',         image: 'Toys & Games' },
]

// [name, categorySlug, price, originalPrice|null, stock, badge|null, desc]
const PRODUCTS = [
  ['Wireless Noise-Cancel Headphones', 'electronics', 79.99, 99.99, 34, 'SALE', 'Over-ear headphones with active noise cancellation, 30h battery and plush ear cushions.'],
  ['Smart Watch Series 5',             'electronics', 149.00, null, 18, 'NEW',  'Fitness tracker with heart-rate monitor, GPS and a bright AMOLED display.'],
  ['Bluetooth Portable Speaker',       'electronics', 39.99, 54.99, 52, 'SALE', 'Compact waterproof speaker with 12h playtime and deep bass.'],
  ['USB-C Fast Charger 65W',           'electronics', 24.99, null, 120,'',      'Dual-port GaN charger for laptops, phones and tablets.'],
  ['Men\'s Classic Oxford Shirt',      'mens-clothing', 34.99, null, 60, '',    'Breathable cotton oxford shirt with a tailored fit.'],
  ['Men\'s Slim-Fit Chino Pants',      'mens-clothing', 42.00, 55.00, 45, 'SALE','Stretch chino pants with a modern slim taper.'],
  ['Men\'s Leather Bifold Wallet',     'mens-clothing', 29.99, null, 80, '',    'Genuine leather wallet with 8 card slots and RFID protection.'],
  ['Men\'s Winter Puffer Jacket',      'mens-clothing', 89.99, 129.99,22, 'SALE','Lightweight quilted puffer with water-repellent shell.'],
  ['Women\'s Floral Summer Dress',     'womens-clothing', 44.99, null, 38, 'NEW','Flowy midi dress with a vibrant floral print.'],
  ['Women\'s Cashmere Blend Sweater',  'womens-clothing', 59.99, 74.99, 27, 'SALE','Soft cashmere-blend crewneck sweater in a classic fit.'],
  ['Women\'s High-Waist Jeans',        'womens-clothing', 49.99, null, 64, '',  'Stretch denim jeans with a flattering high-rise cut.'],
  ['Women\'s Evening Clutch',          'womens-clothing', 35.00, null, 15, '',  'Satin evening clutch with a detachable shoulder chain.'],
  ['Running Shoes AirFlex',            'shoes', 69.99, 89.99, 73, 'SALE', 'Lightweight knit runners with responsive cushioning.'],
  ['Leather Chelsea Boots',            'shoes', 119.00, null, 26, '',    'Handcrafted leather boots with a durable rubber sole.'],
  ['Minimalist White Sneakers',        'shoes', 54.99, null, 91, 'NEW',  'Clean leather sneakers with a cushioned insole.'],
  ['Stainless Steel Chronograph',      'watches', 199.00, 249.00, 14, 'SALE','Sapphire-coated glass, Japanese movement, 100m water resistance.'],
  ['Minimalist Leather Strap Watch',   'watches', 89.00, null, 33, '',    'Slim case with a genuine leather strap and Japanese quartz movement.'],
  ['Smart Digital Sports Watch',       'watches', 129.00, null, 21, 'NEW', 'GPS running watch with heart-rate zones and 10-day battery.'],
  ['Non-Stick Cookware Set 10pc',      'home-kitchen', 79.99, 109.99, 19, 'SALE','Durable non-stick pots and pans with cool-touch handles.'],
  ['Bamboo Cutting Board Set',         'home-kitchen', 24.99, null, 88, '',  'Set of 3 eco-friendly bamboo boards in graduated sizes.'],
  ['Ceramic Pour-Over Coffee Set',     'home-kitchen', 34.99, null, 47, 'NEW','Dripper, carafe and filters for cafe-style coffee at home.'],
  ['Matte Black Knife Block Set',      'home-kitchen', 59.00, null, 12, '',  '7-piece forged steel knife set with acacia block.'],
  ['Vitamin C Serum 30ml',             'beauty', 19.99, 26.99, 140,'SALE','Brightening serum with 15% vitamin C and hyaluronic acid.'],
  ['Hydrating Face Moisturizer',       'beauty', 16.99, null, 210,'',    'Lightweight gel-cream moisturizer for all skin types.'],
  ['Rose Gold Makeup Brush Set',       'beauty', 22.99, null, 95, 'NEW','12-piece brush set with soft synthetic bristles.'],
  ['Sunglasses Polarized UV400',       'accessories', 29.99, 39.99, 77, 'SALE','Classic frame with polarized lenses and UV400 protection.'],
  ['Canvas Weekender Duffel Bag',      'accessories', 44.99, null, 29, '', 'Spacious waxed-canvas duffel with leather trims and shoe compartment.'],
  ['Stainless Steel Water Bottle 1L',  'accessories', 18.99, null, 160,'',  'Double-wall vacuum insulated bottle, keeps drinks cold 24h.'],
  ['Yoga Mat Pro Non-Slip 6mm',        'sports', 32.99, 44.99, 58, 'SALE','Eco-friendly TPE mat with alignment lines and carry strap.'],
  ['Adjustable Dumbbells 20kg Set',    'sports', 89.99, null, 16, '',    'Space-saving adjustable dumbbells from 2.5 to 20 kg.'],
  ['Jump Rope Speed Pro',              'sports', 12.99, null, 200,'',    'Ball-bearing speed rope with adjustable cable and memory foam handles.'],
  ['Kids Building Blocks 120pc',       'toys-games', 24.99, null, 66, '', 'Colorful interlocking blocks compatible with all major brands.'],
  ['Remote Control Racing Car',        'toys-games', 34.99, 44.99, 41, 'SALE','4WD off-road racer with 2.4GHz remote, rechargeable battery.'],
  ['Strategy Board Game Family Edition', 'toys-games', 27.99, null, 53, 'NEW','Award-winning strategy game for 2-5 players, 30-60 min playtime.'],
]

// ---------- Main ----------
async function main() {
  console.log(`Seeding catalog at ${API} as ${ADMIN_USER}…`)

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  })
  const token = login.token
  console.log('  logged in')

  // --- categories (skip ones that already exist by slug/name) ---
  const existingCats = await api('/api/categories')
  const catBySlug = {}
  for (const c of existingCats) catBySlug[c.slug || c.name.toLowerCase()] = c

  const catIds = {}
  for (let i = 0; i < CATEGORIES.length; i++) {
    const def = CATEGORIES[i]
    const key = def.slug
    if (catBySlug[key] || catBySlug[def.name.toLowerCase()]) {
      const c = catBySlug[key] || catBySlug[def.name.toLowerCase()]
      catIds[def.slug] = c.id
      console.log(`  category exists: ${def.name} (#${c.id})`)
      continue
    }
    // Category covers are set after products are seeded (see below):
    // each category's imageUrl points at the primary image of its first product.
    const created = await api('/api/admin/categories', {
      method: 'POST', token,
      body: { name: def.name, slug: def.slug, imageUrl: null },
    })
    catIds[def.slug] = created.id
    console.log(`  created category: ${def.name} (#${created.id})`)
  }

  // --- products ---
  const existing = await api('/api/products?size=100')
  const names = new Set((existing.content || []).map(p => p.name.toLowerCase()))

  // Category covers: set each category's imageUrl to the primary image of its
  // first product after seeding (real product imagery, no fake stock photos).
  let createdCount = 0
  for (const [name, catSlug, price, orig, stock, badge, desc] of PRODUCTS) {
    if (names.has(name.toLowerCase())) { console.log(`  product exists: ${name}`); continue }
    const catId = catIds[catSlug]
    const product = await api('/api/products', {
      method: 'POST', token,
      body: {
        name, description: desc, price, originalPrice: orig, stock,
        badge: badge || null, active: true,
        category: catId ? { id: catId } : null,
      },
    })
    // upload 2 images: primary + alt view (variant shifts the gradient)
    for (let v = 0; v < 2; v++) {
      const file = toFile(svgImage(name, catSlug.replace('-', ' '), catSlug.length + name.length, v), `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v + 1}.svg`)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('primary', v === 0 ? 'true' : 'false')
      await api(`/api/products/${product.id}/images`, { method: 'POST', token, form: fd })
    }
    createdCount++
    console.log(`  created product: ${name} (#${product.id}, cat ${catSlug})`)
  }

  // --- set category cover images = primary image of first product in that category ---
  const allCats = await api('/api/categories')
  const allProducts = (await api('/api/products?size=100')).content || []
  for (const cat of allCats) {
    const first = allProducts.find(p => p.category?.id === cat.id && p.imageUrl)
    if (first?.imageUrl && cat.imageUrl !== first.imageUrl) {
      await api(`/api/admin/categories/${cat.id}`, {
        method: 'PUT', token,
        body: { name: cat.name, slug: cat.slug, imageUrl: first.imageUrl },
      })
      console.log(`  category cover set: ${cat.name} -> ${first.imageUrl}`)
    }
  }

  console.log(`\nDone. Created ${createdCount} products. Total products: ${(await api('/api/products?size=1')).totalElements}, categories: ${(await api('/api/categories')).length}`)
}

main().catch(e => { console.error('SEED FAILED:', e.message); process.exit(1) })
