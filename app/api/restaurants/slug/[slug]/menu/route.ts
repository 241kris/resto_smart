// ---------------------------------------
//  API Route: GET /api/restaurants/slug/[slug]/menu
//  Récupère le menu complet d'un restaurant par son slug (public)
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/restaurants/slug/[slug]/menu
 * Récupère les informations du restaurant, catégories et produits par slug (route publique)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Récupérer les informations du restaurant par slug
    const restaurant = await prisma.establishment.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        email: true,
        phones: true,
        images: true,
        address: true,
        latitude: true,
        longitude: true,
      }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant introuvable' },
        { status: 404 }
      );
    }

    // 2. Récupérer toutes les catégories actives du restaurant
    const categories = await prisma.category.findMany({
      where: {
        establishmentId: restaurant.id,
        deleted: false
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 3. Récupérer tous les produits actifs du restaurant avec leurs catégories
    const products = await prisma.product.findMany({
      where: {
        establishmentId: restaurant.id,
        status: true // Uniquement les produits disponibles
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 4. Récupérer les données du menu intelligent
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Plats du jour (aujourd'hui uniquement)
    const dishesOfTheDay = await prisma.dishOfTheDay.findMany({
      where: {
        establishmentId: restaurant.id,
        date: {
          gte: today,
          lt: tomorrow
        },
        isActive: true
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    })

    // Promotions actives
    const promotions = await prisma.promotion.findMany({
      where: {
        establishmentId: restaurant.id,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    })

    // Filtrer les promotions selon le jour et l'heure
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const activePromotions = promotions.filter(promo => {
      if (promo.daysOfWeek) {
        const allowedDays = promo.daysOfWeek as string[]
        if (!allowedDays.includes(currentDay)) {
          return false
        }
      }
      if (promo.startTime && promo.endTime) {
        if (currentTime < promo.startTime || currentTime > promo.endTime) {
          return false
        }
      }
      return true
    })

    // Recommandations actives
    const recommendations = await prisma.recommendation.findMany({
      where: {
        establishmentId: restaurant.id,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { displayOrder: 'asc' }
      ]
    })

    // 5. Enrichir les produits avec les données du menu intelligent
    const enrichedProducts = products.map(product => {
      const promotion = activePromotions.find(p => p.productId === product.id)
      const isDishOfDay = dishesOfTheDay.some(d => d.productId === product.id)
      const recommendation = recommendations.find(r => r.productId === product.id)

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        categoryId: product.categoryId,
        category: product.category,
        isQuantifiable: product.isQuantifiable,
        quantity: product.quantity,
        // Données enrichies
        promotion: promotion ? {
          id: promotion.id,
          name: promotion.name,
          discountedPrice: promotion.discountedPrice,
          discountPercent: promotion.discountPercent,
          badge: promotion.badge,
          description: promotion.description
        } : null,
        isDishOfDay,
        recommendation: recommendation ? {
          id: recommendation.id,
          type: recommendation.type,
          reason: recommendation.reason,
          badge: recommendation.badge,
          score: recommendation.score
        } : null
      }
    })

    // 6. Retourner les données
    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        email: restaurant.email,
        phones: restaurant.phones,
        images: restaurant.images,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      },
      categories,
      products: enrichedProducts,
      totalProducts: products.length,
      totalCategories: categories.length,
      // Données du menu intelligent
      dishesOfTheDay: dishesOfTheDay.map(d => ({
        id: d.id,
        product: d.product,
        specialDescription: d.specialDescription,
        displayOrder: d.displayOrder
      })),
      promotions: activePromotions.map(p => ({
        id: p.id,
        name: p.name,
        product: p.product,
        discountedPrice: p.discountedPrice,
        discountPercent: p.discountPercent,
        badge: p.badge,
        description: p.description,
        displayOrder: p.displayOrder
      })),
      recommendations: recommendations.map(r => ({
        id: r.id,
        type: r.type,
        product: r.product,
        reason: r.reason,
        badge: r.badge,
        score: r.score,
        displayOrder: r.displayOrder
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du menu:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la récupération du menu',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
