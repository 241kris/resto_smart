"use client"

import { useState } from "react"
import {
  Plus, Pencil, Trash2, Search,  ShoppingCart,
  X, MoreVertical, Package, Power, 
  ArrowRight,   Layers 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductForm } from "@/components/ProductForm"
import ConfirmDialog from "@/components/ConfirmDialog"
import ManualOrderCart from "@/components/ManualOrderCart"
import RestockDrawer from "@/components/RestockDrawer"
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator"
import { ManualOrderCartProvider, useManualOrderCart } from "@/contexts/ManualOrderCartContext"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateProductStatus,
  type Product
} from "@/lib/hooks/useProducts"
import { useEstablishment } from "@/lib/hooks/useEstablishment"
import { useCategories } from "@/lib/hooks/useCategories"
import { useOfflineSync } from "@/lib/hooks/useOfflineSync"
import Image from "next/image"
import { toast } from "sonner"
import { useEffect } from "react"

function ProductsPageContent() {
  const { data  } = useProducts()
  const { data: categoriesData } = useCategories()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()
  const updateStatusMutation = useUpdateProductStatus()
  const { data: establishmentData } = useEstablishment()
  const { addToCart, removeFromCart, clearCart, isInCart, totalItems } = useManualOrderCart()
  const { isOnline, cacheProducts, cachedProducts } = useOfflineSync()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null)

  // Caching products when online
  useEffect(() => {
    if (isOnline && data?.products) {
      cacheProducts(data.products)
    }
  }, [isOnline, data?.products, cacheProducts])

  const products = isOnline ? (data?.products || []) : (cachedProducts as Product[])
  const categories = categoriesData?.categories || []

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId
    return matchesSearch && matchesCategory
  })

  if (viewMode === 'form') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <ProductForm
          product={editingProduct}
          onBack={() => setViewMode('list')}
          onSubmit={editingProduct ? (d) => updateMutation.mutateAsync({ id: editingProduct.id, data: d }).then(() => setViewMode('list')) : (d) => createMutation.mutateAsync(d).then(() => setViewMode('list'))}
          isLoading={editingProduct ? updateMutation.isPending : createMutation.isPending}
        />
      </div>
    )
  }

  if (checkoutOpen && establishmentData?.establishment) {
    return (
      <div className="animate-in slide-in-from-right duration-500 inset-0 fixed z-[100] bg-background">
        <ManualOrderCart
          restaurantId={establishmentData.establishment.id}
          onBack={() => setCheckoutOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-32">

      {/* HEADER SECTION - Glassmorphism style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
         
        <div className="flex items-center gap-3">
          <OnlineStatusIndicator />
        
        
          {isOnline && (
            <Button
              className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 font-bold bg-primary hover:scale-105 transition-transform"
              onClick={() => { setEditingProduct(null); setViewMode('form') }}
            >
              <Plus className="h-5 w-5 mr-2" /> Ajouter un produit
            </Button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-4 rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Rechercher un plat, une boisson..."
                className="h-12 pl-12 rounded-2xl border-none bg-slate-50 dark:bg-slate-800 focus-visible:ring-primary font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-8 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Button
            variant={selectedCategoryId === null ? "default" : "secondary"}
            className={`rounded-2xl h-12 px-6 font-bold transition-all ${selectedCategoryId === null ? 'shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-900'}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            Tous
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? "default" : "secondary"}
              className={`rounded-2xl h-12 px-6 font-bold whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? 'shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-900'}`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Layers className="h-16 w-16 mb-4 opacity-20" />
          <p className="font-bold">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5">
          {filteredProducts.map((product) => {
            const inCart = isInCart(product.id);
            const isOutOfStock = product.isQuantifiable && (product.quantity ?? 0) <= 0;

            return (
              <div
                key={product.id}
                className="group relative"
                onClick={() => {
                  if (isOutOfStock) return toast.error("Stock épuisé");
                  if (inCart) {
                    removeFromCart(product.id);
                  } else {
                    addToCart(product);
                  }
                }}
              >
                <Card className={`
                  relative h-full rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden
                  ${inCart ? 'ring-2 ring-primary bg-primary/5 scale-[0.98]' : 'bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1'}
                `}>
                  {/* Stock Badge */}
                  {product.isQuantifiable && (
                    <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${isOutOfStock ? 'bg-rose-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md'}`}>
                      {isOutOfStock ? 'Rupture' : `Stock: ${product.quantity}`}
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute top-3 right-3 z-20" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl w-48">
                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: product.id, status: !product.status })} className="rounded-xl font-bold">
                          <Power className="mr-2 h-4 w-4 text-orange-500" /> {product.status ? 'Désactiver' : 'Activer'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingProduct(product); setViewMode('form') }} className="rounded-xl font-bold">
                          <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeletingProduct(product)} className="rounded-xl font-bold text-rose-500 focus:text-rose-500">
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                        {product.isQuantifiable && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setRestockingProduct(product)}
                              className="rounded-xl font-bold text-emerald-600 focus:text-emerald-600"
                            >
                              <Package className="mr-2 h-4 w-4" /> Ravitailler
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardContent className="p-0">
                    {/* Image Area - Use cached image if available */}
                    <div className="h-32 flex items-center justify-center p-4 relative bg-slate-50 dark:bg-slate-800/50">
                      <Image
                        src={(product as any).cachedImage || product.image || "/default-product.svg"}
                        alt={product.name}
                        width={80}
                        height={80}
                        className={`object-contain transition-transform duration-500 group-hover:scale-110 ${!product.status && 'grayscale opacity-50'}`}
                        unoptimized={(product as any).cachedImage?.startsWith('data:')}
                      />
                    </div>

                    {/* Content Area */}
                    <div className="p-4 space-y-1 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {categories.find(c => c.id === product.categoryId)?.name || 'Produit'}
                      </p>
                      <h3 className="font-black text-slate-800 dark:text-white leading-tight line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="pt-2">
                        <span className=" text-green-500 font-bold text-lg">
                          {product.price.toLocaleString()} <small className="text-[10px] opacity-60">CFA</small>
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  {/* Selected Indicator */}
                  {inCart && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-primary text-white p-2 rounded-full shadow-lg scale-125">
                        <Plus className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* FLOATING CART BUTTON - Redesigned */}
      {totalItems > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-500">
          <Button
            variant="destructive"
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl border-4 border-background shrink-0"
            onClick={() => {
              clearCart();
              toast.success("Panier vidé");
            }}
            title="Vider le panier"
          >
            <Trash2 className="h-6 w-6" />
          </Button>

          <Button
            onClick={() => setCheckoutOpen(true)}
            className="h-16 px-8 rounded-full shadow-2xl shadow-primary/40 bg-slate-900 dark:bg-primary hover:scale-105 transition-all group border-4 border-background"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900 dark:border-primary">
                  {totalItems}
                </span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <span className="font-black tracking-tight text-lg">ENCAISSER</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl bg-white dark:bg-slate-900 border-4 border-background shrink-0 font-bold"
            onClick={() => {
              clearCart();
              toast.info("Commande annulée");
            }}
            title="Annuler la commande"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* DIALOGS */}
      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Supprimer ?"
        description="Cette action est irréversible pour ce produit."
        onConfirm={async () => {
          if (deletingProduct) await deleteMutation.mutateAsync(deletingProduct.id)
          setDeletingProduct(null)
        }}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />

      <RestockDrawer
        open={!!restockingProduct}
        onOpenChange={(open) => !open && setRestockingProduct(null)}
        product={restockingProduct}
      />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <ManualOrderCartProvider>
      <ProductsPageContent />
    </ManualOrderCartProvider>
  )
}