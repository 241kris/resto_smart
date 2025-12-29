import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface EmployeeDocument {
  id: string
  employeeId: string
  documentType: string
  fileName: string
  fileUrl: string
  uploadedAt: string
  updatedAt: string
}

export interface EmployeeScheduleDay {
  id: string
  scheduleId: string
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  dailyHoursCalculated: number | null
  dailyHoursManual: number | null
}

export interface EmployeeSchedule {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  days?: EmployeeScheduleDay[]
}

export interface EmployeeScheduleAssignment {
  id: string
  employeeId: string
  scheduleId: string
  assignedAt: string
  updatedAt: string
  schedule?: EmployeeSchedule
}

export interface Employee {
  id: string
  establishmentId: string
  firstName: string
  lastName: string
  avatar: string | null
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  phone: string
  email: string | null
  address: string
  identityNumber: string | null
  position: 'WAITER' | 'COOK' | 'CHEF' | 'CASHIER' | 'MANAGER' | 'DELIVERY'
  department: 'DINING_ROOM' | 'KITCHEN' | 'ADMINISTRATION' | 'DELIVERY'
  hireDate: string
  contractType: 'CDI' | 'CDD' | 'PART_TIME' | 'DAILY_EXTRA'
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED'
  createdAt: string
  updatedAt: string
  documents?: EmployeeDocument[]
  scheduleAssignment?: EmployeeScheduleAssignment
}

export interface EmployeeFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  phone: string
  email?: string
  address: string
  identityNumber?: string
  position: 'WAITER' | 'COOK' | 'CHEF' | 'CASHIER' | 'MANAGER' | 'DELIVERY'
  department: 'DINING_ROOM' | 'KITCHEN' | 'ADMINISTRATION' | 'DELIVERY'
  hireDate: string
  contractType: 'CDI' | 'CDD' | 'PART_TIME' | 'DAILY_EXTRA'
  status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED'
  avatar?: string
}

// Hook pour récupérer tous les employés
export function useEmployees() {
  return useQuery<{ employees: Employee[] }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des employés')
      }
      return response.json()
    }
  })
}

// Hook pour récupérer un employé par ID
export function useEmployee(id: string) {
  return useQuery<{ employee: Employee }>({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${id}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'employé')
      }
      return response.json()
    },
    enabled: !!id
  })
}

// Hook pour créer un employé
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// Hook pour mettre à jour un employé
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmployeeFormData }) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] })
    },
  })
}

// Hook pour supprimer un employé
export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// Hook pour mettre à jour le statut d'un employé
export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' }) => {
      const response = await fetch(`/api/employees/${id}`, {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] })
    },
  })
}

// =====================================
// HOOKS POUR LES DOCUMENTS DES EMPLOYÉS
// =====================================

export interface EmployeeDocumentFormData {
  documentType: string
  fileName: string
  file: string
}

// Hook pour récupérer les documents d'un employé
export function useEmployeeDocuments(employeeId: string) {
  return useQuery<{ documents: EmployeeDocument[] }>({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/documents`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des documents')
      }
      return response.json()
    },
    enabled: !!employeeId
  })
}

// Hook pour créer un document
export function useCreateEmployeeDocument(employeeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EmployeeDocumentFormData) => {
      const response = await fetch(`/api/employees/${employeeId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création du document')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
    },
  })
}

// Hook pour modifier un document
export function useUpdateEmployeeDocument(employeeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, data }: { documentId: string; data: Partial<EmployeeDocumentFormData> }) => {
      const response = await fetch(`/api/employees/${employeeId}/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la modification du document')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
    },
  })
}

// Hook pour supprimer un document
export function useDeleteEmployeeDocument(employeeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/employees/${employeeId}/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression du document')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
    },
  })
}

// =====================================
// HOOKS POUR LES PLANNINGS DES EMPLOYÉS
// =====================================

export interface EmployeeScheduleDayFormData {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  isWorkingDay: boolean
  startTime?: string
  endTime?: string
  dailyHoursManual?: number
}

export interface EmployeeScheduleFormData {
  name: string
  days: EmployeeScheduleDayFormData[]
}

// Hook pour récupérer le planning actif d'un employé
export function useEmployeeSchedule(employeeId: string) {
  return useQuery<{ schedule: EmployeeSchedule | null }>({
    queryKey: ['employee-schedule', employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/schedule`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du planning')
      }
      return response.json()
    },
    enabled: !!employeeId
  })
}

// Hook pour créer un planning
export function useCreateEmployeeSchedule(employeeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EmployeeScheduleFormData) => {
      const response = await fetch(`/api/employees/${employeeId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création du planning')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-schedule', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
