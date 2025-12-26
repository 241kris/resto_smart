"use client"

import { Package, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface ProductStatCardProps {
  product: {
    productId: string
    productName: string
    productImage: string | null
    currentPrice: number
    totalQuantity: number
    totalRevenue: number
    orderCount: number
  }
  rank?: number
}

export function ProductStatCard({ product, rank }: ProductStatCardProps) {
  const isSold = product.totalQuantity > 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Image */}
          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {product.productName}
            </h3>
            {rank !== undefined && rank < 3 && product.totalRevenue > 0 && (
              <span className="text-xs text-orange-600 font-medium">
                {rank === 0 ? '🥇 Meilleur' : rank === 1 ? '🥈 2ème' : '🥉 3ème'}
              </span>
            )}
          </div>

          {/* Status */}
          <Badge
            variant={isSold ? "default" : "secondary"}
            className={isSold ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600"}
          >
            {isSold ? "Vendu" : "Non vendu"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Prix */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Prix unitaire</span>
          <span className="font-semibold">{product.currentPrice.toFixed(2)} FCFA</span>
        </div>

        {/* Quantité */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Quantité vendue</span>
          <span className={isSold ? "font-semibold text-blue-600" : "text-muted-foreground"}>
            {product.totalQuantity}
          </span>
        </div>

        {/* Nb commandes */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Nb commandes</span>
          <span className={isSold ? "font-semibold" : "text-muted-foreground"}>
            {product.orderCount}
          </span>
        </div>

        {/* Revenu */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            Revenu total
          </span>
          <span className={isSold ? "font-bold text-green-600" : "text-muted-foreground"}>
            {product.totalRevenue.toFixed(2)} FCFA
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
