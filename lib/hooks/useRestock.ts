import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface RestockHistoryItem {
  id: string
  productId: string
  quantity: number
  createdAt: string
  product: {
    id: string
    name: string
    image: string | null
    price: number
    isQuantifiable: boolean
    quantity: number | null
    category: {
      id: string
      name: string
    } | null
  }
}

export interface RestockHistoryResponse {
  restockHistory: RestockHistoryItem[]
  statistics: {
    totalRestocked: number
    uniqueProducts: number
    totalRecords: number
  }
}

/**
 * Hook pour récupérer l'historique des ravitaillements
 */
export function useRestockHistory(params?: {
  startDate?: string
  endDate?: string
  productId?: string
}) {
  return useQuery<RestockHistoryResponse>({
    queryKey: ['restock-history', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (params?.startDate) {
        searchParams.append('startDate', params.startDate)
      }
      if (params?.endDate) {
        searchParams.append('endDate', params.endDate)
      }
      if (params?.productId) {
        searchParams.append('productId', params.productId)
      }

      const url = `/api/restock${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération de l\'historique')
      }

      return response.json()
    }
  })
}

/**
 * Hook pour créer un ravitaillement
 */
export function useCreateRestock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      productId: string
      quantity: number
    }) => {
      const response = await fetch('/api/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du ravitaillement')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalider les requêtes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['restock-history'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
