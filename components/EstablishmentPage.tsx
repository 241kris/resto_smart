"use client"

import { useState, useEffect } from "react"
import { 
  Store, Mail, Phone, MapPin, Upload, Pencil, AlertCircle, 
  X, Plus, FileText, Share2, Copy, Check, Info, LayoutDashboard
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useEstablishment, useCreateOrUpdateEstablishment, type EstablishmentFormData } from "@/lib/hooks/useEstablishment"
import { useAuth } from "@/lib/AuthContext"
import { AddImageModal } from "@/components/AddImageModal"
import Image from "next/image"

export default function EstablishmentPage() {
  const { data, isLoading, error } = useEstablishment()
  const createOrUpdateMutation = useCreateOrUpdateEstablishment()
  const { checkSession } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<EstablishmentFormData>({
    name: "", description: "", email: "", phones: [""], images: [], address: ""
  })
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)

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
      setIsEditing(true)
    }
  }, [data])

  const handleInputChange = (field: keyof EstablishmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
      setFormData(prev => ({ ...prev, phones: formData.phones.filter((_, i) => i !== index) }))
    }
  }

  const handleAddImage = (image: string) => {
    setImageError("")
    if (formData.images.length >= 7) {
      setImageError("Maximum 7 images autorisées")
      return
    }
    setImagePreviews(prev => [...prev, image])
    setFormData(prev => ({ ...prev, images: [...prev.images, image] }))
  }

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    try {
      const validPhones = formData.phones.filter(phone => phone.trim() !== "")
      if (validPhones.length === 0) {
        setImageError("Au moins un numéro de téléphone est requis")
        return
      }
      await createOrUpdateMutation.mutateAsync({ ...formData, phones: validPhones })
      await checkSession()
      setIsEditing(false)
    } catch (e) { console.error(e) }
  }

  const handleCopyLink = () => {
    if (data?.establishment?.slug) {
      const menuUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${data.establishment.slug}`
      navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-muted-foreground font-medium">Chargement de votre établissement...</p>
    </div>
  )

  const establishment = data?.establishment

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Store className="h-10 w-10 text-primary" />
            MON ÉTABLISSEMENT
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {establishment ? "Identité et visibilité de votre restaurant" : "Configurez votre premier établissement"}
          </p>
        </div>
        {establishment && !isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="rounded-2xl h-12 px-6 gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 font-bold shadow-xl"
          >
            <Pencil className="h-4 w-4" />
            Modifier le profil
          </Button>
        )}
      </div>

      {/* ERROR DISPLAY */}
      {(createOrUpdateMutation.isError || imageError) && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">{imageError || "Une erreur est survenue lors de la sauvegarde"}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: IMAGES & LINK */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Galerie ({imagePreviews.length}/7)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border dark:border-slate-800">
                    <Image src={preview} alt="Restaurant" fill className="object-cover" unoptimized />
                    {isEditing && (
                      <button onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {index === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[9px] font-black uppercase py-1 text-center">Principal</div>
                    )}
                  </div>
                ))}
                {isEditing && imagePreviews.length < 7 && (
                  <button onClick={() => setImageModalOpen(true)} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground group">
                    <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold">Ajouter</span>
                  </button>
                )}
              </div>
              {imagePreviews.length === 0 && !isEditing && (
                <div className="py-10 text-center border-2 border-dashed rounded-2xl">
                  <Upload className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-muted-foreground">Aucune image</p>
                </div>
              )}
            </CardContent>
          </Card>

          {establishment?.slug && (
            <Card className="rounded-[2.5rem] border-none bg-primary/5 dark:bg-primary/10 border border-primary/10">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary text-white rounded-xl">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Menu Digital</h3>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={`${process.env.NEXT_PUBLIC_BASE_URL}/${establishment.slug}`} 
                    readOnly 
                    className="h-10 rounded-xl bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                  <Button size="icon" onClick={handleCopyLink} variant={copied ? "default" : "outline"} className="rounded-xl shrink-0">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: FORM & INFO */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-black italic">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                INFOS GÉNÉRALES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* NAME */}
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Nom officiel *</Label>
                {isEditing ? (
                  <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Ex: L'Atelier Gourmand" className="h-12 rounded-xl focus-visible:ring-primary" />
                ) : (
                  <p className="text-2xl font-bold dark:text-white">{establishment?.name || "Non défini"}</p>
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Description / Histoire</Label>
                {isEditing ? (
                  <Textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={4} className="rounded-xl focus-visible:ring-primary" />
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{establishment?.description || "Aucune description"}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* EMAIL */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email de contact</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="pl-10 h-12 rounded-xl" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                      <Mail className="h-4 w-4 text-primary" /> {establishment?.email || "-"}
                    </div>
                  )}
                </div>

                {/* PHONES */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Téléphones (Max 3)</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {formData.phones.map((phone, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input type="tel" value={phone} onChange={(e) => handlePhoneChange(idx, e.target.value)} className="h-12 rounded-xl" />
                          {formData.phones.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removePhone(idx)}><X className="h-4 w-4" /></Button>
                          )}
                        </div>
                      ))}
                      {formData.phones.length < 3 && (
                        <Button type="button" variant="outline" size="sm" onClick={addPhone} className="rounded-xl font-bold border-dashed"><Plus className="mr-2 h-3 w-3" /> Ajouter un numéro</Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {establishment?.phones.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                          <Phone className="h-4 w-4 text-primary" /> {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ADDRESS */}
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Adresse complète *</Label>
                {isEditing ? (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Textarea value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} className="pl-10 rounded-xl" rows={2} />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <MapPin className="h-5 w-5 text-primary shrink-0" /> {establishment?.address as string || "-"}
                  </div>
                )}
              </div>

              {/* SAVE ACTIONS */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button 
                    onClick={handleSave} 
                    className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-primary/20"
                    disabled={createOrUpdateMutation.isPending || !formData.name || !formData.address}
                  >
                    {createOrUpdateMutation.isPending ? "ENREGISTREMENT..." : "SAUVEGARDER LES MODIFICATIONS"}
                  </Button>
                  {establishment && (
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-xl h-12 font-bold px-8">Annuler</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FOOTER INFO */}
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-3xl p-6 border border-dashed border-slate-300 dark:border-slate-700 flex gap-4 items-start">
            <Info className="h-6 w-6 text-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">À savoir</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ces informations sont publiques et seront affichées sur votre menu digital. Veillez à utiliser des photos de haute qualité (3Mo max) pour attirer vos clients.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AddImageModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        onAdd={handleAddImage}
        currentCount={imagePreviews.length}
        maxImages={7}
      />
    </div>
  )
}