"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
 
import { ProductStatsSection } from "@/components/ProductStatsSection"

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface SalesData {
  success: boolean
  period: string
  startDate: string
  endDate: string
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
  }
  chartData: Array<{
    label: string
    count: number
    total: number
  }>
}

import { format, subDays, startOfWeek, endOfWeek } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>("today")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return format(new Date(), "d MMMM yyyy", { locale: fr })
      case 'yesterday':
        return format(subDays(new Date(), 1), "d MMMM yyyy", { locale: fr })
      case 'before_yesterday':
        return format(subDays(new Date(), 2), "d MMMM yyyy", { locale: fr })
      case 'week':
        const start = subDays(new Date(), 6)
        const end = new Date()
        return `${format(start, "d MMM", { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`
      case 'date':
        return format(selectedDate, "d MMMM yyyy", { locale: fr })
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventaire</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des ventes et stocks par produit
          </p>
        </div>

        {/* Filtres de période */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="yesterday">Hier</SelectItem>
              <SelectItem value="before_yesterday">Avant-hier</SelectItem>
              <SelectItem value="week">La semaine</SelectItem>
              <SelectItem value="date">Date précise</SelectItem>
            </SelectContent>
          </Select>

          {period === 'date' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Affichage de la période sélectionnée */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-primary">Période : {getPeriodLabel()}</span>
        <Badge variant="outline" className="bg-background">
          {period === 'today' ? "Direct" : "Historique"}
        </Badge>
      </div>

      {/* Contenu de l'inventaire */}
      <ProductStatsSection
        period={period}
        date={period === 'date' ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />
    </div>
  )
}
