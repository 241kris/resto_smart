"use client"

import { useState } from "react"
import {
  ShoppingCart, Eye, Clock, CheckCircle, Trash2, DollarSign,
  AlertTriangle, Calendar as CalendarIcon,
  ArrowUpRight, Receipt, Activity, ListFilter
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useOrders, useUpdateOrderStatus, useDeleteOrder, type Order } from "@/lib/hooks/useOrders"
import { useEstablishment } from "@/lib/hooks/useEstablishment"
import { useAllOrders, useOfflineSync } from "@/lib/hooks/useOfflineSync"
import { offlineStorage } from "@/lib/offlineStorage"
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator"
import { OrderNotification } from "./OrderNotification"
import { OrderCard } from "./OrderCard"
import { OrderDetails } from "./OrderDetails"
import { generateInvoicePDF } from "@/lib/generateInvoicePDF"
import { toast } from "sonner"
import { format, isToday, isYesterday } from "date-fns"
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
    return 'today'
  }

  const period = getPeriodFromDate(selectedDate)
  const { data, isLoading } = useOrders(period)
  const { data: establishmentData } = useEstablishment()
  const { localOrders, isLoading: isLoadingLocal } = useAllOrders()
  const { updateOrderStatus: updateOfflineStatus } = useOfflineSync()
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()

  // Merge server + local orders
  const serverOrders = data?.orders || []
  const mergedOrders = [
    ...serverOrders,
    ...localOrders.map(localOrder => ({
      id: localOrder.localId,
      restaurantId: localOrder.restaurantId,
      tableId: localOrder.tableId,
      totalAmount: localOrder.totalAmount,
      status: localOrder.status,
      customer: localOrder.customer,
      items: localOrder.items.map(item => ({
        id: item.productId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: { id: item.productId, name: item.productName, image: null }
      })),
      table: localOrder.tableId ? { id: localOrder.tableId, name: 'Table' } : null,
      createdAt: localOrder.createdAt,
      _isLocal: true,
      _syncStatus: localOrder.syncStatus
    } as any))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const orders = mergedOrders
  const establishment = establishmentData?.establishment

  const pendingOrdersCount = orders.filter(o => o.status === "PENDING").length
  const processedOrdersCount = orders.filter(o => o.status === "completed" || o.status === "PAID").length
  const totalRevenue = orders.filter(o => o.status === "PAID").reduce((acc, o) => acc + o.totalAmount, 0)

  const handleUpdateStatus = (orderId: string, newStatus: Order["status"]) => {
    const order = orders.find(o => o.id === orderId)
    if ((order as any)?._isLocal) {
      updateOfflineStatus(orderId, newStatus)
      return
    }

    updateStatus.mutate({ orderId, status: newStatus }, {
      onSuccess: () => {
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    })
  }

  const confirmDelete = (orderId: string) => {
    setOrderToDelete(orderId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return
    const order = orders.find(o => o.id === orderToDelete)
    if ((order as any)?._isLocal) {
      await offlineStorage.deleteOrder(orderToDelete)
      setDeleteDialogOpen(false)
      setOrderToDelete(null)
      if (selectedOrder?.id === orderToDelete) setViewMode('list')
      toast.success('Commande locale supprimée')
      return
    }
    deleteOrder.mutate(orderToDelete, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setOrderToDelete(null)
        if (selectedOrder?.id === orderToDelete) setViewMode('list')
      }
    })
  }

  const handleDownloadInvoice = (order: Order) => {
    if (!establishment) return toast.error('Infos restaurant manquantes')
    generateInvoicePDF(order, establishment)
  }

  if (isLoading || isLoadingLocal) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse text-sm text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" /> Chargement...
        </div>
      </div>
    )
  }

  if (viewMode === 'details' && selectedOrder) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-200">
        <OrderNotification hasPendingOrders={pendingOrdersCount > 0} />
        <OrderDetails
          order={selectedOrder}
          onBack={() => setViewMode('list')}
          onUpdateStatus={handleUpdateStatus}
          onDelete={confirmDelete}
          onDownloadInvoice={handleDownloadInvoice}
          hasEstablishment={!!establishment}
          isUpdating={updateStatus.isPending}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-8 pb-32 px-4 md:px-8">
      <OrderNotification hasPendingOrders={pendingOrdersCount > 0} />

      {/* HEADER COMPACT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Flux Commandes</h1>
          </div>
          <p className="text-base text-muted-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {orders.length} commande(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OnlineStatusIndicator />
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="lg" className="h-12 px-6 text-base font-medium bg-white dark:bg-slate-900 border-none shadow-sm data-[state=open]:ring-2">
                <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { if (d) { setSelectedDate(d); setCalendarOpen(false) } }}
                locale={fr}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* STATS STRIP COMPACT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center gap-1">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Revenu</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalRevenue.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground font-semibold">FCFA</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center gap-1">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Traité</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{processedOrdersCount}</span>
            <span className="text-sm text-muted-foreground font-semibold">/ {orders.length}</span>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-800/30 flex flex-col justify-center gap-1">
          <span className="text-xs text-orange-600/70 dark:text-orange-400 font-bold uppercase tracking-wider">En attente</span>
          <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
            <Clock className="h-8 w-8" />
            <span className="text-3xl font-black">{pendingOrdersCount}</span>
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-4">
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full">
              <ListFilter className="h-12 w-12 opacity-20" />
            </div>
            <p className="text-base font-medium">Aucune commande pour cette période</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onViewDetails={() => { setSelectedOrder(order); setViewMode('details') }} onUpdateStatus={handleUpdateStatus} onDelete={confirmDelete} onDownloadInvoice={handleDownloadInvoice} hasEstablishment={!!establishment} isUpdating={updateStatus.isPending} />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="h-14 font-bold text-xs uppercase text-slate-400 pl-8">Réf</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase text-slate-400 text-center">Origine</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase text-slate-400">Heure</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase text-slate-400 text-right">Montant</TableHead>
                    <TableHead className="h-14 font-bold text-xs uppercase text-slate-400 text-center">Statut</TableHead>
                    <TableHead className="h-14 w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { setSelectedOrder(order); setViewMode('details') }}>
                      <TableCell className="py-5 pl-8 font-semibold text-base">
                        <span className="font-mono text-slate-400 text-sm mr-1">#</span>{order.id.slice(0, 8)}
                        {(order as any)._isLocal && (
                          <Badge variant="outline" className={`ml-3 text-[10px] h-6 px-2.5 font-bold tracking-wide ${(order as any)._syncStatus === 'synced' ? 'text-emerald-500 border-emerald-200 bg-emerald-50' : 'text-amber-500 border-amber-200 bg-amber-50'}`}>
                            {(order as any)._syncStatus === 'synced' ? 'SYNC' : 'LOCAL'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        {order.table ? (
                          <Badge variant="secondary" className="text-sm h-8 font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg px-4 border border-slate-200">
                            Table {order.table.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-sm h-8 font-semibold text-slate-500 border-dashed rounded-lg px-4 border-slate-300">
                            Public
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-5 text-sm font-medium text-slate-500">
                        {format(new Date(order.createdAt), "HH:mm")}
                      </TableCell>
                      <TableCell className="py-5 text-right font-bold text-lg text-slate-800 dark:text-white">
                        {order.totalAmount.toLocaleString()} <span className="text-xs text-slate-400 font-medium ml-1">F</span>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <Badge
                          variant={order.status === 'PENDING' ? 'destructive' : order.status === 'PAID' ? 'default' : 'secondary'}
                          className={`
                            h-8 px-4 text-xs font-bold rounded-full shadow-sm
                            ${order.status === 'PENDING' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                            ${order.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}
                            ${order.status === 'PAID' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                          `}
                        >
                          {order.status === 'PENDING' ? 'En attente' :
                            order.status === 'completed' ? 'Terminé' :
                              order.status === 'PAID' ? 'Payé' :
                                order.status === 'CANCELLED' ? 'Annulé' : order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 pr-6 text-right">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
                          <ArrowUpRight className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm p-8">
          <DialogHeader className="text-center sm:text-center space-y-4">
            <div className="mx-auto bg-rose-50 p-4 rounded-full text-rose-500 w-fit">
              <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">Supprimer la commande ?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">Cette action est irréversible et effacera toutes les données associées.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-3 mt-4">
            <Button variant="destructive" size="lg" onClick={handleDeleteOrder} className="w-full rounded-2xl font-bold h-12 text-base" disabled={deleteOrder.isPending}>Oui, supprimer</Button>
            <Button variant="ghost" size="lg" onClick={() => setDeleteDialogOpen(false)} className="w-full rounded-2xl font-bold h-12 text-base text-slate-500">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}