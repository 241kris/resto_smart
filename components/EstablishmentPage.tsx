"use client"

import { useState, useEffect } from "react"
import { Store, Mail, Phone, MapPin, Upload, Pencil, AlertCircle, X, Plus, FileText, Share2, Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEstablishment, useCreateOrUpdateEstablishment, type EstablishmentFormData } from "@/lib/hooks/useEstablishment"
import { useAuth } from "@/lib/AuthContext"
import Image from "next/image"

export default function EstablishmentPage() {
  const { data, isLoading, error } = useEstablishment()
  const createOrUpdateMutation = useCreateOrUpdateEstablishment()
  const { checkSession } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<EstablishmentFormData>({
    name: "",
    description: "",
    email: "",
    phones: [""],
    images: [],
    address: ""
  })
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState<string>("")
  const [copied, setCopied] = useState(false)

  // Initialiser le formulaire avec les données de l'établissement
  useEffect(() => {
    if (data?.establishment) {
      setFormData({
        name: data.establishment.name,
        description: data.establishment.description || "",
        email: data.establishment.email || "",
        phones: data.establishment.phones.length > 0 ? data.establishment.phones : [""],
        images: data.establishment.images || [],
        address: typeof data.establishment.address === 'string'
          ? data.establishment.address
          : JSON.stringify(data.establishment.address)
      })
      setImagePreviews(data.establishment.images || [])
      setIsEditing(false)
    } else if (data?.establishment === null) {
      // Aucun établissement, mode création
      setIsEditing(true)
    }
  }, [data])

  const handleInputChange = (field: keyof EstablishmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Gestion des téléphones
  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phones]
    newPhones[index] = value
    setFormData(prev => ({ ...prev, phones: newPhones }))
  }

  const addPhone = () => {
    if (formData.phones.length < 3) {
      setFormData(prev => ({ ...prev, phones: [...prev.phones, ""] }))
    }
  }

  const removePhone = (index: number) => {
    if (formData.phones.length > 1) {
      const newPhones = formData.phones.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, phones: newPhones }))
    }
  }

  // Gestion des images
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageError("")

    if (files.length + formData.images.length > 7) {
      setImageError("Vous pouvez ajouter un maximum de 7 images")
      return
    }

    files.forEach(file => {
      // Vérifier le type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setImageError("Format d'image invalide. Formats acceptés: JPEG, JPG, PNG, GIF, WEBP")
        return
      }

      // Vérifier la taille (max 3MB)
      const maxSize = 3 * 1024 * 1024
      if (file.size > maxSize) {
        setImageError("Chaque image ne doit pas dépasser 3 Mo")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreviews(prev => [...prev, result])
        setFormData(prev => ({ ...prev, images: [...prev.images, result] }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    try {
      // Filtrer les téléphones vides
      const validPhones = formData.phones.filter(phone => phone.trim() !== "")

      if (validPhones.length === 0) {
        setImageError("Au moins un numéro de téléphone est requis")
        return
      }

      await createOrUpdateMutation.mutateAsync({
        ...formData,
        phones: validPhones
      })

      // Rafraîchir la session pour mettre à jour l'establishmentId
      await checkSession()

      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const handleCancel = () => {
    if (data?.establishment) {
      setFormData({
        name: data.establishment.name,
        description: data.establishment.description || "",
        email: data.establishment.email || "",
        phones: data.establishment.phones.length > 0 ? data.establishment.phones : [""],
        images: data.establishment.images || [],
        address: typeof data.establishment.address === 'string'
          ? data.establishment.address
          : JSON.stringify(data.establishment.address)
      })
      setImagePreviews(data.establishment.images || [])
      setIsEditing(false)
    }
    setImageError("")
  }

  const handleCopyLink = () => {
    if (establishment?.slug) {
      const menuUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${establishment.slug}`
      navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
      {(createOrUpdateMutation.isError || imageError) && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{imageError || (createOrUpdateMutation.error as Error)?.message || "Erreur lors de la sauvegarde"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Images du restaurant ({imagePreviews.length}/7)
          </CardTitle>
          <CardDescription>
            Ajoutez jusqu'à 7 images pour présenter votre établissement (Formats: JPEG, JPG, PNG, GIF, WEBP - Max: 3 Mo chacune)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Grid d'images */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="relative h-40 w-full rounded-lg overflow-hidden bg-[hsl(var(--muted))]">
                    <Image
                      src={preview}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {isEditing && (
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {index === 0 && (
                    <p className="text-xs text-center mt-1 text-[hsl(var(--muted-foreground))]">
                      Image principale
                    </p>
                  )}
                </div>
              ))}

              {/* Bouton d'ajout d'images */}
              {isEditing && imagePreviews.length < 7 && (
                <label className="relative h-40 w-full rounded-lg border-2 border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors cursor-pointer flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImagesChange}
                    className="hidden"
                    multiple
                  />
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Ajouter des images</p>
                  </div>
                </label>
              )}
            </div>

            {imagePreviews.length === 0 && !isEditing && (
              <div className="h-40 rounded-lg border-2 border-dashed border-[hsl(var(--border))] flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucune image</p>
                </div>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Description
            </Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Décrivez votre établissement..."
                rows={4}
              />
            ) : (
              <p className="text-lg pl-6 whitespace-pre-wrap">{establishment?.description || "-"}</p>
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

          {/* Phones */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Téléphone(s) * (Maximum 3)
            </Label>
            {isEditing ? (
              <div className="space-y-2">
                {formData.phones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      placeholder={`Téléphone ${index + 1}`}
                      required={index === 0}
                    />
                    {formData.phones.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePhone(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {formData.phones.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPhone}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un téléphone
                  </Button>
                )}
              </div>
            ) : (
              <div className="pl-6 space-y-1">
                {establishment?.phones.map((phone, index) => (
                  <p key={index} className="text-lg">{phone}</p>
                ))}
              </div>
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
              <p className="text-lg pl-6 whitespace-pre-wrap">{establishment?.address ? (typeof establishment.address === 'string' ? establishment.address : JSON.stringify(establishment.address)) : "-"}</p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={createOrUpdateMutation.isPending || !formData.name || !formData.address || formData.phones.filter(p => p.trim()).length === 0}
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

      {/* Share Menu Link Card */}
      {establishment && establishment.slug && (
        <Card className="bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--primary))]">
              <Share2 className="h-5 w-5" />
              Lien du menu digital
            </CardTitle>
            <CardDescription>
              Partagez ce lien avec vos clients pour qu'ils puissent accéder à votre menu en ligne
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={`${process.env.NEXT_PUBLIC_BASE_URL}/${establishment.slug}`}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                className="gap-2 min-w-[140px]"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copié!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier le lien
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Vos clients pourront voir votre menu, consulter les produits et passer des commandes via ce lien.
            </p>
          </CardContent>
        </Card>
      )}

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
            La première image sera utilisée comme image de couverture principale.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
