"use client"

import { useState } from "react"
import { ShoppingCart, Eye, Clock, CheckCircle, Trash2, DollarSign, Loader2, AlertTriangle, Calendar as CalendarIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useOrders, useUpdateOrderStatus, useDeleteOrder, type Order } from "@/lib/hooks/useOrders"
import { useEstablishment } from "@/lib/hooks/useEstablishment"
import { OrderNotification } from "./OrderNotification"
import { OrderCard } from "./OrderCard"
import { OrderDetails } from "./OrderDetails"
import { generateInvoicePDF } from "@/lib/generateInvoicePDF"
import { toast } from "sonner"
import { format, isToday, isYesterday, subDays } from "date-fns"
import { fr } from "date-fns/locale"

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list')

  const getPeriodFromDate = (date: Date): 'today' | 'yesterday' | 'day-before-yesterday' => {
    if (isToday(date)) return 'today'
    if (isYesterday(date)) return 'yesterday'
    const dayBeforeYesterday = subDays(new Date(), 2)
    if (format(date, 'yyyy-MM-dd') === format(dayBeforeYesterday, 'yyyy-MM-dd')) {
      return 'day-before-yesterday'
    }
    return 'today'
  }

  const period = getPeriodFromDate(selectedDate)
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
          setSelectedOrder(null)
          setViewMode('list')
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

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setViewMode('details')
  }

  const handleBackToList = () => {
    setSelectedOrder(null)
    setViewMode('list')
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

  // Afficher les détails si une commande est sélectionnée
  if (viewMode === 'details' && selectedOrder) {
    return (
      <>
        <OrderNotification hasPendingOrders={pendingOrdersCount > 0} />
        <OrderDetails
          order={selectedOrder}
          onBack={handleBackToList}
          onUpdateStatus={handleUpdateStatus}
          onDelete={confirmDelete}
          onDownloadInvoice={handleDownloadInvoice}
          hasEstablishment={!!establishment}
          isUpdating={updateStatus.isPending}
        />

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
      </>
    )
  }

  return (
    <div className="space-y-6">
      <OrderNotification hasPendingOrders={pendingOrdersCount > 0} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground text-sm">
            Suivez et gérez toutes vos commandes
          </p>
        </div>

        {/* Filtre par date avec calendrier */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={isToday(selectedDate) ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedDate(new Date())
                    setCalendarOpen(false)
                  }}
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant={isYesterday(selectedDate) ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedDate(subDays(new Date(), 1))
                    setCalendarOpen(false)
                  }}
                >
                  Hier
                </Button>
                <Button
                  variant={format(selectedDate, 'yyyy-MM-dd') === format(subDays(new Date(), 2), 'yyyy-MM-dd') ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedDate(subDays(new Date(), 2))
                    setCalendarOpen(false)
                  }}
                >
                  Avant-hier
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date)
                  setCalendarOpen(false)
                }
              }}
              initialFocus
              locale={fr}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats - Scrollable horizontalement sur mobile */}
      <div className="relative -mx-4 sm:mx-0">
        <div className="overflow-x-auto px-4 sm:px-0 pb-2 sm:pb-0">
          <div className="flex sm:grid sm:grid-cols-4 gap-4 min-w-max sm:min-w-0">
            <Card className="min-w-[200px] sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>

            <Card className="min-w-[200px] sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingOrdersCount}</div>
              </CardContent>
            </Card>

            <Card className="min-w-[200px] sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Traités</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processedOrdersCount}</div>
              </CardContent>
            </Card>

            <Card className="min-w-[200px] sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRevenue % 1 === 0 ? totalRevenue : totalRevenue.toFixed(2)} FCFA</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune commande pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cards sur mobile, tableau sur desktop */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={handleViewDetails}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={confirmDelete}
                  onDownloadInvoice={handleDownloadInvoice}
                  hasEstablishment={!!establishment}
                  isUpdating={updateStatus.isPending}
                />
              ))}
            </div>
          </div>

          {/* Tableau sur desktop */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle>Liste des commandes</CardTitle>
            </CardHeader>
            <CardContent>
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
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {order.table.name}
                              </span>
                            </div>
                            Table {order.table.name}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-400/10 flex items-center justify-center">
                              <ShoppingCart className="h-4 w-4 text-orange-600" />
                            </div>
                            <span className="text-sm text-muted-foreground">Public</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {order.items.length} articles
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{order.totalAmount % 1 === 0 ? order.totalAmount : order.totalAmount.toFixed(2)} FCFA</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

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
