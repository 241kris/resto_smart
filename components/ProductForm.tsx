"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft, AlertCircle, Upload, X, Link2, FileImage,
  Check, Package, BadgeEuro, LayoutList, Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ProductFormProps {
  product?: Product | null
  onBack: () => void
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading: boolean
}

export function ProductForm({
  product,
  onBack,
  onSubmit,
  isLoading
}: ProductFormProps) {
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

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name ?? "",
        description: product.description ?? "",
        price: product.price ?? 0,
        categoryId: product.categoryId ?? "NONE",
        image: product.image ?? "",
        isQuantifiable: product.isQuantifiable ?? false,
        quantity: product.quantity ?? undefined
      })
      setImagePreview(product.image ?? "")
      if (product.image && !product.image.startsWith('data:')) {
        setImageMode("url")
        setImageUrl(product.image)
      } else {
        setImageMode("file")
        setImageUrl("")
      }
    }
  }, [product])

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormError("")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError("")
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setImageError("Format non supporté (JPEG, PNG, WEBP)")
        return
      }
      const maxSize = 3 * 1024 * 1024
      if (file.size > maxSize) {
        setImageError("L'image est trop lourde (Max 3 Mo)")
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

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImageError("")
    if (url.trim() && !url.startsWith('http')) {
      setImageError("L'URL doit être valide (http/https)")
      return
    }
    setImagePreview(url)
    setFormData(prev => ({ ...prev, image: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return setFormError("Le nom est obligatoire")
    try {
      const submitData = { ...formData, categoryId: formData.categoryId === "NONE" ? "" : formData.categoryId }
      await onSubmit(submitData)
    } catch (error) {
      setFormError((error as Error).message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* BARRE DE NAVIGATION */}
      <div className="flex items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-30 py-4 border-b dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" disabled={isLoading}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {product ? "MODIFIER LE PRODUIT" : "NOUVEAU PRODUIT"}
          </h1>
        </div>
        <div className="hidden sm:block">
          <BadgeEuro className="h-6 w-6 text-primary" />
        </div>
      </div>

      {formError && (
        <Alert variant="destructive" className="rounded-2xl border-none shadow-lg animate-shake">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-bold">{formError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* COLONNE GAUCHE : IMAGE */}
        <div className="md:col-span-4 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileImage className="h-4 w-4" /> Visuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center group">
                {imagePreview ? (
                  <>
                    <Image src={imagePreview} alt="Preview" fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(""); setFormData(p => ({ ...p, image: "" })); setImageUrl("") }}
                      className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <Upload className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Aucune image</p>
                  </div>
                )}
              </div>

              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setImageMode("file")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${imageMode === 'file' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
                >
                  Fichier
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${imageMode === 'url' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
                >
                  URL
                </button>
              </div>

              {imageMode === "file" ? (
                <Input key="image-file" type="file" accept="image/*" onChange={handleImageChange} className="rounded-xl text-xs" disabled={isLoading} />
              ) : (
                <Input key="image-url" placeholder="Lien de l'image..." value={imageUrl} onChange={(e) => handleImageUrlChange(e.target.value)} className="rounded-xl text-xs" disabled={isLoading} />
              )}

              {imageError && <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {imageError}</p>}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE : DETAILS */}
        <div className="md:col-span-8 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" /> Détails du produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold ml-1">Nom de l'article *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Burger Gourmet"
                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold ml-1">Catégorie</Label>
                  <Select value={formData.categoryId} onValueChange={(v) => handleInputChange("categoryId", v)}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="NONE" className="rounded-xl">Sans catégorie</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-xl">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold ml-1">Prix de vente (FCFA) *</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">CFA</div>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    className="h-12 pl-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none text-lg font-bold"
                  />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-black flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" /> Gérer le stock
                    </Label>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Activer le suivi des quantités</p>
                  </div>
                  <Checkbox
                    id="isQuantifiable"
                    checked={formData.isQuantifiable}
                    onCheckedChange={(c) => setFormData(p => ({ ...p, isQuantifiable: c as boolean }))}
                    className="h-6 w-6 rounded-lg border-2"
                  />
                </div>

                {formData.isQuantifiable && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs font-bold">Quantité initiale disponible</Label>
                    <Input
                      type="number"
                      value={formData.quantity ?? ""}
                      onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
                      placeholder="Ex: 50"
                      className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold ml-1 flex items-center gap-2">
                  <LayoutList className="h-4 w-4" /> Description courte
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Ingrédients, allergènes ou histoire du produit..."
                  className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-transform active:scale-95"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2"><Check className="h-5 w-5" /> {product ? "METTRE À JOUR" : "CRÉER LE PRODUIT"}</span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-14 px-8 rounded-2xl font-bold text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}