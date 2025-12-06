// ---------------------------------------
//  API Route: /api/orders/[id]
//  Gestion d'une commande spécifique
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
);

/**
 * PATCH /api/orders/[id]
 * Met à jour le statut d'une commande
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérification du token JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const userId = payload.userId as string;

    // Récupérer l'établissement de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    });

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validation du statut
    const validStatuses = ['PENDING', 'completed', 'PAID', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide. Valeurs autorisées: PENDING, completed, PAID, CANCELLED' },
        { status: 400 }
      );
    }

    // Vérifier que la commande existe et appartient au restaurant
    const order = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: user.establishment.id
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            tableToken: true,
          }
        },
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        totalAmount: updatedOrder.totalAmount,
        status: updatedOrder.status,
        table: updatedOrder.table,
        items: updatedOrder.items,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      },
      message: 'Statut mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]
 * Supprime une commande (uniquement si PENDING ou PROCESSED)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérification du token JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const userId = payload.userId as string;

    // Récupérer l'établissement de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    });

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que la commande existe et appartient au restaurant
    const order = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: user.establishment.id
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que la commande peut être supprimée
    if (order.status === 'PAID' || order.status === 'completed') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une commande déjà payée ou complétée' },
        { status: 400 }
      );
    }

    // Supprimer la commande (cascade supprime aussi les items)
    await prisma.order.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Commande supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la commande:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
