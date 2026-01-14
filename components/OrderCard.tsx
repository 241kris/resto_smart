"use client"

import { ShoppingCart, Eye, Clock, CheckCircle, DollarSign, Trash2, FileText, MoreVertical } from "lucide-react"
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
import { useOfflineSync } from "@/lib/hooks/useOfflineSync"
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
  const { isOnline } = useOfflineSync()

  const getStatusInfo = (status: Order["status"]) => {
    switch (status) {
      case 'PENDING': return { label: 'Attente', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: Clock }
      case 'completed': return { label: 'Prêt', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle }
      case 'PAID': return { label: 'Payé', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: DollarSign }
      case 'CANCELLED': return { label: 'Annulé', color: 'text-slate-500 bg-slate-100 border-slate-200', icon: Clock }
      default: return { label: status, color: 'text-slate-500', icon: Clock }
    }
  }

  const { label, color, icon: StatusIcon } = getStatusInfo(order.status)

  return (
    <div className="p-4 bg-white dark:bg-slate-900 flex items-center gap-4 group hover:bg-slate-50/50 transition-colors">
      {/* Left Icon/Status */}
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${color}`}>
        <StatusIcon className="h-6 w-6" />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0" onClick={() => onViewDetails(order)}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">#{order.id.slice(0, 4)}</span>
            {order.table ? (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-slate-200 text-slate-500 font-normal rounded-md">
                T-{order.table.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-dashed border-slate-300 text-slate-400 font-normal rounded-md">
                Public
              </Badge>
            )}
          </div>
          <span className="font-bold text-base text-slate-900 dark:text-white">
            {order.totalAmount.toLocaleString()} F
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(new Date(order.createdAt), "HH:mm")} • {order.items.length} produit(s)</span>
          <span className={`font-medium ${color.split(' ')[0]}`}>{label}</span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-sm">
          <DropdownMenuItem onClick={() => onViewDetails(order)}>
            <Eye className="h-4 w-4 mr-2" /> Détails
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {order.status === "PENDING" && (
            <DropdownMenuItem onClick={() => onUpdateStatus(order.id, "completed")}>
              <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Prêt
            </DropdownMenuItem>
          )}
          {(order.status === "PENDING" || order.status === "completed") && (
            <DropdownMenuItem onClick={() => onUpdateStatus(order.id, "PAID")}>
              <DollarSign className="h-4 w-4 mr-2 text-blue-500" /> Payer
            </DropdownMenuItem>
          )}
          {order.status === "PAID" && (
            <DropdownMenuItem onClick={() => onDownloadInvoice(order)}>
              <FileText className="h-4 w-4 mr-2" /> Facture
            </DropdownMenuItem>
          )}
          {isOnline && (order.status === "PENDING" || order.status === "completed") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onUpdateStatus(order.id, "CANCELLED")} className="text-orange-600">
                <Clock className="h-4 w-4 mr-2" /> Annuler
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-rose-600">
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
