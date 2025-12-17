import { useEffect } from 'react'
import { pusherClient } from '@/lib/pusher-client'
import { useQueryClient } from '@tanstack/react-query'
import type { Order } from './useOrders'

/**
 * Hook pour écouter les événements Pusher en temps réel
 * @param restaurantId - ID du restaurant
 */
export function usePusher(restaurantId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!restaurantId) return

    const channelName = `restaurant-${restaurantId}`
    const channel = pusherClient.subscribe(channelName)

    // Écouter les nouvelles commandes
    channel.bind('new-order', (order: Order) => {
      console.log('Nouvelle commande reçue via Pusher:', order)

      // Invalider et refetch les commandes pour mettre à jour la liste
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })

    // Écouter les mises à jour de commandes
    channel.bind('order-updated', (order: Order) => {
      console.log('Commande mise à jour via Pusher:', order)

      // Invalider et refetch les commandes pour mettre à jour la liste
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })

    // Cleanup à la désinscription
    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [restaurantId, queryClient])
}
