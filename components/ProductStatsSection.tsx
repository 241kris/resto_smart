"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, ShoppingCart, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { Bar } from 'react-chartjs-2'

interface ProductStats {
  productId: string
  productName: string
  productImage: string | null
  currentPrice: number
  totalQuantity: number
  totalRevenue: number
  orderCount: number
}

interface ProductsData {
  success: boolean
  period: string
  startDate: string
  endDate: string
  summary: {
    totalProducts: number
    totalQuantitySold: number
    totalRevenue: number
  }
  products: ProductStats[]
  top10: ProductStats[]
}

interface ProductStatsSectionProps {
  period: string
}

export function ProductStatsSection({ period }: ProductStatsSectionProps) {
  // Récupérer les données des produits
  const { data, isLoading, error } = useQuery<ProductsData>({
    queryKey: ['analytics', 'products', period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/products?period=${period}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données')
      }
      return response.json()
    }
  })

  // Préparer les données pour le graphique Top 10 (revenus)
  const top10RevenueChartData = {
    labels: data?.top10.map(p => p.productName.substring(0, 20)) || [],
    datasets: [
      {
        label: 'Revenu (FCFA)',
        data: data?.top10.map(p => p.totalRevenue) || [],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
      },
    ],
  }

  // Préparer les données pour le graphique Top 10 (quantités)
  const top10QuantityChartData = {
    labels: data?.top10.map(p => p.productName.substring(0, 20)) || [],
    datasets: [
      {
        label: 'Quantité vendue',
        data: data?.top10.map(p => p.totalQuantity) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <p>Erreur lors du chargement des statistiques produits</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <>
      {/* Statistiques globales des produits */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Vendus</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {data.summary.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Plats différents vendus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantité Totale</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {data.summary.totalQuantitySold}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Plats vendus au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {data.summary.totalRevenue.toFixed(2)} FCFA
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Chiffre d'affaires des plats
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques Top 10 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Revenus</CardTitle>
            <CardDescription>
              Les 10 plats qui génèrent le plus de revenus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <Bar data={top10RevenueChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Quantités</CardTitle>
            <CardDescription>
              Les 10 plats les plus vendus en quantité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <Bar data={top10QuantityChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

    
    </>
  )
}
