import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface ScheduleEmployee {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  position: string
  department?: string
  status?: string
}

export interface ScheduleAssignment {
  id: string
  employeeId: string
  scheduleId: string
  assignedAt: string
  updatedAt: string
  employee: ScheduleEmployee
}

export interface ScheduleDay {
  id: string
  scheduleId: string
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  dailyHoursCalculated: number | null
  dailyHoursManual: number | null
}

export interface Schedule {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  days: ScheduleDay[]
  employeeAssignments: ScheduleAssignment[]
}

// Hook pour récupérer tous les plannings
export function useSchedules() {
  return useQuery<{ schedules: Schedule[] }>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await fetch('/api/schedules')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des plannings')
      }
      return response.json()
    }
  })
}

// Hook pour récupérer un planning par ID
export function useSchedule(id: string) {
  return useQuery<{ schedule: Schedule }>({
    queryKey: ['schedule', id],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${id}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du planning')
      }
      return response.json()
    },
    enabled: !!id
  })
}

// Hook pour supprimer un planning
export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
