/**
 * API Route: /api/menu/recommendations
 * Gestion des recommandations intelligentes
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/menu/recommendations
 * Récupérer les recommandations actives
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

    // Récupérer le paramètre pour filtrer par type (optionnel)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const now = new Date()

    let whereClause: any = {
      establishmentId: user.establishment.id,
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
    }

    if (type) {
      whereClause.type = type
    }

    const recommendations = await prisma.recommendation.findMany({
      where: whereClause,
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

    return NextResponse.json(
      { recommendations },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération recommandations:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/menu/recommendations
 * Créer une nouvelle recommandation
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
      type,
      reason,
      score,
      displayOrder,
      startDate,
      endDate,
      badge
    } = body

    // Validation
    if (!productId || !type) {
      return NextResponse.json(
        { error: 'Champs requis: productId, type' },
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

    // Créer la recommandation
    const recommendation = await prisma.recommendation.create({
      data: {
        establishmentId: user.establishment.id,
        productId,
        type,
        reason: reason || null,
        score: score || 0,
        displayOrder: displayOrder || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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
      { recommendation },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création recommandation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/menu/recommendations?id=xxx
 * Mettre à jour une recommandation
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

    // Vérifier que la recommandation appartient à l'établissement
    const existingRecommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!existingRecommendation) {
      return NextResponse.json(
        { error: 'Recommandation introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      type,
      reason,
      score,
      displayOrder,
      startDate,
      endDate,
      isActive,
      badge
    } = body

    // Mettre à jour
    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: {
        type: type !== undefined ? type : undefined,
        reason: reason !== undefined ? reason : undefined,
        score: score !== undefined ? score : undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
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
      { recommendation },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur mise à jour recommandation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/menu/recommendations?id=xxx
 * Supprimer une recommandation
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

    // Vérifier que la recommandation appartient à l'établissement
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommandation introuvable' },
        { status: 404 }
      )
    }

    // Supprimer
    await prisma.recommendation.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Recommandation supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression recommandation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
