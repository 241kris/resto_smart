// ---------------------------------------
//  API Route: GET /api/orders/public/[id]
//  Récupère une commande publique par son ID
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/orders/public/[id]
 * Récupère une commande publique (sans authentification)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer la commande
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        customer: order.customer,
        items: order.items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant.name,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/public/[id]
 * Annule une commande publique (seulement si PENDING)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la commande peut être annulée
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Seules les commandes en attente peuvent être annulées' },
        { status: 400 }
      );
    }

    // Annuler la commande
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        totalAmount: updatedOrder.totalAmount,
        status: updatedOrder.status,
        customer: updatedOrder.customer,
        items: updatedOrder.items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        restaurantId: updatedOrder.restaurantId,
        restaurantName: updatedOrder.restaurant.name,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      },
      message: 'Commande annulée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
