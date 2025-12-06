"use client"

import { useState } from "react"
import { ShoppingCart, Eye, Clock, CheckCircle, Trash2, DollarSign, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useOrders, useUpdateOrderStatus, useDeleteOrder, type Order } from "@/lib/hooks/useOrders"
import { OrderNotification } from "./OrderNotification"

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

  const { data, isLoading } = useOrders()
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()

  const orders = data?.orders || []

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Suivez et gérez toutes vos commandes
        </p>
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
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-[hsl(var(--primary))]">
                            {order.table.number}
                          </span>
                        </div>
                        Table {order.table.number}
                      </div>
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(order.status === "PENDING" || order.status === "CANCELLED") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => confirmDelete(order.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Commande #{selectedOrder?.id.slice(0, 8)}</span>
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-[hsl(var(--muted))]/50 border border-gray-300 rounded-lg">
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Table</p>
                  <p className="font-semibold text-sm">Table {selectedOrder.table.number}</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Date/Heure</p>
                  <p className="font-semibold text-sm">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Articles commandés</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-[hsl(var(--border))] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Quantité: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.total.toFixed(2)} FCFA</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {item.price.toFixed(2)} FCFA / unité
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[hsl(var(--border))] pt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-bold text-base">Total</span>
                  <span className="text-base font-bold text-[hsl(var(--primary))]">
                    {selectedOrder.totalAmount.toFixed(2)} FCFA
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedOrder.status === "PENDING" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "completed")}
                    disabled={updateStatus.isPending}
                  >
                    Marquer traité
                  </Button>
                )}
                {(selectedOrder.status === "PENDING" || selectedOrder.status === "completed") && (
                  <Button
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "PAID")}
                    disabled={updateStatus.isPending}
                  >
                    Marquer payé
                  </Button>
                )}
                {(selectedOrder.status === "PENDING" || selectedOrder.status === "CANCELLED") && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => confirmDelete(selectedOrder.id)}
                  >
                    Supprimer
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
