import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * POST /api/restock
 * Créer un ravitaillement pour un produit quantifiable
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

    // Vérification du token JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    // Récupérer l'établissement de l'utilisateur
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
    const { productId, quantity } = body

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'L\'ID du produit est requis' },
        { status: 400 }
      )
    }

    if (quantity === undefined || quantity === null || quantity <= 0) {
      return NextResponse.json(
        { error: 'La quantité doit être un nombre positif' },
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

    // Vérifier que le produit est quantifiable
    if (!product.isQuantifiable) {
      return NextResponse.json(
        { error: 'Ce produit n\'est pas quantifiable' },
        { status: 400 }
      )
    }

    // Créer le ravitaillement et mettre à jour la quantité
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer l'historique de ravitaillement
      const restockHistory = await tx.restockHistory.create({
        data: {
          productId,
          quantity: parseInt(quantity)
        }
      })

      // 2. Mettre à jour la quantité du produit
      const currentQuantity = product.quantity || 0
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          quantity: currentQuantity + parseInt(quantity)
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return {
        restockHistory,
        product: updatedProduct
      }
    })

    return NextResponse.json(
      {
        message: 'Ravitaillement effectué avec succès',
        ...result
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors du ravitaillement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du ravitaillement' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/restock?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&productId=xxx
 * Récupérer l'historique des ravitaillements
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

    // Vérification du token JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    // Récupérer l'établissement de l'utilisateur
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const productId = searchParams.get('productId')

    // Construction de la clause where
    const where: any = {
      product: {
        establishmentId: user.establishment.id
      }
    }

    // Filtrer par produit si spécifié
    if (productId) {
      where.productId = productId
    }

    // Filtrer par période si spécifiée
    if (startDate || endDate) {
      where.createdAt = {}

      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }

      if (endDate) {
        // Ajouter 1 jour pour inclure toute la journée de fin
        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)
        where.createdAt.lt = end
      }
    }

    // Récupérer l'historique des ravitaillements
    const restockHistory = await prisma.restockHistory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            isQuantifiable: true,
            quantity: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculer les statistiques
    const totalRestocked = restockHistory.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueProducts = new Set(restockHistory.map(item => item.productId)).size

    return NextResponse.json(
      {
        restockHistory,
        statistics: {
          totalRestocked,
          uniqueProducts,
          totalRecords: restockHistory.length
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération historique ravitaillements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
