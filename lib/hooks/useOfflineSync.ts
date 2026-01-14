import { useState, useEffect, useCallback, useRef } from 'react'
import { offlineStorage, type OfflineOrder, type CachedProduct } from '@/lib/offlineStorage'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [cachedProducts, setCachedProducts] = useState<CachedProduct[]>([])
  const queryClient = useQueryClient()
  const syncTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const syncInProgressRef = useRef(false)

  // Detect online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Load cached data on mount
  useEffect(() => {
    const loadCache = async () => {
      const products = await offlineStorage.getProducts()
      setCachedProducts(products)

      const count = await offlineStorage.getUnsyncedCount()
      setUnsyncedCount(count)
    }
    loadCache()
  }, [])

  // Update unsynced count
  const updateUnsyncedCount = useCallback(async () => {
    const count = await offlineStorage.getUnsyncedCount()
    setUnsyncedCount(count)
  }, [])

  // Cache products with images
  const cacheProducts = useCallback(async (products: any[]) => {
    // Cache images for offline use (runs in background)
    const productsWithCachedImages = await offlineStorage.cacheProductImages(products as CachedProduct[])
    await offlineStorage.saveProducts(productsWithCachedImages)
    setCachedProducts(productsWithCachedImages)
  }, [])

  // Refresh cached products from storage
  const refreshCachedProducts = useCallback(async () => {
    const products = await offlineStorage.getProducts()
    setCachedProducts(products)
  }, [])

  /**
   * Save order (online or offline)
   */
  const saveOrder = useCallback(async (orderData: Omit<OfflineOrder, 'localId' | 'syncStatus' | 'createdAt'>) => {
    const localId = offlineStorage.generateLocalId()
    const order: OfflineOrder = {
      ...orderData,
      localId,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    }

    try {
      if (isOnline) {
        // Try server first
        try {
          const response = await fetch('/api/orders/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: orderData.restaurantId,
              tableId: orderData.tableId,
              totalAmount: orderData.totalAmount,
              status: orderData.status,
              customer: orderData.customer,
              items: orderData.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.total
              })),
              localId
            })
          })

          if (response.ok) {
            const result = await response.json()

            // Delete from local storage (no need to keep synced orders)
            await offlineStorage.deleteOrder(localId)

            // Note: Stock is already updated by the cart context when adding items
            // No need to update stock here again

            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Commande enregistrée')
            await updateUnsyncedCount()
            return result.order.id
          } else {
            throw new Error('Server error')
          }
        } catch (serverError) {
          // Fallback to offline
          console.error('Server failed, saving offline:', serverError)
          await offlineStorage.saveOrder(order)

          // Note: Stock is already updated by the cart context when adding items

          toast.warning('Sauvegardé localement (serveur inaccessible)')
          await updateUnsyncedCount()
          return localId
        }
      } else {
        // Offline mode
        await offlineStorage.saveOrder(order)

        // Note: Stock is already updated by the cart context when adding items

        toast.info('Mode hors ligne: Sauvegardé localement')
        await updateUnsyncedCount()
        return localId
      }
    } catch (error) {
      console.error('Error saving order:', error)
      toast.error("Erreur lors de l'enregistrement")
      throw error
    }
  }, [isOnline, queryClient, updateUnsyncedCount, refreshCachedProducts])

  /**
   * Sync pending orders (with lock to prevent duplicates)
   */
  const syncOrders = useCallback(async () => {
    if (!isOnline) {
      toast.error('Pas de connexion internet')
      return
    }

    // Check if sync is already running locally (component level)
    if (syncInProgressRef.current) {
      console.log('Sync already running in this component instance, skipping')
      return
    }

    // Check if already syncing globally (storage level)
    const isLocked = await offlineStorage.isSyncLocked()
    if (isLocked) {
      console.log('Sync already in progress globally, skipping')
      return
    }

    // Acquire lock
    const acquired = await offlineStorage.acquireSyncLock()
    if (!acquired) {
      console.log('Failed to acquire sync lock')
      return
    }

    // Mark sync as in progress locally
    syncInProgressRef.current = true
    setIsSyncing(true)
    setSyncProgress(0)

    try {
      const pendingOrders = await offlineStorage.getPendingOrders()

      if (pendingOrders.length === 0) {
        await offlineStorage.releaseSyncLock()
        setIsSyncing(false)
        return
      }

      toast.info(`Synchronisation de ${pendingOrders.length} commande(s)...`)

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < pendingOrders.length; i++) {
        const order = pendingOrders[i]

        try {
          // Verify order is safe to sync (not already syncing/synced)
          const isSafe = await offlineStorage.isOrderSafeToSync(order.localId)
          if (!isSafe) {
            console.log(`Skipping order ${order.localId} - not safe to sync (already syncing or synced)`)
            continue
          }

          // Mark as syncing
          await offlineStorage.markAsSyncing(order.localId)

          const response = await fetch('/api/orders/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: order.restaurantId,
              tableId: order.tableId,
              totalAmount: order.totalAmount,
              status: order.status,
              customer: order.customer,
              items: order.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.total
              })),
              localId: order.localId
            })
          })

          if (response.ok) {
            const result = await response.json()
            // Delete from local storage immediately after successful sync
            await offlineStorage.deleteOrder(order.localId)
            successCount++
          } else {
            const errorData = await response.json()
            if (errorData.code === 'DUPLICATE') {
              // Already exists on server, delete from local storage
              await offlineStorage.deleteOrder(order.localId)
              successCount++
            } else {
              await offlineStorage.revertToPending(order.localId)
              failCount++
            }
          }
        } catch (error) {
          console.error('Sync error for order:', order.localId, error)
          await offlineStorage.revertToPending(order.localId)
          failCount++
        }

        setSyncProgress(Math.round(((i + 1) / pendingOrders.length) * 100))
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      await updateUnsyncedCount()

      if (failCount === 0) {
        toast.success(`${successCount} commande(s) synchronisée(s)`)
      } else {
        toast.warning(`${successCount} réussie(s), ${failCount} échouée(s)`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Erreur de synchronisation')
    } finally {
      await offlineStorage.releaseSyncLock()
      syncInProgressRef.current = false
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }, [isOnline, queryClient, updateUnsyncedCount])

  /**
   * Auto-sync when coming online (with debounce)
   */
  useEffect(() => {
    if (isOnline && unsyncedCount > 0) {
      // Clear any existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      // Set new timeout (debounce)
      syncTimeoutRef.current = setTimeout(() => {
        syncOrders()
      }, 3000)

      return () => {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current)
        }
      }
    }
  }, [isOnline, unsyncedCount, syncOrders])

  /**
   * Update order status (for local orders)
   */
  const updateOrderStatus = useCallback(async (localId: string, newStatus: 'PENDING' | 'PAID' | 'CANCELLED' | 'completed') => {
    try {
      const orders = await offlineStorage.getAllOrders()
      const order = orders.find(o => o.localId === localId)

      if (!order) {
        toast.error('Commande introuvable')
        return
      }

      order.status = newStatus
      await offlineStorage.saveOrder(order)

      // Refresh local state
      await updateUnsyncedCount()

      toast.success('Statut mis à jour')
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }, [updateUnsyncedCount])

  // Update local stock (for cart operations)
  const updateLocalStock = useCallback(async (productId: string, quantityToSubtract: number) => {
    await offlineStorage.updateProductStock(productId, quantityToSubtract)
    await refreshCachedProducts()
  }, [refreshCachedProducts])

  // Restore local stock (when removing from cart)
  const restoreLocalStock = useCallback(async (productId: string, quantityToAdd: number) => {
    await offlineStorage.restoreProductStock(productId, quantityToAdd)
    await refreshCachedProducts()
  }, [refreshCachedProducts])

  // Get current stock for a product
  const getLocalStock = useCallback(async (productId: string): Promise<number | undefined> => {
    return await offlineStorage.getProductStock(productId)
  }, [])

  return {
    isOnline,
    isSyncing,
    syncProgress,
    unsyncedCount,
    cachedProducts,
    saveOrder,
    syncOrders,
    cacheProducts,
    refreshCachedProducts,
    updateUnsyncedCount,
    updateOrderStatus,
    updateLocalStock,
    restoreLocalStock,
    getLocalStock
  }
}

/**
 * Hook to get all orders (local + server)
 */
export function useAllOrders() {
  const [localOrders, setLocalOrders] = useState<OfflineOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await offlineStorage.getAllOrders()
        setLocalOrders(orders)
      } catch (error) {
        console.error('Error loading local orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()

    // Refresh every 5 seconds
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  return { localOrders, isLoading }
}
