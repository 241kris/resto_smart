"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import Image from "next/image"
import { ShoppingCart, MapPin, Phone, Mail, Loader2, Minus, Plus, Receipt, Sparkles, Tag, Star, Flame, TrendingUp, Award, ChefHat } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRestaurantMenuBySlug } from "@/lib/hooks/useRestaurantMenuBySlug"
import { CartProvider, useCart } from "@/lib/contexts/CartContext"
import { ViewCartModal } from "@/components/ViewCartModal"
import { MyOrdersModal } from "@/components/MyOrdersModal"
import { ImageCarousel } from "@/components/ImageCarousel"
import { ImageThumbnails } from "@/components/ImageThumbnails"
import { getOrdersFromLocalStorage } from "@/lib/orderStorage"
import { toast } from "sonner"

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

function RestaurantMenuContent({ slug }: { slug: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [hasOrders, setHasOrders] = useState(false)

  const { data, isLoading, error } = useRestaurantMenuBySlug(slug)
  const { addItem, updateQuantity, removeItem, isInCart, totalItems, totalPrice, items } = useCart()

  // Vérifier s'il y a des commandes
  useEffect(() => {
    const checkOrders = () => {
      const orders = getOrdersFromLocalStorage()
      setHasOrders(orders.length > 0)
    }

    // Vérifier au chargement
    checkOrders()

    // Vérifier quand les modals se ferment
    if (!ordersOpen && !cartOpen) {
      checkOrders()
    }
  }, [ordersOpen, cartOpen])

  // Vérifier périodiquement les commandes (au cas où elles sont ajoutées)
  useEffect(() => {
    const interval = setInterval(() => {
      const orders = getOrdersFromLocalStorage()
      setHasOrders(orders.length > 0)
    }, 2000) // Vérifier toutes les 2 secondes

    return () => clearInterval(interval)
  }, [])

  const filteredProducts = (selectedCategory && data
    ? data.products.filter(product => product.categoryId === selectedCategory)
    : data?.products || []
  ).filter(product => {
    // Cacher les produits quantifiables avec stock insuffisant côté client
    if (product.isQuantifiable && (product.quantity ?? 0) <= 0) {
      return false
    }
    return true
  })

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

  const { restaurant, categories, dishesOfTheDay = [], promotions = [], recommendations = [] } = data

  const getProductQuantity = (productId: string) => {
    const item = items.find(i => i.productId === productId)
    return item?.quantity || 0
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section with Carousel - Élégant */}
      <div className="relative overflow-hidden">
        <ImageCarousel
          images={restaurant.images && restaurant.images.length > 0 ? restaurant.images : []}
          alt={restaurant.name}
          onIndexChange={setSelectedImageIndex}
          externalIndex={selectedImageIndex}
        />

        {/* Overlay gradient plus sophistiqué */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

        {/* Contenu avec design élégant */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-8 md:px-12 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Nom du restaurant avec style élégant */}
            <div className="mb-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 tracking-tight drop-shadow-2xl">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-white/90 text-base md:text-lg font-light max-w-2xl leading-relaxed">
                  {restaurant.description}
                </p>
              )}
            </div>

            {/* Informations de contact avec design moderne */}
            <div className="flex flex-wrap gap-4 md:gap-6">
              {restaurant.phones && restaurant.phones.length > 0 && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/20">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    {restaurant.phones.map((phone, index) => (
                      <a key={index} href={`tel:${phone}`} className="text-white font-medium text-sm hover:text-white/80 transition-colors">
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {restaurant.address && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/20">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium text-sm">
                    {typeof restaurant.address === 'string' ? restaurant.address : JSON.stringify(restaurant.address)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Miniatures des images */}
      <ImageThumbnails
        images={restaurant.images && restaurant.images.length > 0 ? restaurant.images : []}
        selectedIndex={selectedImageIndex}
        onSelect={setSelectedImageIndex}
      />

      {/* PLATS DU JOUR */}
      {dishesOfTheDay.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-amber-900">Plats du Jour</h2>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-2">
                {dishesOfTheDay.map((dish: any) => (
                  <Card key={dish.id} className="min-w-[280px] border-2 border-amber-200 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col h-full">
                      <div className="relative w-full h-40">
                        {dish.product.image ? (
                          dish.product.image.startsWith('data:') || dish.product.image.startsWith('/') ? (
                            <Image
                              src={dish.product.image}
                              alt={dish.product.name}
                              fill
                              className="object-cover"
                              unoptimized
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <img
                              src={dish.product.image}
                              alt={dish.product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          )
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Sparkles className="h-12 w-12 text-amber-400" />
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2 bg-amber-500 shadow-lg">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Plat du Jour
                        </Badge>
                      </div>
                      <CardContent className="flex-1 p-4">
                        <h3 className="font-semibold text-lg mb-2">{dish.product.name}</h3>
                        {dish.specialDescription && (
                          <p className="text-sm text-muted-foreground mb-3">{dish.specialDescription}</p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t">
                          <span className="text-sm font-bold text-amber-700">
                            {dish.product.price % 1 === 0 ? dish.product.price : dish.product.price.toFixed(2)} FCFA
                          </span>
                          <Button
                            size="sm"
                            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => addItem({
                              id: dish.product.id,
                              name: dish.product.name,
                              price: dish.product.price,
                              image: dish.product.image,
                            })}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Ajouter
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMOTIONS */}
      {promotions.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-6 w-6 text-rose-600" />
              <h2 className="text-sm font-semibold text-rose-900">Promotions en cours</h2>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-2">
                {promotions.map((promo: any) => (
                  <Card key={promo.id} className="min-w-[280px] border-2 border-rose-200 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col h-full">
                      <div className="relative w-full h-40">
                        {promo.product.image ? (
                          promo.product.image.startsWith('data:') || promo.product.image.startsWith('/') ? (
                            <Image
                              src={promo.product.image}
                              alt={promo.product.name}
                              fill
                              className="object-cover"
                              unoptimized
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <img
                              src={promo.product.image}
                              alt={promo.product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          )
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Tag className="h-12 w-12 text-rose-400" />
                          </div>
                        )}
                        <Badge variant="destructive" className="absolute top-2 left-2 shadow-lg">
                          <Tag className="h-3 w-3 mr-1" />
                          {promo.badge || `-${promo.discountPercent?.toFixed(0)}%`}
                        </Badge>
                      </div>
                      <CardContent className="flex-1 p-4">
                        <h3 className="font-semibold text-lg mb-1">{promo.product.name}</h3>
                        <p className="text-sm font-medium text-rose-600 mb-2">{promo.name}</p>
                        {promo.description && (
                          <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground line-through">
                              {promo.product.price % 1 === 0 ? promo.product.price : promo.product.price.toFixed(2)} FCFA
                            </span>
                            <span className="text-sm font-bold text-rose-700">
                              {promo.discountedPrice % 1 === 0 ? promo.discountedPrice : promo.discountedPrice.toFixed(2)} FCFA
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
                            onClick={() => addItem({
                              id: promo.product.id,
                              name: promo.product.name,
                              price: promo.discountedPrice,
                              image: promo.product.image,
                            })}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Ajouter
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMANDATIONS */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-emerald-600" />
              <h2 className="text-sm font-semibold text-emerald-900">Nos Recommandations</h2>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-2">
                {recommendations.map((rec: any) => {
                  const getRecommendationIcon = (type: string) => {
                    switch(type) {
                      case 'POPULAR': return <TrendingUp className="h-3 w-3 mr-1" />
                      case 'CHEF_CHOICE': return <ChefHat className="h-3 w-3 mr-1" />
                      case 'BEST_RATED': return <Award className="h-3 w-3 mr-1" />
                      case 'TRENDING': return <Flame className="h-3 w-3 mr-1" />
                      default: return <Star className="h-3 w-3 mr-1" />
                    }
                  }

                  const getRecommendationLabel = (type: string) => {
                    switch(type) {
                      case 'POPULAR': return 'Populaire'
                      case 'CHEF_CHOICE': return 'Choix du Chef'
                      case 'BEST_RATED': return 'Meilleur Note'
                      case 'TRENDING': return 'Tendance'
                      case 'SEASONAL': return 'De Saison'
                      case 'HOUSE_SPECIAL': return 'Spécialité Maison'
                      case 'NEW': return 'Nouveau'
                      default: return 'Recommandé'
                    }
                  }

                  return (
                    <Card key={rec.id} className="min-w-[280px] border-2 border-emerald-200 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col h-full">
                        <div className="relative w-full h-40">
                          {rec.product.image ? (
                            rec.product.image.startsWith('data:') || rec.product.image.startsWith('/') ? (
                              <Image
                                src={rec.product.image}
                                alt={rec.product.name}
                                fill
                                className="object-cover"
                                unoptimized
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <img
                                src={rec.product.image}
                                alt={rec.product.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                            )
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Star className="h-12 w-12 text-emerald-400" />
                            </div>
                          )}
                          <Badge className="absolute top-2 left-2 bg-emerald-500 shadow-lg">
                            {getRecommendationIcon(rec.type)}
                            {rec.badge || getRecommendationLabel(rec.type)}
                          </Badge>
                        </div>
                        <CardContent className="flex-1 p-4">
                          <h3 className="font-semibold text-lg mb-2">{rec.product.name}</h3>
                          {rec.reason && (
                            <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                          )}
                          <div className="flex items-center justify-between mt-auto pt-3 border-t">
                            <span className="text-sm font-bold text-emerald-700">
                              {rec.product.price % 1 === 0 ? rec.product.price : rec.product.price.toFixed(2)} FCFA
                            </span>
                            <Button
                              size="sm"
                              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => addItem({
                                id: rec.product.id,
                                name: rec.product.name,
                                price: rec.product.price,
                                image: rec.product.image,
                              })}
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Ajouter
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <div className="relative w-full h-40">
                    {product.image ? (
                      product.image.startsWith('data:') || product.image.startsWith('/') ? (
                        <Image
                          src={product.image || "/default-product.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                          referrerPolicy="no-referrer"
                        />

                      ) : (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Badges pour les menus spéciaux */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isDishOfDay && (
                        <Badge className="bg-amber-500 shadow-lg text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Plat du Jour
                        </Badge>
                      )}
                      {product.promotion && (
                        <Badge variant="destructive" className="shadow-lg text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.promotion.badge || `-${product.promotion.discountPercent?.toFixed(0)}%`}
                        </Badge>
                      )}
                      {product.recommendation && (
                        <Badge className="bg-emerald-500 shadow-lg text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {product.recommendation.badge || (
                            product.recommendation.type === 'POPULAR' ? 'Populaire' :
                            product.recommendation.type === 'CHEF_CHOICE' ? 'Choix du Chef' :
                            product.recommendation.type === 'BEST_RATED' ? 'Meilleur Note' :
                            product.recommendation.type === 'TRENDING' ? 'Tendance' :
                            product.recommendation.type === 'SEASONAL' ? 'De Saison' :
                            product.recommendation.type === 'HOUSE_SPECIAL' ? 'Spécialité' :
                            product.recommendation.type === 'NEW' ? 'Nouveau' :
                            'Recommandé'
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-base mb-2">{product.name}</h3>

                    </div>

                    <div className="flex flex-col items-start justify-between mt-auto pt-4 border-gray-400 border-t gap-2">
                      {/* Prix avec promotion si applicable */}
                      {product.promotion ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground line-through">
                            {product.price % 1 === 0 ? product.price : product.price.toFixed(2)} FCFA
                          </span>
                          <span className="text-base font-semibold text-rose-600">
                            {product.promotion.discountedPrice % 1 === 0 ? product.promotion.discountedPrice : product.promotion.discountedPrice.toFixed(2)} FCFA
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-semibold text-primary">
                          {product.price % 1 === 0 ? product.price : product.price.toFixed(2)} FCFA
                        </span>
                      )}

                      {!inCart ? (
                        <Button
                          size="sm"
                          className="gap-2 font-normal w-full bg-orange-400 hover:bg-orange-300 text-gray-900 rounded-3xl"
                          onClick={() => addItem({
                            id: product.id,
                            name: product.name,
                            price: product.promotion ? product.promotion.discountedPrice : product.price,
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
                            onClick={() => {
                              // Bloquer si quantité demandée dépasse le stock disponible
                              if (product.isQuantifiable && (product.quantity ?? 0) < quantity + 1) {
                                toast.error("Désolé, quantité demandée indisponible")
                                return
                              }
                              updateQuantity(product.id, quantity + 1)
                            }}
                            disabled={product.isQuantifiable && (product.quantity ?? 0) <= quantity}
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
            className="rounded-full shadow-2xl h-16 px-6 gap-3 hover:scale-105 transition-transform border-gray-50 bg-orange-400 hover:bg-orange-300 text-gray-900"
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
              <span className="text-base font-bold">{totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2)} FCFA</span>
            </div>
          </Button>
        </div>
      )}

      {/* Modal Panier */}
      <ViewCartModal
        open={cartOpen}
        onOpenChange={setCartOpen}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
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

export default function RestaurantMenuPage({ params }: PageProps) {
  const { slug } = use(params)

  return (
    <CartProvider>
      <RestaurantMenuContent slug={slug} />
    </CartProvider>
  )
}
