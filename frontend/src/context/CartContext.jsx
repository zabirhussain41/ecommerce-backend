import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { cartService } from '../services/cartService'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return }
    try {
      const res = await cartService.get()
      setItems(res.data || [])
    } catch {
      setItems([])
    }
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (productId, quantity = 1) => {
    await cartService.add(productId, quantity)
    await refresh()
  }, [refresh])

  const update = useCallback(async (itemId, quantity) => {
    const res = await cartService.update(itemId, quantity)
    setItems(prev => prev.map(i => i.id === itemId ? res.data : i))
    return res.data
  }, [])

  const remove = useCallback(async (itemId) => {
    await cartService.remove(itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }, [])

  const clear = useCallback(async () => {
    await cartService.clear()
    setItems([])
  }, [])

  const total = items.reduce((sum, i) => sum + Number(i.lineTotal || 0), 0)
  const count = items.reduce((sum, i) => sum + (i.quantity || 0), 0)

  return (
    <CartContext.Provider value={{ items, loading, total, count, refresh, add, update, remove, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
