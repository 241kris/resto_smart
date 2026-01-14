/**
 * API Route: /api/menu/dish-of-day
 * Gestion des plats du jour
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/menu/dish-of-day
 * Récupérer les plats du jour (avec option de date)
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

    // Récupérer la date depuis les query params (par défaut aujourd'hui)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    targetDate.setHours(0, 0, 0, 0)

    const dishesOfTheDay = await prisma.dishOfTheDay.findMany({
      where: {
        establishmentId: user.establishment.id,
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
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

    return NextResponse.json(
      { dishesOfTheDay },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération plats du jour:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/menu/dish-of-day
 * Créer un nouveau plat du jour
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
    const { productId, date, displayOrder, specialDescription } = body

    // Validation
    if (!productId || !date) {
      return NextResponse.json(
        { error: 'Produit et date requis' },
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

    // Créer le plat du jour
    const dishOfTheDay = await prisma.dishOfTheDay.create({
      data: {
        establishmentId: user.establishment.id,
        productId,
        date: new Date(date),
        displayOrder: displayOrder || 0,
        specialDescription: specialDescription || null
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
      { dishOfTheDay },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur création plat du jour:', error)

    // Gérer les erreurs de contrainte unique
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ce produit est déjà en plat du jour pour cette date' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/menu/dish-of-day?id=xxx
 * Supprimer un plat du jour
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

    // Vérifier que le plat du jour appartient à l'établissement
    const dishOfTheDay = await prisma.dishOfTheDay.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!dishOfTheDay) {
      return NextResponse.json(
        { error: 'Plat du jour introuvable' },
        { status: 404 }
      )
    }

    // Supprimer
    await prisma.dishOfTheDay.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Plat du jour supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression plat du jour:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
