/**
 * API Route: /api/menu/public/[slug]
 * Route publique pour récupérer le menu complet d'un établissement
 * avec plats du jour, promotions et recommandations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/menu/public/[slug]
 * Récupérer le menu complet (produits + plats du jour + promotions + recommandations)
 * Route publique - pas d'authentification requise
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug requis' },
        { status: 400 }
      )
    }

    // Trouver l'établissement par slug
    const establishment = await prisma.establishment.findFirst({
      where: { slug }
    })

    if (!establishment) {
      return NextResponse.json(
        { error: 'Établissement introuvable' },
        { status: 404 }
      )
    }

    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. Récupérer tous les produits actifs avec leurs catégories
    const products = await prisma.product.findMany({
      where: {
        establishmentId: establishment.id,
        status: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // 2. Récupérer les plats du jour (aujourd'hui)
    const dishesOfTheDay = await prisma.dishOfTheDay.findMany({
      where: {
        establishmentId: establishment.id,
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

    // 3. Récupérer les promotions actives
    const promotions = await prisma.promotion.findMany({
      where: {
        establishmentId: establishment.id,
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

    // Filtrer les promotions selon le jour de la semaine et l'heure (si spécifié)
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const activePromotions = promotions.filter(promo => {
      // Vérifier les jours de la semaine si spécifié
      if (promo.daysOfWeek) {
        const allowedDays = promo.daysOfWeek as string[]
        if (!allowedDays.includes(currentDay)) {
          return false
        }
      }

      // Vérifier les heures si spécifié
      if (promo.startTime && promo.endTime) {
        if (currentTime < promo.startTime || currentTime > promo.endTime) {
          return false
        }
      }

      return true
    })

    // 4. Récupérer les recommandations actives
    const recommendations = await prisma.recommendation.findMany({
      where: {
        establishmentId: establishment.id,
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

    // 5. Enrichir les produits avec les infos de promotion
    const enrichedProducts = products.map(product => {
      const promotion = activePromotions.find(p => p.productId === product.id)
      const isDishOfDay = dishesOfTheDay.some(d => d.productId === product.id)
      const recommendation = recommendations.find(r => r.productId === product.id)

      return {
        ...product,
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

    // 6. Grouper les produits par catégorie
    const categories = Array.from(
      new Set(enrichedProducts.map(p => p.category?.id).filter(Boolean))
    ).map(categoryId => {
      const category = enrichedProducts.find(p => p.category?.id === categoryId)?.category
      return {
        id: category?.id,
        name: category?.name,
        products: enrichedProducts.filter(p => p.category?.id === categoryId)
      }
    })

    // Ajouter les produits sans catégorie
    const uncategorizedProducts = enrichedProducts.filter(p => !p.category)
    if (uncategorizedProducts.length > 0) {
      categories.push({
        id: null,
        name: 'Autres',
        products: uncategorizedProducts
      })
    }

    // 7. Retourner le menu complet
    return NextResponse.json(
      {
        establishment: {
          id: establishment.id,
          name: establishment.name,
          slug: establishment.slug,
          description: establishment.description
        },
        categories,
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
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération menu public:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
