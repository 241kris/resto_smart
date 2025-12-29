"use client"

import { useState } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingCart, X, Loader2, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/contexts/CartContext"
import { useMutation } from "@tanstack/react-query"
import { saveOrderToLocalStorage } from "@/lib/orderStorage"

interface CartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
  tableToken: string
}

export function CartModal({ open, onOpenChange, restaurantId, tableToken }: CartModalProps) {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart()
  const [showSuccess, setShowSuccess] = useState(false)

  const createOrder = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          tableToken,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création de la commande')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Sauvegarder la commande dans le localStorage
      if (data.success && data.order) {
        saveOrderToLocalStorage({
          id: data.order.id,
          restaurantId: data.order.restaurantId,
          restaurantName: data.order.restaurantName,
          totalAmount: data.order.totalAmount,
          status: data.order.status,
          items: data.order.items,
          createdAt: data.order.createdAt,
        })
      }

      setShowSuccess(true)
      setTimeout(() => {
        clearCart()
        setShowSuccess(false)
        onOpenChange(false)
      }, 3000)
    },
  })

  const handleConfirmOrder = () => {
    if (items.length === 0) return
    createOrder.mutate()
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <CheckCircle2 className="h-24 w-24 text-green-500 opacity-75" />
              </div>
              <CheckCircle2 className="h-24 w-24 text-green-500 relative" />
            </div>
            <h3 className="text-2xl font-bold mt-6 mb-2">Commande confirmée !</h3>
            <p className="text-muted-foreground text-center">
              Votre commande a été transmise avec succès au restaurant.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b  border-gray-300">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Votre panier</DialogTitle>
         
          </div>
          {items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {totalItems} article{totalItems > 1 ? 's' : ''}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-6 mb-4">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Votre panier est vide</h3>
              <p className="text-sm text-muted-foreground text-center">
                Ajoutez des produits pour commencer votre commande
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 rounded-lg border   border-gray-300 bg-card hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative w-15 h-15 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.image ? (
                      item.image.startsWith('data:') || item.image.startsWith('/') ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <img
                          src={item.image}
                          alt={item.name}
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold  ">{item.name}</h4>
                    <p className="  text-sm text-emerald-700 font-medium mt-1">
                      {item.price % 1 === 0 ? item.price : item.price.toFixed(2)} FCFA
                    </p>

                    {/* Contrôles de quantité */}
                    <div className="flex items-center gap-3 mt-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Total et supprimer */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <p className="font-semibold text-sm">
                      {(item.price * item.quantity) % 1 === 0 ? (item.price * item.quantity) : (item.price * item.quantity).toFixed(2)} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <DialogFooter className="px-6 py-4 border-t flex-col border-gray-300 gap-4 sm:flex-col">
            <div className="flex items-center justify-between w-full">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-base  text-primary bg-emerald-700 px-3 text-gray-100 rounded-3xl">
                {totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)} FCFA
              </span>
            </div>

            <div className="flex gap-2 w-full">
             
              <Button
                className="flex-1 gap-2 rounded-3xl bg-orange-400 font-normal text-gray-900"
                onClick={handleConfirmOrder}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmer la commande
                  </>
                )}
              </Button>
            </div>

            {createOrder.isError && (
              <p className="text-sm text-destructive text-center w-full">
                {createOrder.error?.message || 'Une erreur est survenue'}
              </p>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
