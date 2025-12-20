import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface Table {
  id: string
  name: string // Changé de 'number' à 'name'
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

export interface CreateTableData {
  restaurantId: string
  name: string
}

export interface CreateTableResponse {
  success: boolean
  table: Table
  qrCode: string
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

// Hook pour créer une seule table
export function useCreateTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTableData) => {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création de la table')
      }

      return response.json() as Promise<CreateTableResponse>
    },
    onSuccess: (_data, variables) => {
      // Invalider et refetch les données des tables
      queryClient.invalidateQueries({ queryKey: ['tables', variables.restaurantId] })
    },
  })
}

// Hook pour supprimer plusieurs tables
export function useDeleteTables() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { tableIds: string[]; restaurantId: string }) => {
      const response = await fetch('/api/tables', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableIds: data.tableIds }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression des tables')
      }

      return response.json() as Promise<{ success: boolean; message: string; deletedCount: number }>
    },
    onSuccess: (_data, variables) => {
      // Invalider et refetch les données des tables
      queryClient.invalidateQueries({ queryKey: ['tables', variables.restaurantId] })
    },
  })
}

