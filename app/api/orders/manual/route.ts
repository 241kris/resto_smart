/**
 * API Route: /api/orders/manual
 * Gestion des commandes manuelles (POS) avec support offline
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

interface ManualOrderItemInput {
  productId: string
  quantity: number
  price: number
  total: number
}

/**
 * POST /api/orders/manual
 * Crée une commande manuelle (POS) avec support du mode offline
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

    const establishment = user?.establishment
    if (!establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      tableId,
      totalAmount,
      status = 'PENDING',
      customer,
      items,
      localId
    } = body as {
      tableId?: string
      totalAmount: number
      status?: string
      customer?: any
      items: ManualOrderItemInput[]
      localId?: string
    }

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La commande doit contenir au moins un produit' },
        { status: 400 }
      )
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Montant total invalide' },
        { status: 400 }
      )
    }

    // Vérifier si une commande avec ce localId existe déjà
    // Vérifier si une commande avec ce localId existe déjà (Double sécurité)
    if (localId) {
      const existingOrder = await prisma.order.findUnique({
        where: { localId }
      })

      if (existingOrder) {
        return NextResponse.json(
          {
            code: 'DUPLICATE',
            message: 'Cette commande a déjà été synchronisée',
            order: {
              id: existingOrder.id,
              totalAmount: existingOrder.totalAmount,
              status: existingOrder.status,
              createdAt: existingOrder.createdAt
            }
          },
          { status: 409 }
        )
      }
    }

    // Use a transaction to ensure both order creation and stock reduction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      let newOrder
      try {
        newOrder = await tx.order.create({
          data: {
            restaurantId: establishment.id,
            localId: localId || null,
            tableId: tableId || null,
            totalAmount,
            status: status as any,
            customer: customer,
            items: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.total
              }))
            }
          },
          include: {
            items: true
          }
        })
      } catch (e: any) {
        // P2002 = Unique constraint failed
        if (e.code === 'P2002') {
          const existing = await tx.order.findUnique({ where: { localId: localId! } })
          if (existing) throw { code: 'DUPLICATE', order: existing }
        }
        throw e
      }

      // 2. Reduce stock for quantifiable products
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, isQuantifiable: true, quantity: true }
        })

        if (product && product.isQuantifiable && product.quantity !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          })
        }
      }

      return newOrder
    }).catch((e) => {
      // Re-throw if it's our custom duplicate error
      if (e.code === 'DUPLICATE') return e
      throw e
    })

    // Handle duplicate error from transaction
    if (order.code === 'DUPLICATE') {
      return NextResponse.json(
        {
          code: 'DUPLICATE',
          message: 'Cette commande a déjà été synchronisée',
          order: order.order
        },
        { status: 409 }
      )
    }

    // Fetch the full order with relations after transaction
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!fullOrder) throw new Error('Failed to fetch created order')

    return NextResponse.json(
      {
        success: true,
        order: {
          id: fullOrder.id,
          totalAmount: fullOrder.totalAmount,
          status: fullOrder.status,
          table: fullOrder.table,
          customer: fullOrder.customer,
          items: fullOrder.items.map(item => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          })),
          createdAt: fullOrder.createdAt
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création commande manuelle:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
