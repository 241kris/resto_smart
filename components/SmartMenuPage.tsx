"use client"

import { useState } from "react"
import { Sparkles, Plus, Calendar, Tag, Star, Trash2, Edit, TrendingUp, MoreVertical, Power } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useProducts } from "@/lib/hooks/useProducts"
import {
  useDishesOfTheDay,
  useCreateDishOfTheDay,
  useDeleteDishOfTheDay,
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  useRecommendations,
  useCreateRecommendation,
  useUpdateRecommendation,
  useDeleteRecommendation,
} from "@/lib/hooks/useSmartMenu"
import Image from "next/image"

export default function SmartMenuPage() {
  const [activeTab, setActiveTab] = useState("dishes")

  // Dialogs
  const [dishDialog, setDishDialog] = useState(false)
  const [promoDialog, setPromoDialog] = useState(false)
  const [recoDialog, setRecoDialog] = useState(false)

  // Fetch products
  const { data: productsData } = useProducts()
  const products = productsData?.products || []

  // Dishes of the day
  const { data: dishesData } = useDishesOfTheDay()
  const dishes = dishesData?.dishesOfTheDay || []
  const createDish = useCreateDishOfTheDay()
  const deleteDish = useDeleteDishOfTheDay()

  // Promotions
  const { data: promosData } = usePromotions('all')
  const promotions = promosData?.promotions || []
  const createPromo = useCreatePromotion()
  const updatePromo = useUpdatePromotion()
  const deletePromo = useDeletePromotion()

  // Recommendations
  const { data: recosData } = useRecommendations()
  const recommendations = recosData?.recommendations || []
  const createReco = useCreateRecommendation()
  const updateReco = useUpdateRecommendation()
  const deleteReco = useDeleteRecommendation()

  // Form states
  const [dishForm, setDishForm] = useState({
    productId: "",
    date: new Date().toISOString().split('T')[0],
    specialDescription: ""
  })

  const [promoForm, setPromoForm] = useState({
    productId: "",
    name: "",
    discountedPrice: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    description: "",
    badge: ""
  })

  const [recoForm, setRecoForm] = useState({
    productId: "",
    type: "POPULAR",
    reason: "",
    score: "50",
    badge: ""
  })

  const handleCreateDish = async () => {
    if (!dishForm.productId) {
      toast.error("Veuillez sélectionner un produit")
      return
    }

    try {
      await createDish.mutateAsync(dishForm)
      toast.success("Plat du jour ajouté")
      setDishDialog(false)
      setDishForm({ productId: "", date: new Date().toISOString().split('T')[0], specialDescription: "" })
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteDish = async (id: string) => {
    try {
      await deleteDish.mutateAsync(id)
      toast.success("Plat du jour supprimé")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleCreatePromo = async () => {
    if (!promoForm.productId || !promoForm.name || !promoForm.discountedPrice) {
      toast.error("Veuillez remplir tous les champs requis")
      return
    }

    try {
      await createPromo.mutateAsync({
        ...promoForm,
        discountedPrice: parseFloat(promoForm.discountedPrice),
        badge: promoForm.badge || undefined,
        description: promoForm.description || undefined
      })
      toast.success("Promotion créée")
      setPromoDialog(false)
      setPromoForm({
        productId: "",
        name: "",
        discountedPrice: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        description: "",
        badge: ""
      })
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleTogglePromo = async (id: string, isActive: boolean) => {
    try {
      await updatePromo.mutateAsync({ id, data: { isActive: !isActive } })
      toast.success(isActive ? "Promotion désactivée" : "Promotion activée")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeletePromo = async (id: string) => {
    try {
      await deletePromo.mutateAsync(id)
      toast.success("Promotion supprimée")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleCreateReco = async () => {
    if (!recoForm.productId) {
      toast.error("Veuillez sélectionner un produit")
      return
    }

    try {
      await createReco.mutateAsync({
        ...recoForm,
        score: parseInt(recoForm.score),
        reason: recoForm.reason || undefined,
        badge: recoForm.badge || undefined
      })
      toast.success("Recommandation créée")
      setRecoDialog(false)
      setRecoForm({ productId: "", type: "POPULAR", reason: "", score: "50", badge: "" })
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleToggleReco = async (id: string, isActive: boolean) => {
    try {
      await updateReco.mutateAsync({ id, data: { isActive: !isActive } })
      toast.success(isActive ? "Recommandation désactivée" : "Recommandation activée")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteReco = async (id: string) => {
    try {
      await deleteReco.mutateAsync(id)
      toast.success("Recommandation supprimée")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-6 pb-20 px-4">
      {/* HEADER COMPACT */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          Menu Intelligent
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="dishes" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 mr-2" /> Plats du jour
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Tag className="h-4 w-4 mr-2" /> Promos
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Star className="h-4 w-4 mr-2" /> Recos
          </TabsTrigger>
        </TabsList>

        {/* CONTENT PLATS DU JOUR */}
        <TabsContent value="dishes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-muted-foreground">{dishes.length} actif(s)</span>
            <Button size="sm" onClick={() => setDishDialog(true)} className="rounded-full px-4 h-8 text-xs font-bold">
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dishes.map((dish) => (
              <Card key={dish.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900 rounded-xl overflow-hidden group">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0">
                    <Image src={dish.product.image || "/default-product.svg"} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm truncate pr-2">{dish.product.name}</h3>
                      <span className="text-xs font-bold text-primary whitespace-nowrap">{dish.product.price} F</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> {new Date(dish.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full" onClick={() => handleDeleteDish(dish.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CONTENT PROMOTIONS */}
        <TabsContent value="promotions" className="mt-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-muted-foreground">{promotions.length} active(s)</span>
            <Button size="sm" onClick={() => setPromoDialog(true)} className="rounded-full px-4 h-8 text-xs font-bold">
              <Plus className="h-3.5 w-3.5 mr-1" /> Créer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promotions.map((promo) => (
              <Card key={promo.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
                <CardContent className="p-4 flex gap-4">
                  <div className="relative h-20 w-20 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0">
                    <Image src={promo.product.image || "/default-product.svg"} alt="" fill className="object-cover" />
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                      -{promo.discountPercent?.toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm truncate">{promo.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{promo.product.name}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => handleTogglePromo(promo.id, promo.isActive)}>
                            <Power className="h-3 w-3 mr-2" /> {promo.isActive ? 'Désactiver' : 'Activer'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletePromo(promo.id)} className="text-rose-500">
                            <Trash2 className="h-3 w-3 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bold text-primary">{promo.discountedPrice} F</span>
                      <span className="text-xs text-muted-foreground line-through decoration-rose-500/50">{promo.product.price} F</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={promo.isActive ? "default" : "secondary"} className="h-5 text-[10px] px-1.5 rounded-md font-medium">
                        {promo.isActive ? "Actif" : "Inactif"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        Fin: {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CONTENT RECOMMENDATIONS */}
        <TabsContent value="recommendations" className="mt-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-muted-foreground">{recommendations.length} active(s)</span>
            <Button size="sm" onClick={() => setRecoDialog(true)} className="rounded-full px-4 h-8 text-xs font-bold">
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((reco) => (
              <Card key={reco.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-xl p-0 overflow-hidden">
                <div className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-md border-primary/20 text-primary bg-primary/5 uppercase tracking-wider">
                        {reco.type}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 ml-auto">
                        <TrendingUp className="h-3 w-3" /> {reco.score}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{reco.product.name}</h3>
                    {reco.reason && <p className="text-[10px] text-muted-foreground italic truncate mt-0.5">"{reco.reason}"</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleToggleReco(reco.id, reco.isActive)}>
                      <Power className={`h-3.5 w-3.5 ${reco.isActive ? 'text-emerald-500' : 'text-slate-300'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-500" onClick={() => handleDeleteReco(reco.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS LAYOUTS (kept same logic but consistent style) */}
      <Dialog open={dishDialog} onOpenChange={setDishDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nouveau plat du jour</DialogTitle>
            <DialogDescription className="text-xs">Mise en avant pour aujourd'hui</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Produit</Label>
              <Select value={dishForm.productId} onValueChange={(v) => setDishForm({ ...dishForm, productId: v })}>
                <SelectTrigger className="h-9 text-sm rounded-lg">
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" className="h-9 text-sm rounded-lg" value={dishForm.date} onChange={(e) => setDishForm({ ...dishForm, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note (Optionnel)</Label>
              <Input className="h-9 text-sm rounded-lg" placeholder="Ex: Servi avec accompagnement..." value={dishForm.specialDescription} onChange={(e) => setDishForm({ ...dishForm, specialDescription: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleCreateDish} className="w-full rounded-lg font-bold">Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={promoDialog} onOpenChange={setPromoDialog}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nouvelle promotion</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Produit</Label>
              <Select value={promoForm.productId} onValueChange={(v) => setPromoForm({ ...promoForm, productId: v })}>
                <SelectTrigger className="h-9 text-sm rounded-lg">
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">{p.name} ({p.price} F)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom Promo</Label>
                <Input className="h-9 text-sm rounded-lg" value={promoForm.name} onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} placeholder="Ex: Soldes" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prix Promo</Label>
                <Input type="number" className="h-9 text-sm rounded-lg font-bold text-primary" value={promoForm.discountedPrice} onChange={(e) => setPromoForm({ ...promoForm, discountedPrice: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Début</Label>
                <Input type="date" className="h-9 text-sm rounded-lg" value={promoForm.startDate} onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fin</Label>
                <Input type="date" className="h-9 text-sm rounded-lg" value={promoForm.endDate} onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleCreatePromo} className="w-full rounded-lg font-bold">Créer Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RECO DIALOG SIMPLIFIED */}
      <Dialog open={recoDialog} onOpenChange={setRecoDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Ajouter Recommandation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Produit Cible</Label>
              <Select value={recoForm.productId} onValueChange={(v) => setRecoForm({ ...recoForm, productId: v })}>
                <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id} className="text-sm">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={recoForm.type} onValueChange={(v) => setRecoForm({ ...recoForm, type: v })}>
                <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POPULAR">Populaire</SelectItem>
                  <SelectItem value="NEW">Nouveauté</SelectItem>
                  <SelectItem value="CHEF_CHOICE">Choix du Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Score IA (0-100)</Label>
                <Input type="number" className="h-9 text-sm rounded-lg" value={recoForm.score} onChange={(e) => setRecoForm({ ...recoForm, score: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Raison</Label>
                <Input className="h-9 text-sm rounded-lg" placeholder="Ex: Tendance" value={recoForm.reason} onChange={(e) => setRecoForm({ ...recoForm, reason: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleCreateReco} className="w-full rounded-lg font-bold">Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
