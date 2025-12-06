"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Search, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import ProductFormModal from "@/components/ProductFormModal"
import ConfirmDialog from "@/components/ConfirmDialog"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product
} from "@/lib/hooks/useProducts"
import Image from "next/image"

export default function ProductsPage() {
  const { data, isLoading, error } = useProducts()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  const products = data?.products || []

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Créer un produit
  const handleCreateProduct = async (formData: any) => {
    await createMutation.mutateAsync(formData)
    setIsFormOpen(false)
  }

  // Modifier un produit
  const handleUpdateProduct = async (formData: any) => {
    if (!editingProduct) return
    await updateMutation.mutateAsync({
      id: editingProduct.id,
      data: formData
    })
    setEditingProduct(null)
  }

  // Supprimer un produit
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return
    await deleteMutation.mutateAsync(deletingProduct.id)
    setDeletingProduct(null)
  }

  // Ouvrir la modal de création
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  // Ouvrir la modal de modification
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
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
              <p>Erreur lors du chargement des produits</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Gérez vos plats et boissons
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Nouveau produit
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{products.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">
              {searchTerm ? "Aucun produit trouvé" : "Aucun produit pour le moment"}
            </p>
            {!searchTerm && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                Cliquez sur "Nouveau produit" pour commencer
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-48 w-full bg-[hsl(var(--muted))]">
                <Image
                  src={product.image || "/default-product.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {product.description || "Aucune description"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {product.category && (
                    <Badge variant="secondary">{product.category.name}</Badge>
                  )}
                  <span className="text-sm font-bold text-[hsl(var(--primary))]">
                    {product.price.toFixed(2)} FCFA
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(product)}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDeletingProduct(product)}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingProduct(null)
        }}
        product={editingProduct}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        isLoading={editingProduct ? updateMutation.isPending : createMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Supprimer le produit"
        description={`Êtes-vous sûr de vouloir supprimer "${deletingProduct?.name}" ? Cette action ne peut pas être annulée.`}
        onConfirm={handleDeleteProduct}
        isLoading={deleteMutation.isPending}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  )
}
