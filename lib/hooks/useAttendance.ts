import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'REST_DAY'
  | 'LEAVE'
  | 'SICK'
  | 'REMOTE'
  | 'TRAINING'
  | 'OTHER'

export interface Attendance {
  id: string
  employeeId: string
  monthId: string
  date: string
  status: AttendanceStatus
  startTime: string | null
  endTime: string | null
  workedHours: number | null
  lateMinutes: number | null
  overtimeMinutes: number | null
  isException: boolean
  exceptionReason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    position: string
    department: string
    contractType: string
  }
}

export interface EmployeeStats {
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    position: string
    department: string
    contractType: string
  }
  stats: {
    totalDays: number
    daysPresent: number
    daysAbsent: number
    daysRestDay: number
    daysLeave: number
    daysSick: number
    daysRemote: number
    daysTraining: number
    daysOther: number
    totalWorkedHours: number
    exceptionsCount: number
  }
  attendances: Attendance[]
}

export interface MonthlyAttendanceData {
  month: {
    id: string
    establishmentId: string
    year: number
    month: number
    status: 'OPEN' | 'CLOSED'
    openedAt: string
    closedAt: string | null
  }
  employeeStats: EmployeeStats[]
  globalStats: {
    totalEmployees: number
    totalAttendances: number
    totalPresent: number
    totalAbsent: number
    totalWorkedHours: number
    totalExceptions: number
  }
  attendances: Attendance[]
}

interface CreateAttendanceParams {
  employeeId: string
  status: AttendanceStatus
  startTime?: string
  endTime?: string
  isException?: boolean
  exceptionReason?: string
  notes?: string
}

interface UpdateAttendanceParams {
  employeeId: string
  status?: AttendanceStatus
  startTime?: string
  endTime?: string
  isException?: boolean
  exceptionReason?: string
  notes?: string
}

/**
 * Hook pour récupérer les pointages d'un mois
 */
export function useMonthlyAttendance(year: number, month: number) {
  return useQuery<MonthlyAttendanceData>({
    queryKey: ['attendance', 'month', year, month],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/month/${year}/${month}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la récupération des pointages')
      }

      return response.json()
    },
    enabled: !!(year && month)
  })
}

/**
 * Hook pour gérer les pointages journaliers (aujourd'hui uniquement)
 */
export function useAttendance() {
  const queryClient = useQueryClient()

  // Créer un pointage pour aujourd'hui
  const createTodayAttendance = useMutation({
    mutationFn: async (params: CreateAttendanceParams) => {
      const response = await fetch('/api/attendance/today', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du pointage')
      }

      return data
    },
    onSuccess: () => {
      // Invalider les queries d'attendance du mois actuel
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      queryClient.invalidateQueries({
        queryKey: ['attendance', 'month', year, month]
      })
    }
  })

  // Modifier un pointage pour aujourd'hui
  const updateTodayAttendance = useMutation({
    mutationFn: async (params: UpdateAttendanceParams) => {
      const response = await fetch('/api/attendance/today', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification du pointage')
      }

      return data
    },
    onSuccess: () => {
      // Invalider les queries d'attendance du mois actuel
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      queryClient.invalidateQueries({
        queryKey: ['attendance', 'month', year, month]
      })
    }
  })

  return {
    createTodayAttendance,
    updateTodayAttendance
  }
}
