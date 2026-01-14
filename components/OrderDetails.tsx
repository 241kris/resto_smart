"use client"

import { ArrowLeft, ShoppingCart, User, Phone, MapPin, CheckCircle, DollarSign, Trash2, FileText, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Order } from "@/lib/hooks/useOrders"
import { useOfflineSync } from "@/lib/hooks/useOfflineSync"
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

  const { isOnline } = useOfflineSync()
  const statusConfig = getStatusConfig(order.status)

  return (
    <div className="space-y-4 pb-6 max-w-4xl mx-auto">
      {/* Header compact */}
      <div className="flex items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold leading-none">Commande #{order.id.slice(0, 8)}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(order.createdAt), "d MMMM yyyy HH:mm", { locale: fr })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          {/* Actions rapides dans le header pour gagner de la place */}
          <div className="hidden sm:flex items-center gap-1 border-l pl-2">
            {order.status === "PAID" && (
              <Button size="sm" variant="outline" onClick={() => onDownloadInvoice(order)} disabled={!hasEstablishment}>
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {isOnline && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(order.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Colonne Gauche: Infos Client & Table */}
        <div className="md:col-span-1 space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  {order.table ? <MapPin className="h-4 w-4 text-primary" /> : <ShoppingCart className="h-4 w-4 text-orange-600" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Source</p>
                  <p className="text-sm font-medium">{order.table ? `Table ${order.table.name}` : "Vente publique"}</p>
                </div>
              </div>

              {!order.table && order.customer && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{(order.customer as any).firstName} {(order.customer as any).lastName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{(order.customer as any).phone}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <p className="text-xs text-muted-foreground">{(order.customer as any).address}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Boutons d'action verticaux et élégants */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground">Actions de statut</CardTitle>
            </CardHeader>
            <CardContent className="p-2 grid gap-1">
              {order.status === "PENDING" && (
                <Button variant="ghost" className="justify-start h-9 text-sm" onClick={() => onUpdateStatus(order.id, "completed")} disabled={isUpdating}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Marquer traité
                </Button>
              )}
              {(order.status === "PENDING" || order.status === "completed") && (
                <Button variant="ghost" className="justify-start h-9 text-sm" onClick={() => onUpdateStatus(order.id, "PAID")} disabled={isUpdating}>
                  <DollarSign className="h-4 w-4 mr-2 text-blue-500" /> Marquer payé
                </Button>
              )}
              {isOnline && (order.status === "PENDING" || order.status === "completed") && (
                <Button variant="ghost" className="justify-start h-9 text-sm text-orange-600" onClick={() => onUpdateStatus(order.id, "CANCELLED")} disabled={isUpdating}>
                  <XCircle className="h-4 w-4 mr-2" /> Annuler
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne Droite: Tableau des articles */}
        <div className="md:col-span-2">
          <Card className="shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Produit</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
                        <Image
                          src={item.product.image || "/placeholder.png"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm leading-none">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.price.toLocaleString()} FCFA
                      </p>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {item.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 bg-muted/20 border-t flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Montant Total</span>
              <span className="text-xl font-black text-primary">
                {order.totalAmount.toLocaleString()} FCFA
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}