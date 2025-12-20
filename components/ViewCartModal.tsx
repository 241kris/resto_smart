"use client"

import { useState } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingCart, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/contexts/CartContext"
import { CustomerForm, type CustomerData } from "./CustomerForm"
import { saveOrderToLocalStorage } from "@/lib/orderStorage"
import { toast } from "sonner"

interface ViewCartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
  restaurantName: string
}

export function ViewCartModal({ open, onOpenChange, restaurantId, restaurantName }: ViewCartModalProps) {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart()
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const handleSubmitOrder = async (customerData: CustomerData) => {
    setIsSubmitting(true)

    try {
      // Préparer les données de la commande
      const orderData = {
        restaurantId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        customer: customerData,
      }

      // Envoyer la commande à l'API
      const response = await fetch('/api/orders/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création de la commande')
      }

      const result = await response.json()

      // Sauvegarder la commande dans le localStorage
      saveOrderToLocalStorage({
        id: result.order.id,
        restaurantId,
        restaurantName,
        totalAmount: result.order.totalAmount,
        status: result.order.status,
        items: result.order.items,
        createdAt: result.order.createdAt,
      })

      // Afficher le succès
      setOrderSuccess(true)

      // Vider le panier après 2 secondes
      setTimeout(() => {
        clearCart()
        setShowCustomerForm(false)
        setOrderSuccess(false)
        onOpenChange(false)
      }, 2000)

    } catch (error) {
      console.error('Erreur lors de la soumission de la commande:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la commande')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProceedToOrder = () => {
    setShowCustomerForm(true)
  }

  const handleCancelCustomerForm = () => {
    setShowCustomerForm(false)
  }

  // Réinitialiser l'état quand la modal se ferme
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowCustomerForm(false)
      setOrderSuccess(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              {orderSuccess ? "Commande confirmée !" : showCustomerForm ? "Vos informations" : "Votre panier"}
            </DialogTitle>
          </div>
          {items.length > 0 && !showCustomerForm && !orderSuccess && (
            <p className="text-sm text-muted-foreground">
              {totalItems} article{totalItems > 1 ? 's' : ''}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Message de succès */}
          {orderSuccess && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-emerald-100 p-6 mb-4">
                <Check className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Commande enregistrée !</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Votre commande a été enregistrée avec succès. Vous pourrez la consulter dans vos commandes pendant 24 heures.
              </p>
            </div>
          )}

          {/* Formulaire client */}
          {showCustomerForm && !orderSuccess && (
            <CustomerForm
              onSubmit={handleSubmitOrder}
              onCancel={handleCancelCustomerForm}
              isLoading={isSubmitting}
            />
          )}

          {/* Liste des produits du panier */}
          {!showCustomerForm && !orderSuccess && (
            items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-6 mb-4">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Votre panier est vide</h3>
              <p className="text-sm text-muted-foreground text-center">
                Ajoutez des produits pour voir votre sélection
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 rounded-lg border border-gray-300 bg-card hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative w-15 h-15 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-emerald-700 font-medium mt-1">
                      {item.price.toFixed(2)} FCFA
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
                      {(item.price * item.quantity).toFixed(2)} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        </div>

        {items.length > 0 && !showCustomerForm && !orderSuccess && (
          <DialogFooter className="px-6 py-4 border-t flex-col border-gray-300 gap-4 sm:flex-col">
            <div className="flex items-center justify-between w-full">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-base text-primary bg-emerald-700 px-3 text-gray-100 rounded-3xl">
                {totalPrice.toFixed(2)} FCFA
              </span>
            </div>
            <Button
              className="w-full bg-orange-400 hover:bg-orange-300 text-gray-900"
              onClick={handleProceedToOrder}
            >
              Commander
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
