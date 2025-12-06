import { useQuery } from '@tanstack/react-query'

export interface Category {
  id: string
  name: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  categoryId: string | null
  category: Category | null
}

export interface Restaurant {
  id: string
  name: string
  email: string | null
  phone: string
  address: string
  coverImage: string | null
}

export interface RestaurantMenuResponse {
  success: boolean
  restaurant: Restaurant
  categories: Category[]
  products: Product[]
  totalProducts: number
  totalCategories: number
}

// Hook pour récupérer le menu complet d'un restaurant (route publique)
export function useRestaurantMenu(restaurantId?: string) {
  return useQuery<RestaurantMenuResponse>({
    queryKey: ['restaurant-menu', restaurantId],
    queryFn: async () => {
      if (!restaurantId) {
        throw new Error('ID du restaurant requis')
      }

      const response = await fetch(`/api/restaurants/${restaurantId}/menu`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération du menu')
      }

      return response.json()
    },
    enabled: !!restaurantId,
  })
}
