"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import Image from "next/image"
import { ShoppingCart, MapPin, Phone, Mail, Loader2, Minus, Plus, Receipt } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRestaurantMenu } from "@/lib/hooks/useRestaurantMenu"
import { CartProvider, useCart } from "@/lib/contexts/CartContext"
import { CartModal } from "@/components/CartModal"
import { MyOrdersModal } from "@/components/MyOrdersModal"
import { ImageCarousel } from "@/components/ImageCarousel"
import { ImageThumbnails } from "@/components/ImageThumbnails"
import { getOrdersFromLocalStorage } from "@/lib/orderStorage"

interface PageProps {
  params: Promise<{
    restaurantId: string
    tableToken: string
  }>
}

function TableMenuContent({ restaurantId, tableToken }: { restaurantId: string; tableToken: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [hasOrders, setHasOrders] = useState(false)

  const { data, isLoading, error } = useRestaurantMenu(restaurantId)
  const { addItem, updateQuantity, removeItem, isInCart, totalItems, totalPrice, items } = useCart()

  // Vérifier s'il y a des commandes
  useEffect(() => {
    const checkOrders = () => {
      const orders = getOrdersFromLocalStorage()
      setHasOrders(orders.length > 0)
    }
    checkOrders()
    // Revérifier quand la modal se ferme
    if (!ordersOpen) {
      checkOrders()
    }
  }, [ordersOpen])

  const filteredProducts = selectedCategory && data
    ? data.products.filter(product => product.categoryId === selectedCategory)
    : data?.products || []

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement du menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <ShoppingCart className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Erreur</h2>
          <p className="text-muted-foreground">
            Impossible de charger le menu du restaurant. Veuillez réessayer.
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { restaurant, categories } = data

  const getProductQuantity = (productId: string) => {
    const item = items.find(i => i.productId === productId)
    return item?.quantity || 0
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section with Carousel */}
      <div className="relative">
        <ImageCarousel
          images={restaurant.images && restaurant.images.length > 0 ? restaurant.images : []}
          alt={restaurant.name}
          onIndexChange={setSelectedImageIndex}
          externalIndex={selectedImageIndex}
        />

        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <h1 className="text-4xl md:text-5xl   text-white mb-3" style={{ fontFamily: 'var(--font-modak)' }}>
            {restaurant.name}
          </h1>
          <div className="flex flex-row gap-3 items-baseline   text-white/90">

            {restaurant.phones && restaurant.phones.length > 0 && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  {restaurant.phones.map((phone, index) => (
                    <span key={index} className="text-sm underline md:text-base">{phone}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm md:text-base">
                {typeof restaurant.address === 'string' ? restaurant.address : JSON.stringify(restaurant.address)}
              </span>
            </div>
            {restaurant.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm md:text-base">{restaurant.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Miniatures des images */}
      <ImageThumbnails
        images={restaurant.images && restaurant.images.length > 0 ? restaurant.images : []}
        selectedIndex={selectedImageIndex}
        onSelect={setSelectedImageIndex}
      />

      {/* Catégories Scrollables */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-gray-300">
        <div className="container mx-auto">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 py-4 min-w-max">
              <Badge
                variant={selectedCategory === null ? "default" : "secondary"}
                className="cursor-pointer px-6 py-2.5 text-sm font-normal whitespace-nowrap hover:scale-105 transition-transform"
                onClick={() => setSelectedCategory(null)}
              >
                Tous les produits
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "secondary"}
                  className="cursor-pointer px-3 py-2.5 text-sm font-normal whitespace-nowrap hover:scale-105 transition-transform"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grille de Produits */}
      <div className="container mx-auto px-2 py-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredProducts.map((product) => {
            const quantity = getProductQuantity(product.id)
            const inCart = isInCart(product.id)

            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col h-full">
                  <div className="relative w-full h-38">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <CardContent className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-base mb-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start justify-between mt-auto pt-4 border-gray-400 border-t gap-2">
                      <span className="text-base font-semibold text-primary">
                        {product.price.toFixed(2)} FCFA
                      </span>

                      {!inCart ? (
                        <Button
                          size="sm"
                          className="gap-2 font-normal w-full bg-orange-400 hover:bg-orange-300 text-gray-900 rounded-3xl"
                          onClick={() => addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image,
                          })}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Ajouter
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <Button

                            size="icon"
                            className="h-9 w-9 rounded-full bg-emerald-700 hover:bg-emerald-600"
                            onClick={() => {
                              if (quantity === 1) {
                                removeItem(product.id)
                              } else {
                                updateQuantity(product.id, quantity - 1)
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-semibold flex-1 text-center">{quantity}</span>
                          <Button

                            size="icon"
                            className="h-9 w-9 rounded-full bg-emerald-700 hover:bg-emerald-600"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              {selectedCategory
                ? "Il n'y a pas de produits dans cette catégorie pour le moment."
                : "Le menu n'est pas encore disponible."}
            </p>
          </div>
        )}
      </div>

      {/* Bouton Mes Commandes */}
      {hasOrders && (
        <div className="fixed bottom-6 left-6 z-40">
          <Button
            className="rounded-full shadow-2xl h-14 px-5 gap-2 hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setOrdersOpen(true)}
          >
            <Receipt className="h-5 w-5" />
            <span className="text-sm font-semibold">Mes Commandes</span>
          </Button>
        </div>
      )}

      {/* Bouton Panier Flottant */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button

            className="rounded-full shadow-2xl h-16 px-6 gap-3 hover:scale-105 transition-transform border-gray-50 bg-orange-400 hover:bg-orange-300   text-gray-900"
            onClick={() => setCartOpen(true)}
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-normal opacity-90">Voir le panier</span>
              <span className="text-base font-bold">{totalPrice.toFixed(2)} FCFA</span>
            </div>
          </Button>
        </div>
      )}

      {/* Modal Panier */}
      <CartModal
        open={cartOpen}
        onOpenChange={setCartOpen}
        restaurantId={restaurantId}
        tableToken={tableToken}
      />

      {/* Modal Mes Commandes */}
      <MyOrdersModal
        open={ordersOpen}
        onOpenChange={setOrdersOpen}
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default function TableMenuPage({ params }: PageProps) {
  const { restaurantId, tableToken } = use(params)

  return (
    <CartProvider>
      <TableMenuContent restaurantId={restaurantId} tableToken={tableToken} />
    </CartProvider>
  )
}
