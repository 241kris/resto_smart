import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface AttendanceMonth {
  id: string
  establishmentId: string
  year: number
  month: number
  status: 'OPEN' | 'CLOSED'
  openedAt: string
  closedAt: string | null
}

interface OpenMonthParams {
  year: number
  month: number
}

interface CloseMonthParams {
  year: number
  month: number
}

/**
 * Hook pour gérer les mois de pointage (ouvrir/fermer)
 */
export function useAttendanceMonth() {
  const queryClient = useQueryClient()

  // Ouvrir un mois
  const openMonth = useMutation({
    mutationFn: async (params: OpenMonthParams) => {
      const response = await fetch('/api/attendance-month/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ouverture du mois')
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalider les queries liées à ce mois
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'month', variables.year, variables.month]
      })
    }
  })

  // Fermer un mois
  const closeMonth = useMutation({
    mutationFn: async (params: CloseMonthParams) => {
      const response = await fetch('/api/attendance-month/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la clôture du mois')
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalider les queries liées à ce mois
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'month', variables.year, variables.month]
      })
    }
  })

  return {
    openMonth,
    closeMonth
  }
}
