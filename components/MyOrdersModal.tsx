"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Clock, CheckCircle, DollarSign, X, Loader2, RefreshCw } from "lucide-react"
import { getOrdersFromLocalStorage, updateOrderStatusInLocalStorage, type StoredOrder } from "@/lib/orderStorage"
import { toast } from "sonner"

interface MyOrdersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MyOrdersModal({ open, onOpenChange }: MyOrdersModalProps) {
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)

  // Charger les commandes au montage et quand la modal s'ouvre
  useEffect(() => {
    if (open) {
      loadOrders()
    }
  }, [open])

  const loadOrders = () => {
    const localOrders = getOrdersFromLocalStorage()
    setOrders(localOrders)
  }

  // Récupérer le statut mis à jour depuis l'API
  const refreshOrderStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/public/${orderId}`)
      if (!response.ok) return

      const data = await response.json()
      if (data.success && data.order) {
        // Mettre à jour le statut dans le localStorage
        updateOrderStatusInLocalStorage(orderId, data.order.status)
        loadOrders()
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
    }
  }

  // Rafraîchir tous les statuts
  const refreshAllStatuses = async () => {
    setLoading(true)
    await Promise.all(orders.map(order => refreshOrderStatus(order.id)))
    setLoading(false)
  }

  // Annuler une commande
  const cancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId)
    try {
      const response = await fetch(`/api/orders/public/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })

      const data = await response.json()

      if (data.success) {
        // Mettre à jour le statut dans le localStorage
        updateOrderStatusInLocalStorage(orderId, 'CANCELLED')
        loadOrders()
      } else {
        toast.error(data.error || 'Erreur lors de l\'annulation')
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      toast.error('Erreur lors de l\'annulation de la commande')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      PENDING: { variant: "destructive" as const, label: "En attente", icon: Clock, color: "text-yellow-700 bg-yellow-100" },
      completed: { variant: "secondary" as const, label: "Traité", icon: CheckCircle, color: "text-blue-700 bg-blue-100" },
      PAID: { variant: "default" as const, label: "Payé", icon: DollarSign, color: "text-green-700 bg-green-100" },
      CANCELLED: { variant: "outline" as const, label: "Annulé", icon: X, color: "text-gray-700 bg-gray-100" },
    }

    const config = configs[status as keyof typeof configs] || configs.PENDING
    const Icon = config.icon

    return (
      <Badge className={`gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Mes Commandes</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllStatuses}
              disabled={loading || orders.length === 0}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </DialogHeader>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-sm text-muted-foreground text-center">
              Vos commandes apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-400 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                {/* En-tête de la commande */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-base">{order.restaurantName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Commande #{order.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(order.status)}
                    <p className="font-bold text-sm text-orange-600">
                      {order.totalAmount.toFixed(2)} FCFA
                    </p>
                  </div>
                </div>

                {/* Articles */}
                <div className="space-y-2 border-t border-gray-400 pt-3">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Articles ({order.items.length})
                  </p>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-medium">{item.total.toFixed(2)} FCFA</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {order.status === 'PENDING' && (
                  <div className="border-t pt-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => cancelOrder(order.id)}
                      disabled={cancellingOrderId === order.id}
                    >
                      {cancellingOrderId === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Annulation...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Annuler la commande
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
