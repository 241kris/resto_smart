import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface OrderItem {
  id: string
  product: {
    id: string
    name: string
    image: string | null
  }
  quantity: number
  price: number
  total: number
}

export interface Order {
  id: string
  totalAmount: number
  status: 'PENDING' | 'completed' | 'PAID' | 'CANCELLED'
  table: {
    id: string
    number: number
    tableToken: string
  }
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrdersResponse {
  success: boolean
  orders: Order[]
  count: number
}

// Hook pour récupérer toutes les commandes
export function useOrders() {
  return useQuery<OrdersResponse>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération des commandes')
      }

      return response.json()
    },

    // ⏳ Rafraîchir toutes les 10 secondes
    refetchInterval: 10000,

    // 🔥 Très important !
    refetchIntervalInBackground: true,

    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}


// Hook pour mettre à jour le statut d'une commande
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: 'PENDING' | 'completed' | 'PAID' | 'CANCELLED' }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour du statut')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// Hook pour supprimer une commande
export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression de la commande')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
