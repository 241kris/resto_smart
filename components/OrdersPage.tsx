"use client"

import { useState } from "react"
import { ShoppingCart, Eye, Clock, CheckCircle, Trash2, DollarSign, Loader2, AlertTriangle, FileText, User, Phone, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useOrders, useUpdateOrderStatus, useDeleteOrder, type Order } from "@/lib/hooks/useOrders"
import { useEstablishment } from "@/lib/hooks/useEstablishment"
import { OrderNotification } from "./OrderNotification"
import { generateInvoicePDF } from "@/lib/generateInvoicePDF"
import { toast } from "sonner"

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'day-before-yesterday'>('today')

  const { data, isLoading } = useOrders(period)
  const { data: establishmentData } = useEstablishment()
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()

  const orders = data?.orders || []
  const establishment = establishmentData?.establishment

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

  const confirmDelete = (orderId: string) => {
    setOrderToDelete(orderId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteOrder = () => {
    if (!orderToDelete) return

    deleteOrder.mutate(orderToDelete, {
      onSuccess: () => {
        if (selectedOrder?.id === orderToDelete) {
          setIsDialogOpen(false)
          setSelectedOrder(null)
        }
        setDeleteDialogOpen(false)
        setOrderToDelete(null)
      }
    })
  }

  const handleUpdateStatus = (orderId: string, newStatus: Order["status"]) => {
    updateStatus.mutate({ orderId, status: newStatus }, {
      onSuccess: () => {
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    })
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

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleDownloadInvoice = (order: Order) => {
    if (!establishment) {
      toast.error('Impossible de générer la facture. Informations du restaurant manquantes.')
      return
    }

    generateInvoicePDF(order, establishment)
  }

  const pendingOrdersCount = orders.filter(o => o.status === "PENDING").length
  const processedOrdersCount = orders.filter(o => o.status === "completed").length
  const totalRevenue = orders.filter(o => o.status === "PAID").reduce((acc, o) => acc + o.totalAmount, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OrderNotification hasPendingOrders={pendingOrdersCount > 0} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">
            Suivez et gérez toutes vos commandes
          </p>
        </div>

        {/* Filtre par période */}
        <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sélectionner période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="yesterday">Hier</SelectItem>
            <SelectItem value="day-before-yesterday">Avant-hier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{pendingOrdersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traités</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{processedOrdersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{totalRevenue.toFixed(2)} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune commande pour le moment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {order.table ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-[hsl(var(--primary))]">
                              {order.table.number}
                            </span>
                          </div>
                          Table {order.table.number}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-400/10 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className="text-sm text-muted-foreground">Commande publique</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {formatDate(order.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {order.items.length} articles
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{order.totalAmount.toFixed(2)} FCFA</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openOrderDetails(order)}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "PAID" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={!establishment}
                            title="Télécharger la facture PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {(order.status === "PENDING" || order.status === "completed") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => confirmDelete(order.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Commande #{selectedOrder?.id.slice(0, 8)}</span>
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-3">
              {/* Informations générales */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Table</p>
                      {selectedOrder.table ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {selectedOrder.table.number}
                            </span>
                          </div>
                          <span className="font-semibold text-sm">Table {selectedOrder.table.number}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-3.5 w-3.5 text-orange-600" />
                          <span className="font-semibold text-sm text-orange-600">Commande publique</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Date/Heure</p>
                      <p className="font-semibold text-sm">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations Client pour commandes publiques */}
              {!selectedOrder.table && selectedOrder.customer && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Informations Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Prénom</p>
                        <p className="font-medium text-sm">{(selectedOrder.customer as any).firstName}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Nom</p>
                        <p className="font-medium text-sm">{(selectedOrder.customer as any).lastName}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Téléphone
                        </p>
                        <p className="font-medium text-sm">{(selectedOrder.customer as any).phone}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Adresse
                        </p>
                        <p className="font-medium text-sm">{(selectedOrder.customer as any).address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Articles commandés */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Articles commandés</h3>
                <div className="space-y-1.5">
                  {selectedOrder.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Quantité: {item.quantity} × {item.price.toFixed(2)} FCFA
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-sm">{item.total.toFixed(2)} FCFA</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base">Total</span>
                    <span className="text-base font-bold text-primary">
                      {selectedOrder.totalAmount.toFixed(2)} FCFA
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {selectedOrder.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUpdateStatus(selectedOrder.id, "completed")}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Marquer traité
                    </Button>
                  )}
                  {(selectedOrder.status === "PENDING" || selectedOrder.status === "completed") && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUpdateStatus(selectedOrder.id, "PAID")}
                      disabled={updateStatus.isPending}
                    >
                      <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                      Marquer payé
                    </Button>
                  )}
                  {(selectedOrder.status === "PENDING" || selectedOrder.status === "completed") && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => confirmDelete(selectedOrder.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Supprimer
                    </Button>
                  )}
                </div>
                {selectedOrder.status === "PAID" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    disabled={!establishment}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Télécharger la facture (PDF)
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteOrder.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
