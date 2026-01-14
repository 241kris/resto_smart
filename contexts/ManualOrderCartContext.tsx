"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { type Product } from "@/lib/hooks/useProducts"
import { offlineStorage } from "@/lib/offlineStorage"
import { toast } from "sonner"

export interface CartItem {
  product: Product
  quantity: number
}

interface ManualOrderCartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: (restoreStock?: boolean) => Promise<void>
  totalItems: number
  totalAmount: number
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
}

const ManualOrderCartContext = createContext<ManualOrderCartContextType | undefined>(undefined)

export function ManualOrderCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Check if we're online
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    // Check stock for quantifiable products
    if (product.isQuantifiable) {
      // Get current stock from cache if offline
      const cachedProducts = await offlineStorage.getProducts()
      const cachedProduct = cachedProducts.find(p => p.id === product.id)
      const currentStock = cachedProduct?.quantity ?? product.quantity ?? 0

      // Check if we have an existing item in cart
      const existingItem = items.find(item => item.product.id === product.id)
      const currentCartQty = existingItem?.quantity || 0
      const newTotalQty = currentCartQty + quantity

      if (currentStock < quantity) {
        toast.error(`Stock insuffisant (disponible: ${currentStock})`)
        return
      }

      // Update local stock immediately
      await offlineStorage.updateProductStock(product.id, quantity)
    }

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
  }, [items])

  const removeFromCart = useCallback(async (productId: string) => {
    const existingItem = items.find(item => item.product.id === productId)

    if (existingItem) {
      // Restore stock if quantifiable
      if (existingItem.product.isQuantifiable) {
        await offlineStorage.restoreProductStock(productId, existingItem.quantity)
      }
    }

    setItems(currentItems => currentItems.filter(item => item.product.id !== productId))
  }, [items])

  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId)
      return
    }

    const existingItem = items.find(item => item.product.id === productId)
    if (!existingItem) return

    const oldQuantity = existingItem.quantity
    const quantityDiff = newQuantity - oldQuantity

    // Check stock for quantifiable products when increasing
    if (existingItem.product.isQuantifiable && quantityDiff > 0) {
      const cachedProducts = await offlineStorage.getProducts()
      const cachedProduct = cachedProducts.find(p => p.id === productId)
      const currentStock = cachedProduct?.quantity ?? existingItem.product.quantity ?? 0

      if (currentStock < quantityDiff) {
        toast.error(`Stock insuffisant (disponible: ${currentStock})`)
        return
      }

      // Reduce stock
      await offlineStorage.updateProductStock(productId, quantityDiff)
    } else if (existingItem.product.isQuantifiable && quantityDiff < 0) {
      // Restore stock when decreasing
      await offlineStorage.restoreProductStock(productId, Math.abs(quantityDiff))
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }, [items, removeFromCart])

  const clearCart = useCallback(async (restoreStock: boolean = true) => {
    // Restore all stock when clearing cart (unless order was confirmed)
    if (restoreStock) {
      for (const item of items) {
        if (item.product.isQuantifiable) {
          await offlineStorage.restoreProductStock(item.product.id, item.quantity)
        }
      }
    }
    setItems([])
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId)
  }, [items])

  const getCartItem = useCallback((productId: string) => {
    return items.find(item => item.product.id === productId)
  }, [items])

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
