"use client"

import { ArrowLeft, ShoppingCart, User, Phone, MapPin, CheckCircle, DollarSign, Trash2, FileText, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { type Order } from "@/lib/hooks/useOrders"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Image from "next/image"

interface OrderDetailsProps {
  order: Order
  onBack: () => void
  onUpdateStatus: (orderId: string, status: Order["status"]) => void
  onDelete: (orderId: string) => void
  onDownloadInvoice: (order: Order) => void
  hasEstablishment: boolean
  isUpdating?: boolean
}

export function OrderDetails({
  order,
  onBack,
  onUpdateStatus,
  onDelete,
  onDownloadInvoice,
  hasEstablishment,
  isUpdating = false
}: OrderDetailsProps) {
  const getStatusConfig = (status: Order["status"]) => {
    const configs = {
      PENDING: { variant: "destructive" as const, label: "En attente" },
      completed: { variant: "secondary" as const, label: "Traité" },
      PAID: { variant: "default" as const, label: "Payé" },
      CANCELLED: { variant: "outline" as const, label: "Annulé" },
    }
    return configs[status]
  }

  const statusConfig = getStatusConfig(order.status)

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header avec retour */}
      <div className="flex items-center justify-between gap-4 sticky top-0 bg-background z-10 py-4 border-b">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold truncate">
              Commande #{order.id.slice(0, 8)}
            </h1>
          </div>
        </div>

        <Badge variant={statusConfig.variant} className="flex-shrink-0">
          {statusConfig.label}
        </Badge>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Table</p>
              {order.table ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {order.table.name}
                    </span>
                  </div>
                  <span className="font-semibold">Table {order.table.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-600">Commande publique</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Date/Heure</p>
              <p className="font-semibold text-sm">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations Client (si commande publique) */}
      {!order.table && order.customer && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nom complet</p>
                <p className="font-medium">
                  {(order.customer as any).firstName} {(order.customer as any).lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Téléphone
                </p>
                <p className="font-medium">{(order.customer as any).phone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Adresse de livraison
                </p>
                <p className="font-medium">{(order.customer as any).address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles commandés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Articles commandés ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                {item.product.image && (
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1 truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {item.price % 1 === 0 ? item.price : item.price.toFixed(2)} FCFA
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-primary">{item.total % 1 === 0 ? item.total : item.total.toFixed(2)} FCFA</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <span className="font-bold text-lg">Total</span>
            <span className="text-xl font-bold text-primary">
              {order.totalAmount % 1 === 0 ? order.totalAmount : order.totalAmount.toFixed(2)} FCFA
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {order.status === "PENDING" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onUpdateStatus(order.id, "completed")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer traité
                </Button>
              )}

              {(order.status === "PENDING" || order.status === "completed") && (
                <Button
                  className="flex-1"
                  onClick={() => onUpdateStatus(order.id, "PAID")}
                  disabled={isUpdating}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Marquer payé
                </Button>
              )}

              {order.status === "PAID" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onDownloadInvoice(order)}
                  disabled={!hasEstablishment}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Télécharger facture
                </Button>
              )}
            </div>

            {(order.status === "PENDING" || order.status === "completed") && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                  onClick={() => onUpdateStatus(order.id, "CANCELLED")}
                  disabled={isUpdating}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Annuler la commande
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 sm:flex-initial"
                  onClick={() => onDelete(order.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
