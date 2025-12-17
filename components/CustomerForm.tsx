"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface CustomerData {
  firstName: string
  lastName: string
  phone: string
  address: string
}

interface CustomerFormProps {
  onSubmit: (data: CustomerData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function CustomerForm({ onSubmit, onCancel, isLoading = false }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    phone: "",
    address: ""
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({})

  const handleChange = (field: keyof CustomerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerData, string>> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis"
    } else if (!/^[0-9+\s()-]+$/.test(formData.phone)) {
      newErrors.phone = "Format de téléphone invalide"
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'adresse est requise"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">📋 Informations importantes :</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Votre commande sera enregistrée et envoyée au restaurant</li>
          <li>Vous pourrez suivre son statut dans "Mes Commandes"</li>
          <li>Vous recevrez des mises à jour sur l'état de votre commande</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            Prénom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Jean"
            disabled={isLoading}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Dupont"
            disabled={isLoading}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Téléphone <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="+33 6 12 34 56 78"
          disabled={isLoading}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">
          Adresse de livraison <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="12 Rue de la Paix, 75001 Paris"
          rows={3}
          disabled={isLoading}
          className={errors.address ? "border-destructive" : ""}
        />
        {errors.address && (
          <p className="text-xs text-destructive">{errors.address}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validation...
            </>
          ) : (
            "Valider la commande"
          )}
        </Button>
      </div>
    </form>
  )
}
