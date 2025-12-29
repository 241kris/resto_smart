"use client"

import { useState } from "react"
import { Package, AlertCircle } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCreateRestock } from "@/lib/hooks/useRestock"
import type { Product } from "@/lib/hooks/useProducts"
import { toast } from "sonner"

interface RestockDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export default function RestockDrawer({
  open,
  onOpenChange,
  product
}: RestockDrawerProps) {
  const [quantity, setQuantity] = useState<number>(0)
  const [error, setError] = useState<string>("")

  const createRestockMutation = useCreateRestock()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!product) {
      setError("Aucun produit sélectionné")
      return
    }

    if (quantity <= 0) {
      setError("La quantité doit être supérieure à 0")
      return
    }

    try {
      await createRestockMutation.mutateAsync({
        productId: product.id,
        quantity
      })

      toast.success(`Ravitaillement de ${quantity} unité(s) effectué avec succès`)
      setQuantity(0)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du ravitaillement")
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setQuantity(0)
      setError("")
    }
    onOpenChange(open)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ravitailler le stock
            </DrawerTitle>
            <DrawerDescription>
              {product && (
                <>
                  <span className="font-medium">{product.name}</span>
                  <br />
                  <span className="text-sm">
                    Stock actuel: {product.quantity ?? 0} unité(s)
                  </span>
                </>
              )}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité à ajouter *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Ex: 50"
                disabled={createRestockMutation.isPending}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Entrez le nombre d'unités à ajouter au stock
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createRestockMutation.isPending || quantity <= 0}
              >
                {createRestockMutation.isPending ? "Ravitaillement..." : "Confirmer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={createRestockMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
