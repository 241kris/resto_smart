"use client"

import { useState } from "react"
import { ShoppingCart, Minus, Plus, Trash2, X, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useManualOrderCart } from "@/contexts/ManualOrderCartContext"
import { useCreateManualOrder } from "@/lib/hooks/useOrders"
import { useTables } from "@/lib/hooks/useTables"
import { toast } from "sonner"
import Image from "next/image"

interface ManualOrderCartProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
}

export default function ManualOrderCart({
  open,
  onOpenChange,
  restaurantId,
}: ManualOrderCartProps) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalAmount,
  } = useManualOrderCart()

  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<'completed' | 'PAID'>('completed')

  const createOrderMutation = useCreateManualOrder()
  const { data: tablesData } = useTables(restaurantId)
  const tables = tablesData?.tables || []

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Le panier est vide")
      return
    }

    try {
      await createOrderMutation.mutateAsync({
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        tableId: selectedTableId === 'none' ? undefined : selectedTableId,
        status,
      })

      toast.success('Commande créée avec succès')
      clearCart()
      setSelectedTableId(undefined)
      setStatus('completed')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de la commande')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Panier de commande
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems} {totalItems > 1 ? 'articles' : 'article'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Ajustez votre commande et validez
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 py-4 overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Votre panier est vide</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez des produits pour créer une commande
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Liste des produits - Scrollable avec ScrollArea */}
              <div className="flex-1">
                <ScrollArea className="h-[400px] lg:h-[500px]">
                  <div className="space-y-3 pr-4">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-3 p-3 rounded-lg bg-muted/50 border"
                      >
                      {/* Image du produit */}
                      <div className="relative w-10 h-10 shrink-0  rounded-md overflow-hidden bg-background">
                        {item.product.image ? (
                          item.product.image.startsWith('data:') || item.product.image.startsWith('/') ? (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.product.price % 1 === 0 ? item.product.price : item.product.price.toFixed(2)} FCFA
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Contrôles quantité */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => {
                                // Vérifier le stock disponible
                                if (item.product.isQuantifiable && (item.product.quantity ?? 0) < item.quantity + 1) {
                                  toast.error("Quantité demandée indisponible")
                                  return
                                }
                                updateQuantity(item.product.id, item.quantity + 1)
                              }}
                              disabled={item.product.isQuantifiable && (item.product.quantity ?? 0) <= item.quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="ml-auto text-sm font-bold text-primary">
                              {(item.product.price * item.quantity) % 1 === 0 ? (item.product.price * item.quantity) : (item.product.price * item.quantity).toFixed(2)} FCFA
                            </span>
                          </div>
                          {item.product.isQuantifiable && (item.product.quantity ?? 0) <= item.quantity && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Stock disponible: {item.product.quantity ?? 0} unité(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Espaceur pour voir le dernier produit */}
                  <div className="mt-25"></div>
                </div>
              </ScrollArea>
              </div>

              {/* Options de commande - Sidebar responsive */}
              <div className="lg:w-80 shrink-0 space-y-4 lg:pl-6 lg:border-l">
                  <h3 className="font-semibold mb-4">Options</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
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

                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
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
                          ? 'Commande traitée'
                          : 'Commande payée'}
                      </p>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Articles</span>
                      <span className="font-semibold">{totalItems}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">
                        {totalAmount % 1 === 0 ? totalAmount : totalAmount.toFixed(2)} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {items.length > 0 && (
          <DialogFooter className="px-6 py-4 border-t flex-col gap-3 sm:flex-col">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => clearCart()}
                className="flex-1"
                disabled={createOrderMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Vider le panier
              </Button>
              <Button
                onClick={handleSubmit}
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
                    Valider la commande
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
