"use client"

import { useState, useMemo } from "react"
import { Calendar as CalendarIcon, Clock, Package, Search } from "lucide-react"
import { format, startOfDay, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRestockHistory } from "@/lib/hooks/useRestock"
import type { RestockHistoryItem } from "@/lib/hooks/useRestock"
import Image from "next/image"

type DateFilter = 'today' | 'yesterday' | 'before-yesterday' | 'custom'

interface GroupedRestock {
  productId: string
  productName: string
  productPrice: number
  productImage: string | null
  categoryName: string | null
  restocks: Array<{
    id: string
    quantity: number
    createdAt: string
  }>
  totalQuantity: number
}

export default function RestockHistoryPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [customDate, setCustomDate] = useState<Date>()
  const [searchTerm, setSearchTerm] = useState("")

  // Calculer les dates de début et fin selon le filtre
  const { startDate, endDate } = useMemo(() => {
    const today = startOfDay(new Date())

    switch (dateFilter) {
      case 'today':
        return {
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        }
      case 'yesterday':
        const yesterday = subDays(today, 1)
        return {
          startDate: format(yesterday, 'yyyy-MM-dd'),
          endDate: format(yesterday, 'yyyy-MM-dd')
        }
      case 'before-yesterday':
        const beforeYesterday = subDays(today, 2)
        return {
          startDate: format(beforeYesterday, 'yyyy-MM-dd'),
          endDate: format(beforeYesterday, 'yyyy-MM-dd')
        }
      case 'custom':
        if (customDate) {
          return {
            startDate: format(customDate, 'yyyy-MM-dd'),
            endDate: format(customDate, 'yyyy-MM-dd')
          }
        }
        return {
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        }
      default:
        return {
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        }
    }
  }, [dateFilter, customDate])

  const { data, isLoading } = useRestockHistory({ startDate, endDate })

  // Grouper les ravitaillements par produit
  const groupedRestocks = useMemo(() => {
    if (!data?.restockHistory) return []

    const grouped = data.restockHistory.reduce((acc: Record<string, GroupedRestock>, item: RestockHistoryItem) => {
      const productId = item.product.id

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: item.product.name,
          productPrice: item.product.price || 0,
          productImage: item.product.image,
          categoryName: item.product.category?.name || null,
          restocks: [],
          totalQuantity: 0
        }
      }

      acc[productId].restocks.push({
        id: item.id,
        quantity: item.quantity,
        createdAt: item.createdAt
      })
      acc[productId].totalQuantity += item.quantity

      return acc
    }, {})

    return Object.values(grouped)
  }, [data])

  // Filtrer par recherche
  const filteredRestocks = useMemo(() => {
    if (!searchTerm) return groupedRestocks

    return groupedRestocks.filter(group =>
      group.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [groupedRestocks, searchTerm])

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter)
    if (filter !== 'custom') {
      setCustomDate(undefined)
    }
  }

  const handleCustomDateSelect = (date: Date | undefined) => {
    setCustomDate(date)
    if (date) {
      setDateFilter('custom')
    }
  }

  // Texte du filtre de date actuel
  const dateFilterText = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return "Aujourd'hui"
      case 'yesterday':
        return "Hier"
      case 'before-yesterday':
        return "Avant-hier"
      case 'custom':
        return customDate ? format(customDate, 'dd MMMM yyyy', { locale: fr }) : "Date personnalisée"
      default:
        return "Aujourd'hui"
    }
  }, [dateFilter, customDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historique des ravitaillements</h1>
        <p className="text-muted-foreground">
          Consultez l'historique de tous les ravitaillements effectués
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Filtres de date rapides */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateFilterChange('today')}
              >
                Aujourd'hui
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateFilterChange('yesterday')}
              >
                Hier
              </Button>
              <Button
                variant={dateFilter === 'before-yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateFilterChange('before-yesterday')}
              >
                Avant-hier
              </Button>

              {/* Calendrier personnalisé */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {dateFilter === 'custom' && customDate
                      ? format(customDate, 'dd/MM/yyyy')
                      : 'Date personnalisée'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={handleCustomDateSelect}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits ravitaillés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.statistics.uniqueProducts || 0}</div>
            <p className="text-xs text-muted-foreground">{dateFilterText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ravitaillé</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.statistics.totalRestocked || 0}</div>
            <p className="text-xs text-muted-foreground">unités au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opérations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.statistics.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground">ravitaillements</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des ravitaillements groupés par produit */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      ) : filteredRestocks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "Aucun ravitaillement trouvé pour cette recherche"
                : `Aucun ravitaillement pour ${dateFilterText.toLowerCase()}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestocks.map((group) => (
            <Card key={group.productId} className="overflow-hidden">
             

              <CardHeader>
                 {/* Image du produit */}
              <div className="relative h-24 w-1/4 bg-muted">
                {group.productImage ? (
                  <Image
                    src={group.productImage}
                    alt={group.productName}
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{group.productName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    {group.categoryName && (
                      <Badge variant="secondary">{group.categoryName}</Badge>
                    )}
                    <span className="text-sm font-semibold text-primary">
                      {group.productPrice % 1 === 0 ? group.productPrice : group.productPrice.toFixed(2)} FCFA
                    </span>
                  </CardDescription>
                </div>

                {/* Total ravitaillé */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total ravitaillé</span>
                    <Badge variant="default" className="gap-1">
                      <Package className="h-3 w-3" />
                      {group.totalQuantity} unité(s)
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Détail des ravitaillements ({group.restocks.length})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {group.restocks.map((restock) => (
                      <div
                        key={restock.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {format(new Date(restock.createdAt), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <Badge variant="outline">
                          +{restock.quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
