import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
      // Invalider le mois ouvert
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'month', 'current']
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
      // Invalider le mois ouvert
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'month', 'current']
      })
    }
  })

  return {
    openMonth,
    closeMonth
  }
}

/**
 * Hook pour récupérer le mois actuellement ouvert et le dernier mois clôturé
 */
export function useCurrentOpenMonth() {
  return useQuery<{ openMonth: AttendanceMonth | null; lastClosedMonth: AttendanceMonth | null }>({
    queryKey: ['attendance', 'month', 'current'],
    queryFn: async () => {
      const response = await fetch('/api/attendance-month/current')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la récupération du mois ouvert')
      }

      return response.json()
    }
  })
}
