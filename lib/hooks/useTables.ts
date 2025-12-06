import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface Table {
  id: string
  number: number
  tableToken: string
  qrUrl: string
  qrCodePath: string
  restaurantId: string
  restaurant?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateTablesData {
  restaurantId: string
  count: number
}

export interface CreateTablesResponse {
  success: boolean
  tables: Table[]
  qrCodes: Array<{
    tableId: string
    tableNumber: number
    qrCodePath: string
  }>
}

// Hook pour récupérer toutes les tables d'un restaurant
export function useTables(restaurantId?: string) {
  return useQuery<{ success: boolean; tables: Table[]; count: number }>({
    queryKey: ['tables', restaurantId],
    queryFn: async () => {
      if (!restaurantId) {
        return { success: true, tables: [], count: 0 }
      }

      const response = await fetch(`/api/tables?restaurantId=${restaurantId}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tables')
      }
      return response.json()
    },
    enabled: !!restaurantId,
  })
}

// Hook pour créer plusieurs tables à la fois
export function useCreateTables() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTablesData) => {
      const response = await fetch('/api/tables/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création des tables')
      }

      return response.json() as Promise<CreateTablesResponse>
    },
    onSuccess: (_data, variables) => {
      // Invalider et refetch les données des tables
      queryClient.invalidateQueries({ queryKey: ['tables', variables.restaurantId] })
    },
  })
}

