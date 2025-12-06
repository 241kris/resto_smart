"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, FolderOpen, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ConfirmDialog from "@/components/ConfirmDialog"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category
} from "@/lib/hooks/useCategories"

export default function CategoriesPage() {
  const { data, isLoading, error } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [createError, setCreateError] = useState("")

  const categories = data?.categories || []

  // Créer une catégorie
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCreateError("Le nom de la catégorie est requis")
      return
    }

    setCreateError("")
    try {
      await createMutation.mutateAsync({ name: newCategoryName })
      setNewCategoryName("")
    } catch (error) {
      setCreateError((error as Error).message)
    }
  }

  // Ouvrir le dialogue de modification
  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
  }

  // Mettre à jour une catégorie
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        data: { name: editCategoryName }
      })
      setEditingCategory(null)
      setEditCategoryName("")
    } catch (error) {
      console.error('Erreur mise à jour:', error)
    }
  }

  // Supprimer une catégorie
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      await deleteMutation.mutateAsync(deletingCategory.id)
      setDeletingCategory(null)
    } catch (error) {
      console.error('Erreur suppression:', error)
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
              <p>Erreur lors du chargement des catégories</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Organisez vos produits par catégorie
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
            <FolderOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        {/* Add Category Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-4">
                <Input
                  placeholder="Nom de la catégorie"
                  className="flex-1"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value)
                    setCreateError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCategory()
                    }
                  }}
                  disabled={createMutation.isPending}
                />
                <Button
                  className="gap-2"
                  onClick={handleCreateCategory}
                  disabled={createMutation.isPending || !newCategoryName.trim()}
                >
                  <Plus className="h-4 w-4" />
                  {createMutation.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
              {(createError || createMutation.isError) && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <p>{createError || (createMutation.error as Error)?.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
              <p className="text-[hsl(var(--muted-foreground))]">
                Aucune catégorie pour le moment
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                Créez votre première catégorie ci-dessus
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Nombre de produits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                          <FolderOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[hsl(var(--muted-foreground))]">
                        {category._count.products} produit{category._count.products !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(category)}
                          disabled={updateMutation.isPending || deleteMutation.isPending}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => setDeletingCategory(category)}
                          disabled={updateMutation.isPending || deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez le nom de la catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de la catégorie</Label>
              <Input
                id="edit-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateCategory()
                  }
                }}
                placeholder="Nom de la catégorie"
                disabled={updateMutation.isPending}
              />
            </div>
            {updateMutation.isError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{(updateMutation.error as Error)?.message}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingCategory(null)}
              disabled={updateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateMutation.isPending || !editCategoryName.trim()}
            >
              {updateMutation.isPending ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Supprimer la catégorie"
        description={`Êtes-vous sûr de vouloir supprimer la catégorie "${deletingCategory?.name}" ? ${
          deletingCategory?._count.products
            ? `Cette catégorie contient ${deletingCategory._count.products} produit${deletingCategory._count.products !== 1 ? 's' : ''}. Les produits ne seront pas supprimés mais n'auront plus de catégorie.`
            : 'Cette action ne peut pas être annulée.'
        }`}
        onConfirm={handleDeleteCategory}
        isLoading={deleteMutation.isPending}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  )
}
