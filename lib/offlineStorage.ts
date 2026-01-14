/**
 * Offline Storage Service using idb-keyval
 * Simpler and more reliable than raw IndexedDB
 */

import { get, set, del, keys } from 'idb-keyval'

export interface OfflineOrder {
  localId: string
  restaurantId: string
  tableId?: string
  totalAmount: number
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'completed'
  customer?: any
  items: Array<{
    productId: string
    productName: string
    productPrice: number
    quantity: number
    price: number
    total: number
  }>
  createdAt: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  serverId?: string
  syncedAt?: string
  syncError?: string
}

export interface CachedProduct {
  id: string
  name: string
  price: number
  image?: string
  cachedImage?: string // Base64 cached image for offline use
  isQuantifiable: boolean
  quantity?: number
  categoryId?: string
  status: boolean
  [key: string]: any
}

// Storage keys
const ORDERS_KEY = 'offline_orders'
const PRODUCTS_KEY = 'offline_products'
const SYNC_LOCK_KEY = 'sync_lock'
const IMAGE_CACHE_KEY = 'offline_images'

class OfflineStorageService {
  /**
   * Generate unique local ID
   */
  generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save an order
   */
  async saveOrder(order: OfflineOrder): Promise<void> {
    const orders = await this.getAllOrders()
    const existingIndex = orders.findIndex(o => o.localId === order.localId)

    if (existingIndex >= 0) {
      orders[existingIndex] = order
    } else {
      orders.push(order)
    }

    await set(ORDERS_KEY, orders)
  }

  /**
   * Get all orders
   */
  async getAllOrders(): Promise<OfflineOrder[]> {
    const orders = await get<OfflineOrder[]>(ORDERS_KEY)
    return orders || []
  }

  /**
   * Get orders pending sync
   */
  async getPendingOrders(): Promise<OfflineOrder[]> {
    const orders = await this.getAllOrders()
    return orders.filter(o => o.syncStatus === 'pending')
  }

  /**
   * Get unsynced count
   */
  async getUnsyncedCount(): Promise<number> {
    const orders = await this.getPendingOrders()
    return orders.length
  }

  /**
   * Mark order as syncing
   */
  async markAsSyncing(localId: string): Promise<void> {
    const orders = await this.getAllOrders()
    const order = orders.find(o => o.localId === localId)
    if (order) {
      order.syncStatus = 'syncing'
      await set(ORDERS_KEY, orders)
    }
  }

  /**
   * Mark order as synced
   */
  async markAsSynced(localId: string, serverId?: string): Promise<void> {
    const orders = await this.getAllOrders()
    const order = orders.find(o => o.localId === localId)
    if (order) {
      order.syncStatus = 'synced'
      order.syncedAt = new Date().toISOString()
      if (serverId) order.serverId = serverId
      await set(ORDERS_KEY, orders)
    }
  }

  /**
   * Mark order as error
   */
  async markAsError(localId: string, error: string): Promise<void> {
    const orders = await this.getAllOrders()
    const order = orders.find(o => o.localId === localId)
    if (order) {
      order.syncStatus = 'error'
      order.syncError = error
      await set(ORDERS_KEY, orders)
    }
  }

  /**
   * Revert order to pending
   */
  async revertToPending(localId: string): Promise<void> {
    const orders = await this.getAllOrders()
    const order = orders.find(o => o.localId === localId)
    if (order) {
      order.syncStatus = 'pending'
      delete order.syncError
      await set(ORDERS_KEY, orders)
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(localId: string): Promise<void> {
    const orders = await this.getAllOrders()
    const filtered = orders.filter(o => o.localId !== localId)
    await set(ORDERS_KEY, filtered)
  }

  /**
   * Save products cache
   */
  async saveProducts(products: CachedProduct[]): Promise<void> {
    await set(PRODUCTS_KEY, products)
  }

  /**
   * Get cached products
   */
  async getProducts(): Promise<CachedProduct[]> {
    const products = await get<CachedProduct[]>(PRODUCTS_KEY)
    return products || []
  }

  /**
   * Update product stock (subtract)
   */
  async updateProductStock(productId: string, quantityToSubtract: number): Promise<void> {
    const products = await this.getProducts()
    const product = products.find(p => p.id === productId)

    if (product && product.isQuantifiable && product.quantity !== undefined) {
      product.quantity = Math.max(0, product.quantity - quantityToSubtract)
      await set(PRODUCTS_KEY, products)
    }
  }

  /**
   * Restore product stock (add back)
   */
  async restoreProductStock(productId: string, quantityToAdd: number): Promise<void> {
    const products = await this.getProducts()
    const product = products.find(p => p.id === productId)

    if (product && product.isQuantifiable && product.quantity !== undefined) {
      product.quantity = product.quantity + quantityToAdd
      await set(PRODUCTS_KEY, products)
    }
  }

  /**
   * Get current product stock
   */
  async getProductStock(productId: string): Promise<number | undefined> {
    const products = await this.getProducts()
    const product = products.find(p => p.id === productId)
    return product?.quantity
  }

  /**
   * Cache image as base64
   */
  async cacheImage(url: string): Promise<string | null> {
    if (!url || url.startsWith('data:') || url.startsWith('/')) {
      return url // Already cached or local
    }

    try {
      // Check if already cached
      const cachedImages = await get<Record<string, string>>(IMAGE_CACHE_KEY) || {}
      if (cachedImages[url]) {
        return cachedImages[url]
      }

      // Fetch and convert to base64
      const response = await fetch(url)
      const blob = await response.blob()

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result as string
          cachedImages[url] = base64
          await set(IMAGE_CACHE_KEY, cachedImages)
          resolve(base64)
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error caching image:', error)
      return null
    }
  }

  /**
   * Get cached image
   */
  async getCachedImage(url: string): Promise<string | null> {
    if (!url) return null
    if (url.startsWith('data:') || url.startsWith('/')) return url

    const cachedImages = await get<Record<string, string>>(IMAGE_CACHE_KEY) || {}
    return cachedImages[url] || null
  }

  /**
   * Cache all product images
   */
  async cacheProductImages(products: CachedProduct[]): Promise<CachedProduct[]> {
    const cachedProducts: CachedProduct[] = []

    for (const product of products) {
      if (product.image) {
        const cachedImage = await this.cacheImage(product.image)
        cachedProducts.push({
          ...product,
          cachedImage: cachedImage || product.image
        })
      } else {
        cachedProducts.push(product)
      }
    }

    return cachedProducts
  }

  /**
   * Get all cached images
   */
  async getAllCachedImages(): Promise<Record<string, string>> {
    return await get<Record<string, string>>(IMAGE_CACHE_KEY) || {}
  }

  /**
   * Sync lock management with timestamp for auto-expiry
   */
  async acquireSyncLock(): Promise<boolean> {
    const existingLock = await get<{ locked: boolean; timestamp: number }>(SYNC_LOCK_KEY)

    // Check if lock exists and is still valid (less than 2 minutes old)
    if (existingLock && existingLock.locked) {
      const lockAge = Date.now() - existingLock.timestamp
      if (lockAge < 120000) { // 2 minutes
        console.log('Sync already in progress, lock age:', lockAge, 'ms')
        return false
      } else {
        console.log('Lock expired, acquiring new lock')
      }
    }

    // Acquire lock with timestamp
    await set(SYNC_LOCK_KEY, { locked: true, timestamp: Date.now() })

    // Double-check after a tiny delay to avoid race conditions
    await new Promise(resolve => setTimeout(resolve, 50))
    const checkLock = await get<{ locked: boolean; timestamp: number }>(SYNC_LOCK_KEY)

    // If timestamp changed, someone else got the lock
    if (checkLock && checkLock.timestamp !== (await get<{ locked: boolean; timestamp: number }>(SYNC_LOCK_KEY))?.timestamp) {
      console.log('Lost lock race, another process acquired it')
      return false
    }

    return true
  }

  async releaseSyncLock(): Promise<void> {
    await set(SYNC_LOCK_KEY, { locked: false, timestamp: 0 })
  }

  async isSyncLocked(): Promise<boolean> {
    const lock = await get<{ locked: boolean; timestamp: number }>(SYNC_LOCK_KEY)
    if (!lock || !lock.locked) return false

    // Check if lock is expired (older than 2 minutes)
    const lockAge = Date.now() - lock.timestamp
    if (lockAge >= 120000) {
      await this.releaseSyncLock()
      return false
    }

    return true
  }

  /**
   * Check if order is safe to sync (not already syncing)
   */
  async isOrderSafeToSync(localId: string): Promise<boolean> {
    const orders = await this.getAllOrders()
    const order = orders.find(o => o.localId === localId)

    if (!order) return false

    if (order.syncStatus === 'syncing') {
      // Check if it's been syncing for too long (more than 1 minute)
      // This could indicate a failed sync that didn't revert
      const now = Date.now()
      const createdTime = new Date(order.createdAt).getTime()
      const syncAge = now - createdTime

      if (syncAge > 60000) {
        // Reset to pending if stuck
        await this.revertToPending(localId)
        return true
      }
      return false
    }

    return order.syncStatus === 'pending'
  }
}

export const offlineStorage = new OfflineStorageService()
