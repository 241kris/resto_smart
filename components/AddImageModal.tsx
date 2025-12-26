"use client"

import { useState } from "react"
import { AlertCircle, Upload, Link2, FileImage } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface AddImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (image: string) => void
  currentCount: number
  maxImages?: number
}

export function AddImageModal({
  open,
  onOpenChange,
  onAdd,
  currentCount,
  maxImages = 7
}: AddImageModalProps) {
  const [imageMode, setImageMode] = useState<"file" | "url">("file")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [imageError, setImageError] = useState("")

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError("")

    if (!file) return

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
    }
    reader.readAsDataURL(file)
  }

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImageError("")

    // Si l'URL est vide, réinitialiser la preview
    if (!url.trim()) {
      setImagePreview("")
      return
    }

    // Vérifier si l'URL semble valide
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setImageError("L'URL doit commencer par http:// ou https://")
      setImagePreview("")
      return
    }

    // Mettre à jour la preview
    setImagePreview(url)
  }

  const handleAdd = () => {
    if (!imagePreview) {
      setImageError("Veuillez sélectionner une image ou entrer une URL")
      return
    }

    onAdd(imagePreview)
    handleClose()
  }

  const handleClose = () => {
    setImageMode("file")
    setImageUrl("")
    setImagePreview("")
    setImageError("")
    onOpenChange(false)
  }

  const handleModeChange = (mode: "file" | "url") => {
    setImageMode(mode)
    setImageUrl("")
    setImagePreview("")
    setImageError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une image</DialogTitle>
          <DialogDescription>
            Vous pouvez ajouter jusqu'à {maxImages} images ({currentCount}/{maxImages} utilisées)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Erreur */}
          {imageError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{imageError}</AlertDescription>
            </Alert>
          )}

          {/* Mode selector */}
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => handleModeChange("file")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                imageMode === "file"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileImage className="h-4 w-4" />
              Fichier
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("url")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                imageMode === "url"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link2 className="h-4 w-4" />
              URL
            </button>
          </div>

          {/* Preview */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {imagePreview ? (
              imagePreview.startsWith('data:') || imagePreview.startsWith('/') ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              )
            ) : (
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucune image sélectionnée</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
            {imageMode === "file" ? (
              <>
                <Label htmlFor="image-file">Sélectionner un fichier</Label>
                <Input
                  key="file-input"
                  id="image-file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  JPEG, JPG, PNG, GIF, WEBP - Max: 3 Mo
                </p>
              </>
            ) : (
              <>
                <Label htmlFor="image-url">URL de l'image</Label>
                <Input
                  key="url-input"
                  id="image-url"
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Entrez l'URL complète de l'image (doit commencer par http:// ou https://)
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAdd} className="flex-1" disabled={!imagePreview}>
              Ajouter l'image
            </Button>
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
