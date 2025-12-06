import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Product } from '../lib/api'

export interface CartItem {
  product: Product
  quantity: number
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

interface AppState extends AuthState, CartState {}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,

      login: (token: string, user: User) => {
        localStorage.setItem('token', token)
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isAuthenticated: false, items: [] })
      },

      updateUser: (user: User) => {
        set({ user })
      },

      // Cart state
      items: [],

      addItem: (product: Product, quantity = 1) => {
        const { items } = get()
        const existingItem = items.find(item => item.product.id === product.id)

        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          set({
            items: [...items, { product, quantity }]
          })
        }
      },

      removeItem: (productId: number) => {
        const { items } = get()
        set({
          items: items.filter(item => item.product.id !== productId)
        })
      },

      updateQuantity: (productId: number, quantity: number) => {
        const { items } = get()
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + ((item.product.price_rp || item.product.priceRp || 0) * item.quantity), 0)
      }
    }),
    {
      name: 'tatali-asih-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        items: state.items,
      }),
    }
  )
)