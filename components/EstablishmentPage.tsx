"use client"

import { useState, useEffect } from "react"
import { Store, Mail, Phone, MapPin, Upload, Pencil, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEstablishment, useCreateOrUpdateEstablishment, type EstablishmentFormData } from "@/lib/hooks/useEstablishment"
import Image from "next/image"

export default function EstablishmentPage() {
  const { data, isLoading, error } = useEstablishment()
  const createOrUpdateMutation = useCreateOrUpdateEstablishment()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<EstablishmentFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    image_cover: ""
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageError, setImageError] = useState<string>("")

  // Initialiser le formulaire avec les données de l'établissement
  useEffect(() => {
    if (data?.establishment) {
      setFormData({
        name: data.establishment.name,
        email: data.establishment.email || "",
        phone: data.establishment.phone,
        address: data.establishment.address,
        image_cover: data.establishment.image_cover || ""
      })
      setImagePreview(data.establishment.image_cover || "")
      setIsEditing(false)
    } else if (data?.establishment === null) {
      // Aucun établissement, mode création
      setIsEditing(true)
    }
  }, [data])

  const handleInputChange = (field: keyof EstablishmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError("")

    if (file) {
      // Vérifier le type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setImageError("Format d'image invalide. Formats acceptés: JPEG, JPG, PNG, GIF, WEBP")
        return
      }

      // Vérifier la taille (max 3MB)
      const maxSize = 3 * 1024 * 1024 // 3MB en bytes
      if (file.size > maxSize) {
        setImageError("L'image ne doit pas dépasser 3 Mo")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setFormData(prev => ({ ...prev, image_cover: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      await createOrUpdateMutation.mutateAsync(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const handleCancel = () => {
    if (data?.establishment) {
      setFormData({
        name: data.establishment.name,
        email: data.establishment.email || "",
        phone: data.establishment.phone,
        address: data.establishment.address,
        image_cover: data.establishment.image_cover || ""
      })
      setImagePreview(data.establishment.image_cover || "")
      setIsEditing(false)
    }
    setImageError("")
  }

  // Affichage du loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))] mx-auto"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))]">Chargement...</p>
        </div>
      </div>
    )
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Erreur lors du chargement de l'établissement</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const establishment = data?.establishment

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Établissement</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            {establishment ? "Gérez les informations de votre restaurant" : "Créez votre établissement"}
          </p>
        </div>
        {establishment && !isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="gap-2 bg-[hsl(var(--edit))] text-[hsl(var(--edit-foreground))] hover:bg-[hsl(var(--edit))]/90"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
        )}
      </div>

      {/* Erreur de mutation */}
      {createOrUpdateMutation.isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{(createOrUpdateMutation.error as Error)?.message || "Erreur lors de la sauvegarde"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Image de couverture
          </CardTitle>
          <CardDescription>
            Cette image sera affichée en haut de votre page restaurant (Formats: JPEG, JPG, PNG, GIF, WEBP - Max: 3 Mo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative h-64 w-full rounded-lg overflow-hidden bg-[hsl(var(--muted))]">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
                </div>
              )}
            </div>
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="coverImage">Image de couverture</Label>
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imageError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{imageError}</p>
                  </div>
                )}
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Formats acceptés: JPEG, JPG, PNG, GIF, WEBP (Max: 3 Mo)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Establishment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Nom de l'établissement *
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nom du restaurant"
                required
              />
            ) : (
              <p className="text-lg font-medium pl-6">{establishment?.name || "-"}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Email
            </Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contact@restaurant.fr"
              />
            ) : (
              <p className="text-lg pl-6">{establishment?.email || "-"}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Téléphone *
            </Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+33 1 23 45 67 89"
                required
              />
            ) : (
              <p className="text-lg pl-6">{establishment?.phone || "-"}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Adresse *
            </Label>
            {isEditing ? (
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Adresse complète du restaurant"
                rows={3}
                required
              />
            ) : (
              <p className="text-lg pl-6 whitespace-pre-wrap">{establishment?.address || "-"}</p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={createOrUpdateMutation.isPending || !formData.name || !formData.phone || !formData.address}
              >
                {createOrUpdateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              {establishment && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={createOrUpdateMutation.isPending}
                >
                  Annuler
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[hsl(var(--muted))]/50">
        <CardHeader>
          <CardTitle className="text-lg">À propos des informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Ces informations seront visibles par vos clients sur la page de menu en ligne.
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Assurez-vous que toutes les informations sont à jour et correctes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
