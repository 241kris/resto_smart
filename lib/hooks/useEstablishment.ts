import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface Establishment {
  id: string
  name: string
  email: string | null
  phone: string
  address: string
  image_cover: string | null
  userId: string
  createdAt: string
}

export interface EstablishmentFormData {
  name: string
  email: string
  phone: string
  address: string
  image_cover?: string
}

// Hook pour récupérer l'établissement
export function useEstablishment() {
  return useQuery<{ establishment: Establishment | null }>({
    queryKey: ['establishment'],
    queryFn: async () => {
      const response = await fetch('/api/establishment')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'établissement')
      }
      return response.json()
    }
  })
}

// Hook pour créer ou mettre à jour l'établissement
export function useCreateOrUpdateEstablishment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EstablishmentFormData) => {
      const response = await fetch('/api/establishment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalider et refetch les données de l'établissement
      queryClient.invalidateQueries({ queryKey: ['establishment'] })
      // Invalider aussi la session pour mettre à jour l'establishmentId
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })
}
