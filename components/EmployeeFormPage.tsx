"use client"

import { useState, useRef } from "react"
import { 
  ArrowLeft, Upload, X, User, Phone, Mail, MapPin, 
  IdCard, Briefcase, Building2, Calendar, ShieldCheck, Check
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const isLoading = createMutation.isPending || updateMutation.isPending

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setAvatarPreview(base64)
      setFormData(prev => ({ ...prev, avatar: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: employee.id, data: formData })
        toast.success('Employé mis à jour')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Employé créé')
      }
      onBack()
    } catch (error: any) {
      toast.error(error.message || 'Erreur')
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* HEADER FIXE MOBILE / SIMPLE DESKTOP */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" onClick={onBack} className="rounded-full shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
              {isEditing ? "Édition Profil" : "Nouvelle Recrue"}
            </h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">RestoSmart Team Management</p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="px-8 shadow-lg shadow-primary/20">
            {isLoading ? "Envoi..." : isEditing ? "Sauvegarder" : "Confirmer"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLONNE GAUCHE : AVATAR & STATUT */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="pt-8 flex flex-col items-center">
              <div className="relative group">
                <div className="h-32 w-32 rounded-3xl bg-background border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                {avatarPreview && (
                  <Button 
                    type="button" variant="destructive" size="icon" 
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg"
                    onClick={() => { setAvatarPreview(null); setFormData(p => ({...p, avatar: ""})) }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button 
                  type="button" variant="secondary" size="sm" 
                  className="mt-4 w-full rounded-xl font-bold text-[10px] uppercase tracking-widest"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Changer la photo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-primary">Disponibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                <SelectTrigger className="bg-background border-none shadow-none h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">En service</SelectItem>
                  <SelectItem value="INACTIVE">En congé / Inactif</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE : FORMULAIRE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* IDENTITÉ */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Identité & État Civil
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs ml-1">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input className="pl-10 bg-muted/20 border-none h-11 focus-visible:ring-primary" placeholder="Jean" value={formData.firstName} onChange={e => handleInputChange("firstName", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs ml-1">Nom de famille</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input className="pl-10 bg-muted/20 border-none h-11 focus-visible:ring-primary" placeholder="Dupont" value={formData.lastName} onChange={e => handleInputChange("lastName", e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs ml-1">Date de Naissance</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input type="date" className="pl-10 bg-muted/20 border-none h-11" value={formData.dateOfBirth} onChange={e => handleInputChange("dateOfBirth", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs ml-1">Genre</Label>
                  <Select value={formData.gender} onValueChange={v => handleInputChange("gender", v)}>
                    <SelectTrigger className="bg-muted/20 border-none h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Homme</SelectItem>
                      <SelectItem value="FEMALE">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CONTACT */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs ml-1">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input className="pl-10 bg-muted/20 border-none h-11" placeholder="+241 ..." value={formData.phone} onChange={e => handleInputChange("phone", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs ml-1">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input type="email" className="pl-10 bg-muted/20 border-none h-11" placeholder="email@resto.com" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs ml-1">Adresse de résidence</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input className="pl-10 bg-muted/20 border-none h-11" placeholder="Quartier, Ville..." value={formData.address} onChange={e => handleInputChange("address", e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PROFESSIONNEL */}
          <Card className="border-none shadow-sm bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Contrat & Poste
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Poste occupé</Label>
                  <Select value={formData.position} onValueChange={v => handleInputChange("position", v)}>
                    <SelectTrigger className="bg-white/10 border-none h-11 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAITER">Serveur</SelectItem>
                      <SelectItem value="COOK">Cuisinier</SelectItem>
                      <SelectItem value="CASHIER">Caissier</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Département</Label>
                  <Select value={formData.department} onValueChange={v => handleInputChange("department", v)}>
                    <SelectTrigger className="bg-white/10 border-none h-11 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DINING_ROOM">Salle</SelectItem>
                      <SelectItem value="KITCHEN">Cuisine</SelectItem>
                      <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Date d'embauche</Label>
                  <Input type="date" className="bg-white/10 border-none h-11 text-white invert-0" value={formData.hireDate} onChange={e => handleInputChange("hireDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Type de contrat</Label>
                  <Select value={formData.contractType} onValueChange={v => handleInputChange("contractType", v)}>
                    <SelectTrigger className="bg-white/10 border-none h-11 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="DAILY_EXTRA">Journalier (Extra)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOUTON MOBILE SEULEMENT */}
          <div className="md:hidden pt-4">
             <Button onClick={handleSubmit} disabled={isLoading} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/30">
                {isLoading ? "Envoi..." : isEditing ? "Mettre à jour" : "Créer l'employé"}
             </Button>
          </div>
        </div>
      </form>
    </div>
  )
}