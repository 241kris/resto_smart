"use client"

import { ShoppingCart, Eye, Clock, CheckCircle, DollarSign, Trash2, FileText, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Order } from "@/lib/hooks/useOrders"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface OrderCardProps {
  order: Order
  onViewDetails: (order: Order) => void
  onUpdateStatus: (orderId: string, status: Order["status"]) => void
  onDelete: (orderId: string) => void
  onDownloadInvoice: (order: Order) => void
  hasEstablishment: boolean
  isUpdating?: boolean
}

export function OrderCard({
  order,
  onViewDetails,
  onUpdateStatus,
  onDelete,
  onDownloadInvoice,
  hasEstablishment,
  isUpdating = false
}: OrderCardProps) {
  const getStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      PENDING: { variant: "destructive" as const, label: "En attente", icon: Clock },
      completed: { variant: "secondary" as const, label: "Traité", icon: CheckCircle },
      PAID: { variant: "default" as const, label: "Payé", icon: DollarSign },
      CANCELLED: { variant: "outline" as const, label: "Annulé", icon: Clock },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'à' HH:mm", { locale: fr })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm">#{order.id.slice(0, 8)}</span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {order.table ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {order.table.name}
                    </span>
                  </div>
                  <span className="truncate">Table {order.table.name}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="truncate text-orange-600">Public</span>
                </>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(order)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {order.status === "PENDING" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(order.id, "completed")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer traité
                </DropdownMenuItem>
              )}

              {(order.status === "PENDING" || order.status === "completed") && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(order.id, "PAID")}
                  disabled={isUpdating}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Marquer payé
                </DropdownMenuItem>
              )}

              {order.status === "PAID" && (
                <DropdownMenuItem
                  onClick={() => onDownloadInvoice(order)}
                  disabled={!hasEstablishment}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Télécharger facture
                </DropdownMenuItem>
              )}

              {(order.status === "PENDING" || order.status === "completed") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(order.id, "CANCELLED")}
                    disabled={isUpdating}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Annuler la commande
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(order.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Date/Heure</p>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs mb-1">Montant</p>
            <p className="font-bold text-primary text-base">{order.totalAmount.toFixed(2)} FCFA</p>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-muted-foreground text-xs mb-1">Articles</p>
          <p className="font-medium text-sm">{order.items.length} article{order.items.length > 1 ? 's' : ''}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => onViewDetails(order)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir les détails
        </Button>
      </CardContent>
    </Card>
  )
}
