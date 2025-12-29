"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Upload, X, Link2, FileImage } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCategories } from "@/lib/hooks/useCategories"
import type { Product, ProductFormData } from "@/lib/hooks/useProducts"
import Image from "next/image"

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading: boolean
}

export default function ProductFormModal({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading
}: ProductFormModalProps) {
  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.categories || []

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    categoryId: "NONE",
    image: "",
    isQuantifiable: false,
    quantity: undefined
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageError, setImageError] = useState<string>("")
  const [formError, setFormError] = useState<string>("")
  const [imageMode, setImageMode] = useState<"file" | "url">("file")
  const [imageUrl, setImageUrl] = useState<string>("")

  // Initialiser le formulaire
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        categoryId: product.categoryId || "NONE",
        image: product.image || "",
        isQuantifiable: product.isQuantifiable || false,
        quantity: product.quantity ?? undefined
      })
      setImagePreview(product.image || "")
      // Détecter si c'est une URL ou un fichier base64
      if (product.image && !product.image.startsWith('data:')) {
        setImageMode("url")
        setImageUrl(product.image)
      } else {
        setImageMode("file")
        setImageUrl("")
      }
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        categoryId: "NONE",
        image: "",
        isQuantifiable: false,
        quantity: undefined
      })
      setImagePreview("")
      setImageMode("file")
      setImageUrl("")
    }
    setImageError("")
    setFormError("")
  }, [product, open])

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormError("")
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
      const maxSize = 3 * 1024 * 1024
      if (file.size > maxSize) {
        setImageError("L'image ne doit pas dépasser 3 Mo")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setFormData(prev => ({ ...prev, image: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview("")
    setFormData(prev => ({ ...prev, image: "" }))
    setImageUrl("")
  }

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImageError("")

    // Vérifier si l'URL semble valide (commence par http:// ou https://)
    if (url.trim() && !url.startsWith('http://') && !url.startsWith('https://')) {
      setImageError("L'URL doit commencer par http:// ou https://")
      setImagePreview("")
      setFormData(prev => ({ ...prev, image: "" }))
      return
    }

    // Mettre à jour la preview et le formData
    setImagePreview(url)
    setFormData(prev => ({ ...prev, image: url }))
  }

  const handleImageModeChange = (mode: "file" | "url") => {
    setImageMode(mode)
    setImageError("")
    setImagePreview("")
    setFormData(prev => ({ ...prev, image: "" }))
    setImageUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    // Validation
    if (!formData.name.trim()) {
      setFormError("Le nom du produit est requis")
      return
    }

    if (formData.price < 0) {
      setFormError("Le prix doit être un nombre positif")
      return
    }

    try {
      // Convertir "NONE" en chaîne vide pour le backend
      const submitData = {
        ...formData,
        categoryId: formData.categoryId === "NONE" ? "" : formData.categoryId
      }
      await onSubmit(submitData)
    } catch (error) {
      setFormError((error as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          <DialogDescription>
            {product ? "Modifiez les informations du produit" : "Ajoutez un nouveau produit à votre menu"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erreur globale */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Image */}
          <div className="space-y-3">
            <Label>Image du produit (optionnelle)</Label>

            {/* Mode selector */}
            <div className="flex gap-2 border-b">
              <button
                type="button"
                onClick={() => handleImageModeChange("file")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  imageMode === "file"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                disabled={isLoading}
              >
                <FileImage className="h-4 w-4" />
                Fichier
              </button>
              <button
                type="button"
                onClick={() => handleImageModeChange("url")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  imageMode === "url"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                disabled={isLoading}
              >
                <Link2 className="h-4 w-4" />
                URL
              </button>
            </div>

            <div className="flex gap-4 items-start">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-[hsl(var(--muted))] flex-shrink-0">
                {imagePreview ? (
                  <>
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Upload className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                {imageMode === "file" ? (
                  <>
                    <Input
                      key="file-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      JPEG, JPG, PNG, GIF, WEBP - Max: 3 Mo
                    </p>
                  </>
                ) : (
                  <>
                    <Input
                      key="url-input"
                      type="url"
                      placeholder="https://exemple.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Entrez l'URL complète de l'image (doit commencer par http:// ou https://)
                    </p>
                  </>
                )}

                {imageError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{imageError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nom et Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Pizza Margherita"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleInputChange("categoryId", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sans catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sans catégorie</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prix et (espace vide pour alignement) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (FCFA) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
                disabled={isLoading}
              />
            </div>
            <div></div>
          </div>

          {/* Gestion du stock */}
          <div className="space-y-4 pt-2 pb-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isQuantifiable"
                checked={formData.isQuantifiable}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    isQuantifiable: checked as boolean,
                    quantity: checked ? prev.quantity : undefined
                  }))
                }}
                disabled={isLoading}
              />
              <Label htmlFor="isQuantifiable" className="cursor-pointer">
                Ce produit a un stock quantifiable
              </Label>
            </div>

            {formData.isQuantifiable && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="quantity">Quantité en stock initiale</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity ?? ""}
                  onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
                  placeholder="Ex: 100"
                  disabled={isLoading}
                />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Laissez vide si vous ne souhaitez pas définir une quantité initiale
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Décrivez votre produit..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.name.trim() || formData.price < 0}
            >
              {isLoading ? "Enregistrement..." : product ? "Modifier" : "Créer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
