// Utilitaires pour gérer les commandes dans le localStorage

export interface StoredOrder {
  id: string
  restaurantId: string
  restaurantName: string
  totalAmount: number
  status: string
  items: Array<{
    id: string
    product: {
      id: string
      name: string
      image: string | null
    }
    quantity: number
    price: number
    total: number
  }>
  createdAt: string
}

const ORDERS_STORAGE_KEY = 'restaurant_orders'

/**
 * Sauvegarde une commande dans le localStorage
 */
export function saveOrderToLocalStorage(order: StoredOrder): void {
  try {
    // Récupérer les commandes existantes
    const existingOrders = getOrdersFromLocalStorage()

    // Ajouter la nouvelle commande
    const updatedOrders = [order, ...existingOrders]

    // Sauvegarder dans le localStorage
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders))

    console.log('✅ Commande sauvegardée dans le localStorage')
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la commande:', error)
  }
}

/**
 * Récupère toutes les commandes du localStorage
 */
export function getOrdersFromLocalStorage(): StoredOrder[] {
  try {
    const ordersJson = localStorage.getItem(ORDERS_STORAGE_KEY)

    if (!ordersJson) {
      return []
    }

    const orders: StoredOrder[] = JSON.parse(ordersJson)
    return orders
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des commandes:', error)
    return []
  }
}

/**
 * Met à jour le statut d'une commande dans le localStorage
 */
export function updateOrderStatusInLocalStorage(orderId: string, newStatus: string): void {
  try {
    const orders = getOrdersFromLocalStorage()
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders))
    console.log('✅ Statut de la commande mis à jour dans le localStorage')
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error)
  }
}

/**
 * Supprime une commande spécifique du localStorage
 */
export function removeOrderFromLocalStorage(orderId: string): void {
  try {
    const orders = getOrdersFromLocalStorage()
    const updatedOrders = orders.filter(order => order.id !== orderId)

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders))
    console.log('✅ Commande supprimée du localStorage')
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la commande:', error)
  }
}
