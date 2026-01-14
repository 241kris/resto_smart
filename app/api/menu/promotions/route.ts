/**
 * API Route: /api/menu/promotions
 * Gestion des promotions sur les produits
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/menu/promotions
 * Récupérer les promotions actives
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    // Récupérer le paramètre pour filtrer (active, all, upcoming, expired)
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'active'

    const now = new Date()

    let whereClause: any = {
      establishmentId: user.establishment.id
    }

    if (filter === 'active') {
      whereClause.isActive = true
      whereClause.startDate = { lte: now }
      whereClause.endDate = { gte: now }
    } else if (filter === 'upcoming') {
      whereClause.startDate = { gt: now }
    } else if (filter === 'expired') {
      whereClause.endDate = { lt: now }
    }
    // 'all' = pas de filtre supplémentaire

    const promotions = await prisma.promotion.findMany({
      where: whereClause,
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

    return NextResponse.json(
      { promotions },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération promotions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/menu/promotions
 * Créer une nouvelle promotion
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      productId,
      name,
      discountedPrice,
      startDate,
      endDate,
      daysOfWeek,
      startTime,
      endTime,
      displayOrder,
      description,
      badge
    } = body

    // Validation
    if (!productId || !name || !discountedPrice || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Champs requis: productId, name, discountedPrice, startDate, endDate' },
        { status: 400 }
      )
    }

    // Vérifier que le produit existe et appartient à l'établissement
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        establishmentId: user.establishment.id
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    // Calculer le pourcentage de réduction
    const discountPercent = ((product.price - discountedPrice) / product.price) * 100

    // Créer la promotion
    const promotion = await prisma.promotion.create({
      data: {
        establishmentId: user.establishment.id,
        productId,
        name,
        discountedPrice,
        discountPercent: Math.round(discountPercent * 100) / 100,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysOfWeek: daysOfWeek || null,
        startTime: startTime || null,
        endTime: endTime || null,
        displayOrder: displayOrder || 0,
        description: description || null,
        badge: badge || null
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(
      { promotion },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création promotion:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/menu/promotions?id=xxx
 * Mettre à jour une promotion
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    // Vérifier que la promotion appartient à l'établissement
    const existingPromotion = await prisma.promotion.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      },
      include: {
        product: true
      }
    })

    if (!existingPromotion) {
      return NextResponse.json(
        { error: 'Promotion introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      discountedPrice,
      startDate,
      endDate,
      daysOfWeek,
      startTime,
      endTime,
      displayOrder,
      isActive,
      description,
      badge
    } = body

    // Recalculer le pourcentage si le prix change
    let discountPercent = existingPromotion.discountPercent
    if (discountedPrice !== undefined) {
      discountPercent = ((existingPromotion.product.price - discountedPrice) / existingPromotion.product.price) * 100
      discountPercent = Math.round(discountPercent * 100) / 100
    }

    // Mettre à jour
    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        discountedPrice: discountedPrice !== undefined ? discountedPrice : undefined,
        discountPercent: discountedPrice !== undefined ? discountPercent : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        daysOfWeek: daysOfWeek !== undefined ? daysOfWeek : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        description: description !== undefined ? description : undefined,
        badge: badge !== undefined ? badge : undefined
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(
      { promotion },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur mise à jour promotion:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/menu/promotions?id=xxx
 * Supprimer une promotion
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    // Vérifier que la promotion appartient à l'établissement
    const promotion = await prisma.promotion.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion introuvable' },
        { status: 404 }
      )
    }

    // Supprimer
    await prisma.promotion.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Promotion supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression promotion:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
