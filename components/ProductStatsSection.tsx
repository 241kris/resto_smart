"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
    totalProductsInCatalog: number
  }
  products: ProductStats[]
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

  // Préparer les données pour les graphiques (tous les produits, limités à 20 pour la lisibilité)
  const top20Products = data?.products.slice(0, 20) || []

  const revenueChartData = {
    labels: top20Products.map(p => p.productName.length > 25 ? p.productName.substring(0, 25) + '...' : p.productName),
    datasets: [
      {
        label: 'Revenu (FCFA)',
        data: top20Products.map(p => p.totalRevenue),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
      },
    ],
  }

  const quantityChartData = {
    labels: top20Products.map(p => p.productName.length > 25 ? p.productName.substring(0, 25) + '...' : p.productName),
    datasets: [
      {
        label: 'Quantité vendue',
        data: top20Products.map(p => p.totalQuantity),
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
              {data.summary.totalProducts} / {data.summary.totalProductsInCatalog}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Plats différents vendus / Total catalogue
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

      {/* Graphiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Produit</CardTitle>
            <CardDescription>
              {data.products.length > 20 ? 'Top 20 des produits qui génèrent le plus de revenus' : 'Tous les produits'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <Bar data={revenueChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quantités Vendues</CardTitle>
            <CardDescription>
              {data.products.length > 20 ? 'Top 20 des produits les plus vendus en quantité' : 'Tous les produits'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <Bar data={quantityChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé de tous les produits */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par Produit</CardTitle>
          <CardDescription>
            Liste complète de tous les produits avec leurs statistiques de vente ({data.products.length} produits)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Qté Vendue</TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                  <TableHead className="text-right">Revenu Total</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  data.products.map((product, index) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                          {product.productImage ? (
                            <Image
                              src={product.productImage}
                              alt={product.productName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{product.productName}</span>
                          {index < 3 && product.totalRevenue > 0 && (
                            <span className="text-xs text-orange-600">
                              {index === 0 ? '🥇 Meilleur' : index === 1 ? '🥈 2ème' : '🥉 3ème'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {product.currentPrice.toFixed(2)} FCFA
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={product.totalQuantity > 0 ? 'font-semibold text-blue-600' : 'text-muted-foreground'}>
                          {product.totalQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={product.orderCount > 0 ? 'font-medium' : 'text-muted-foreground'}>
                          {product.orderCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={product.totalRevenue > 0 ? 'font-bold text-green-600' : 'text-muted-foreground'}>
                          {product.totalRevenue.toFixed(2)} FCFA
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {product.totalQuantity > 0 ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                            Vendu
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            Non vendu
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
