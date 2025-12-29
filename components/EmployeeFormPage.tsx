"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Upload, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateEmployee, useUpdateEmployee, type Employee, type EmployeeFormData } from "@/lib/hooks/useEmployees"
import { toast } from "sonner"
import Image from "next/image"

interface EmployeeFormPageProps {
  employee?: Employee | null
  onBack: () => void
}

export default function EmployeeFormPage({ employee, onBack }: EmployeeFormPageProps) {
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    dateOfBirth: employee?.dateOfBirth ? employee.dateOfBirth.split('T')[0] : "",
    gender: employee?.gender || "MALE",
    phone: employee?.phone || "",
    email: employee?.email || "",
    address: employee?.address || "",
    identityNumber: employee?.identityNumber || "",
    position: employee?.position || "WAITER",
    department: employee?.department || "DINING_ROOM",
    hireDate: employee?.hireDate ? employee.hireDate.split('T')[0] : "",
    contractType: employee?.contractType || "CDI",
    status: employee?.status || "ACTIVE",
    avatar: employee?.avatar || ""
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(employee?.avatar || null)

  const isEditing = !!employee

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format d\'image invalide. Formats acceptés: JPEG, JPG, PNG, WEBP')
      return
    }

    // Vérifier la taille (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 3 Mo')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setAvatarPreview(base64String)
      setFormData(prev => ({ ...prev, avatar: base64String }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setFormData(prev => ({ ...prev, avatar: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: employee.id,
          data: formData
        })
        toast.success('Employé modifié avec succès')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Employé créé avec succès')
      }
      onBack()
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue')
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Modifier l'employé" : "Nouvel employé"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Modifiez les informations de l'employé" : "Ajoutez un nouvel employé à votre équipe"}
          </p>
        </div>
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
          <CardDescription>Ajoutez une photo de profil (optionnel)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Aperçu de l'avatar */}
            <div className="relative h-24 w-24 rounded-full bg-muted shrink-0">
              {avatarPreview ? (
                <>
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    fill
                    className="object-cover rounded-full"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Bouton upload */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choisir une photo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, JPG, PNG ou WEBP. Max 3 Mo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date de naissance *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Sexe *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Homme</SelectItem>
                  <SelectItem value="FEMALE">Femme</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identityNumber">Numéro d'identité (CNI/Passeport)</Label>
            <Input
              id="identityNumber"
              value={formData.identityNumber}
              onChange={(e) => handleInputChange("identityNumber", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations professionnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations professionnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position">Poste *</Label>
              <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
                <SelectTrigger id="position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAITER">Serveur</SelectItem>
                  <SelectItem value="COOK">Cuisinier</SelectItem>
                  <SelectItem value="CHEF">Chef</SelectItem>
                  <SelectItem value="CASHIER">Caissier</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="DELIVERY">Livreur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Département *</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DINING_ROOM">Salle</SelectItem>
                  <SelectItem value="KITCHEN">Cuisine</SelectItem>
                  <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                  <SelectItem value="DELIVERY">Livraison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contractType">Type de contrat *</Label>
              <Select value={formData.contractType} onValueChange={(value) => handleInputChange("contractType", value)}>
                <SelectTrigger id="contractType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="PART_TIME">Temps partiel</SelectItem>
                  <SelectItem value="DAILY_EXTRA">Extra / Journalier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hireDate">Date d'embauche *</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleInputChange("hireDate", e.target.value)}
                required
              />
            </div>
          </div>

          
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  )
}
