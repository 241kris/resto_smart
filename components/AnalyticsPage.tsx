"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, ShoppingCart, BarChart3, Loader2, Package } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
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
import { Line, Bar } from 'react-chartjs-2'
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>("7days")
  const [monthsCount, setMonthsCount] = useState<string>("3")
  const [activeTab, setActiveTab] = useState<'global' | 'products'>('global')

  // Récupérer les données de ventes
  const { data, isLoading, error } = useQuery<SalesData>({
    queryKey: ['analytics', 'sales', period === 'months' ? `${monthsCount}months` : period],
    queryFn: async () => {
      const periodParam = period === 'months' ? `${monthsCount}months` : period
      const response = await fetch(`/api/analytics/sales?period=${periodParam}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données')
      }
      return response.json()
    }
  })

  // Préparer les données pour le graphique de revenus
  const revenueChartData = {
    labels: data?.chartData.map(d => d.label) || [],
    datasets: [
      {
        label: 'Revenus (FCFA)',
        data: data?.chartData.map(d => d.total) || [],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  // Préparer les données pour le graphique de commandes
  const ordersChartData = {
    labels: data?.chartData.map(d => d.label) || [],
    datasets: [
      {
        label: 'Nombre de commandes',
        data: data?.chartData.map(d => d.count) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Statistiques de ventes</h1>
          <p className="text-sm text-muted-foreground">
            Analysez vos performances de ventes (factures payées uniquement)
          </p>
        </div>

        {/* Sélection de période - Responsive */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sélectionner période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="months">X derniers mois</SelectItem>
            </SelectContent>
          </Select>

          {period === 'months' && (
            <Select value={monthsCount} onValueChange={setMonthsCount}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} mois
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Tabs - Responsive */}
      <div className="border-b border-border -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'global'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm sm:text-base">Vue Globale</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Package className="h-4 w-4" />
              <span className="text-sm sm:text-base">Par Produit</span>
            </div>
          </button>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'global' ? (
        <>
          {/* Cartes de résumé - Vue Globale */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <p>Erreur lors du chargement des statistiques</p>
                </div>
              </CardContent>
            </Card>
          ) : data && (
        <>
          {/* Statistiques globales - Scrollable sur mobile */}
          <div className="relative -mx-4 sm:mx-0">
            <div className="overflow-x-auto px-4 sm:px-0 pb-2 sm:pb-0">
              <div className="flex sm:grid sm:grid-cols-3 gap-4 min-w-max sm:min-w-0">
                <Card className="min-w-[200px] sm:min-w-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {data.summary.totalRevenue.toFixed(2)} FCFA
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {period === '7days' ? '7 derniers jours' : `${monthsCount} derniers mois`}
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-[200px] sm:min-w-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commandes Payées</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {data.summary.totalOrders}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Factures avec statut PAID
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-[200px] sm:min-w-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {data.summary.averageOrderValue.toFixed(2)} FCFA
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Moyenne par commande
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Graphiques - Responsive */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Graphique des revenus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Évolution des Revenus
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Revenus générés par les commandes payées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px]">
                  <Line data={revenueChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Graphique des commandes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  Nombre de Commandes
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Volume de commandes payées sur la période
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px]">
                  <Bar data={ordersChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>


        </>
          )}
        </>
      ) : (
        <ProductStatsSection period={period === 'months' ? `${monthsCount}months` : period} />
      )}
    </div>
  )
}
