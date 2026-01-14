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
  isQuantifiable: boolean
  quantity: number | null
  promotion?: {
    id: string
    name: string
    discountedPrice: number
    discountPercent: number | null
    badge: string | null
    description: string | null
  } | null
  isDishOfDay?: boolean
  recommendation?: {
    id: string
    type: string
    reason: string | null
    badge: string | null
    score: number
  } | null
}

export interface Restaurant {
  id: string
  name: string
  slug: string | null
  description: string | null
  email: string | null
  phones: string[]
  images: string[]
  address: any
  latitude: number | null
  longitude: number | null
}

export interface DishOfTheDay {
  id: string
  product: {
    id: string
    name: string
    price: number
    image: string | null
    category: Category | null
  }
  specialDescription: string | null
  displayOrder: number
}

export interface Promotion {
  id: string
  name: string
  product: {
    id: string
    name: string
    price: number
    image: string | null
    category: Category | null
  }
  discountedPrice: number
  discountPercent: number | null
  badge: string | null
  description: string | null
  displayOrder: number
}

export interface Recommendation {
  id: string
  type: string
  product: {
    id: string
    name: string
    price: number
    image: string | null
    category: Category | null
  }
  reason: string | null
  badge: string | null
  score: number
  displayOrder: number
}

export interface RestaurantMenuResponse {
  success: boolean
  restaurant: Restaurant
  categories: Category[]
  products: Product[]
  totalProducts: number
  totalCategories: number
  dishesOfTheDay?: DishOfTheDay[]
  promotions?: Promotion[]
  recommendations?: Recommendation[]
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
