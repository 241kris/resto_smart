"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { type Product } from "@/lib/hooks/useProducts"

export interface CartItem {
  product: Product
  quantity: number
}

interface ManualOrderCartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
}

const ManualOrderCartContext = createContext<ManualOrderCartContextType | undefined>(undefined)

export function ManualOrderCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id)

      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      return [...currentItems, { product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  const isInCart = (productId: string) => {
    return items.some(item => item.product.id === productId)
  }

  const getCartItem = (productId: string) => {
    return items.find(item => item.product.id === productId)
  }

  return (
    <ManualOrderCartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        isInCart,
        getCartItem,
      }}
    >
      {children}
    </ManualOrderCartContext.Provider>
  )
}

export function useManualOrderCart() {
  const context = useContext(ManualOrderCartContext)
  if (!context) {
    throw new Error("useManualOrderCart must be used within a ManualOrderCartProvider")
  }
  return context
}
