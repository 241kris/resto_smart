"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Minus, Plus, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateManualOrder } from "@/lib/hooks/useOrders"
import { useTables } from "@/lib/hooks/useTables"
import { toast } from "sonner"
import Image from "next/image"
import { type Product } from "@/lib/hooks/useProducts"

interface CreateManualOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  restaurantId: string
}

export default function CreateManualOrderModal({
  open,
  onOpenChange,
  product,
  restaurantId,
}: CreateManualOrderModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<'completed' | 'PAID'>('completed')

  const createOrderMutation = useCreateManualOrder()
  const { data: tablesData } = useTables(restaurantId)
  const tables = tablesData?.tables || []

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setQuantity(1)
      setSelectedTableId(undefined)
      setStatus('completed')
    }
  }, [open])

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleIncrement = () => {
    setQuantity(quantity + 1)
  }

  const totalAmount = product.price * quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createOrderMutation.mutateAsync({
        items: [
          {
            productId: product.id,
            quantity,
            price: product.price,
          }
        ],
        tableId: selectedTableId === 'none' ? undefined : selectedTableId,
        status,
      })

      toast.success('Commande créée avec succès')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de la commande')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une commande</DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle commande pour ce produit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Produit */}
          <div className="space-y-2">
            <Label>Produit</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-background">
                {product.image ? (
                  product.image.startsWith('data:') || product.image.startsWith('/') ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.price.toFixed(2)} FCFA</p>
              </div>
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label>Quantité</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold">{quantity}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            {/* Table (optionnel) */}
            <div className="space-y-2">
              <Label htmlFor="table">Table (optionnel)</Label>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger id="table">
                  <SelectValue placeholder="Aucune table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune table</SelectItem>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut de la commande</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'completed' | 'PAID')}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Traité</SelectItem>
                  <SelectItem value="PAID">Payé</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {status === 'completed'
                  ? 'La commande sera marquée comme traitée (prête à être servie)'
                  : 'La commande sera marquée comme payée'}
              </p>
            </div>
          </div>
          {/* Total */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              {totalAmount.toFixed(2)} FCFA
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createOrderMutation.isPending}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="flex-1 gap-2"
            >
              {createOrderMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Création...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Créer la commande
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
