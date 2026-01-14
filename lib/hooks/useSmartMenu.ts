import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ==================== TYPES ====================

export interface DishOfTheDay {
  id: string
  productId: string
  date: string
  displayOrder: number
  specialDescription: string | null
  isActive: boolean
  product: {
    id: string
    name: string
    price: number
    image: string | null
    category: {
      id: string
      name: string
    } | null
  }
}

export interface Promotion {
  id: string
  productId: string
  name: string
  discountedPrice: number
  discountPercent: number | null
  startDate: string
  endDate: string
  daysOfWeek: string[] | null
  startTime: string | null
  endTime: string | null
  displayOrder: number
  isActive: boolean
  description: string | null
  badge: string | null
  product: {
    id: string
    name: string
    price: number
    image: string | null
    category: {
      id: string
      name: string
    } | null
  }
}

export interface Recommendation {
  id: string
  productId: string
  type: string
  reason: string | null
  score: number
  displayOrder: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  badge: string | null
  product: {
    id: string
    name: string
    price: number
    image: string | null
    category: {
      id: string
      name: string
    } | null
  }
}

// ==================== PLATS DU JOUR ====================

export function useDishesOfTheDay(date?: string) {
  return useQuery<{ dishesOfTheDay: DishOfTheDay[] }>({
    queryKey: ['dishesOfTheDay', date],
    queryFn: async () => {
      const url = date ? `/api/menu/dish-of-day?date=${date}` : '/api/menu/dish-of-day'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des plats du jour')
      }
      return response.json()
    }
  })
}

export function useCreateDishOfTheDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      productId: string
      date: string
      displayOrder?: number
      specialDescription?: string
    }) => {
      const response = await fetch('/api/menu/dish-of-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishesOfTheDay'] })
    }
  })
}

export function useDeleteDishOfTheDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/menu/dish-of-day?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishesOfTheDay'] })
    }
  })
}

// ==================== PROMOTIONS ====================

export function usePromotions(filter: 'active' | 'all' | 'upcoming' | 'expired' = 'active') {
  return useQuery<{ promotions: Promotion[] }>({
    queryKey: ['promotions', filter],
    queryFn: async () => {
      const response = await fetch(`/api/menu/promotions?filter=${filter}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des promotions')
      }
      return response.json()
    }
  })
}

export function useCreatePromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      productId: string
      name: string
      discountedPrice: number
      startDate: string
      endDate: string
      daysOfWeek?: string[]
      startTime?: string
      endTime?: string
      displayOrder?: number
      description?: string
      badge?: string
    }) => {
      const response = await fetch('/api/menu/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    }
  })
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: Partial<{
        name: string
        discountedPrice: number
        startDate: string
        endDate: string
        daysOfWeek: string[]
        startTime: string
        endTime: string
        displayOrder: number
        isActive: boolean
        description: string
        badge: string
      }>
    }) => {
      const response = await fetch(`/api/menu/promotions?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    }
  })
}

export function useDeletePromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/menu/promotions?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    }
  })
}

// ==================== RECOMMANDATIONS ====================

export function useRecommendations(type?: string) {
  return useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['recommendations', type],
    queryFn: async () => {
      const url = type ? `/api/menu/recommendations?type=${type}` : '/api/menu/recommendations'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des recommandations')
      }
      return response.json()
    }
  })
}

export function useCreateRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      productId: string
      type: string
      reason?: string
      score?: number
      displayOrder?: number
      startDate?: string
      endDate?: string
      badge?: string
    }) => {
      const response = await fetch('/api/menu/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    }
  })
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: Partial<{
        type: string
        reason: string
        score: number
        displayOrder: number
        startDate: string
        endDate: string
        isActive: boolean
        badge: string
      }>
    }) => {
      const response = await fetch(`/api/menu/recommendations?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    }
  })
}

export function useDeleteRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/menu/recommendations?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    }
  })
}

// ==================== MENU PUBLIC ====================

export function usePublicMenu(slug: string) {
  return useQuery({
    queryKey: ['publicMenu', slug],
    queryFn: async () => {
      const response = await fetch(`/api/menu/public/${slug}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du menu')
      }
      return response.json()
    },
    enabled: !!slug
  })
}
