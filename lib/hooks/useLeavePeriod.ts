import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type LeaveType =
  | 'ANNUAL_LEAVE'
  | 'SICK_LEAVE'
  | 'MATERNITY_LEAVE'
  | 'PATERNITY_LEAVE'
  | 'UNPAID_LEAVE'
  | 'REMOTE_WORK'
  | 'TRAINING'
  | 'OTHER'

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeavePeriod {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  leaveType: LeaveType
  reason: string | null
  status: LeaveStatus
  approvedBy: string | null
  approvedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    position: string
  }
  // Champs calculés ajoutés par l'API
  daysCount?: number
  isCurrent?: boolean
  isUpcoming?: boolean
  isPast?: boolean
}

export interface LeavePeriodStats {
  total: number
  pending: number
  approved: number
  rejected: number
  cancelled: number
  upcoming: number
  current: number
}

interface LeavePeriodResponse {
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    position: string
    department: string
  }
  leavePeriods: LeavePeriod[]
  stats: LeavePeriodStats
}

interface CreateLeavePeriodParams {
  employeeId: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  leaveType: LeaveType
  reason?: string
  notes?: string
}

interface UpdateLeavePeriodParams {
  leavePeriodId: string
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED'
  notes?: string
}

interface UseEmployeeLeavesOptions {
  status?: LeaveStatus
  upcomingOnly?: boolean
}

/**
 * Hook pour récupérer les périodes d'absence d'un employé
 */
export function useEmployeeLeaves(
  employeeId: string | null | undefined,
  options?: UseEmployeeLeavesOptions
) {
  const { status, upcomingOnly } = options || {}

  return useQuery<LeavePeriodResponse>({
    queryKey: ['leave-periods', employeeId, status, upcomingOnly],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (status) {
        params.append('status', status)
      }

      if (upcomingOnly) {
        params.append('upcoming', 'true')
      }

      const url = `/api/leave-period/${employeeId}${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la récupération des périodes d\'absence')
      }

      return response.json()
    },
    enabled: !!employeeId
  })
}

/**
 * Hook pour gérer les périodes d'absence (création et mise à jour)
 */
export function useLeavePeriod() {
  const queryClient = useQueryClient()

  // Créer une période d'absence
  const createLeavePeriod = useMutation({
    mutationFn: async (params: CreateLeavePeriodParams) => {
      const response = await fetch('/api/leave-period', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la période d\'absence')
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalider les queries liées à cet employé
      queryClient.invalidateQueries({
        queryKey: ['leave-periods', variables.employeeId]
      })
    }
  })

  // Mettre à jour le statut d'une période (approuver, rejeter, annuler)
  const updateLeavePeriodStatus = useMutation({
    mutationFn: async ({
      employeeId,
      ...params
    }: UpdateLeavePeriodParams & { employeeId: string }) => {
      const response = await fetch(`/api/leave-period/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de la période d\'absence')
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalider les queries liées à cet employé
      queryClient.invalidateQueries({
        queryKey: ['leave-periods', variables.employeeId]
      })
    }
  })

  return {
    createLeavePeriod,
    updateLeavePeriodStatus
  }
}

/**
 * Helper pour obtenir le label d'un type de congé
 */
export function getLeaveTypeLabel(type: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    ANNUAL_LEAVE: 'Congés annuels',
    SICK_LEAVE: 'Arrêt maladie',
    MATERNITY_LEAVE: 'Congé maternité',
    PATERNITY_LEAVE: 'Congé paternité',
    UNPAID_LEAVE: 'Congé sans solde',
    REMOTE_WORK: 'Télétravail',
    TRAINING: 'Formation',
    OTHER: 'Autre'
  }
  return labels[type] || type
}

/**
 * Helper pour obtenir le label d'un statut de congé
 */
export function getLeaveStatusLabel(status: LeaveStatus): string {
  const labels: Record<LeaveStatus, string> = {
    PENDING: 'En attente',
    APPROVED: 'Approuvé',
    REJECTED: 'Refusé',
    CANCELLED: 'Annulé'
  }
  return labels[status] || status
}

/**
 * Helper pour obtenir la couleur d'un statut
 */
export function getLeaveStatusColor(status: LeaveStatus): string {
  const colors: Record<LeaveStatus, string> = {
    PENDING: 'text-yellow-600 bg-yellow-100',
    APPROVED: 'text-green-600 bg-green-100',
    REJECTED: 'text-red-600 bg-red-100',
    CANCELLED: 'text-gray-600 bg-gray-100'
  }
  return colors[status] || 'text-gray-600 bg-gray-100'
}
