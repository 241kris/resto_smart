// ---------------------------------------
//  API Route: /api/orders/manual
//  Création de commandes manuelles depuis l'admin
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
);

interface OrderItemInput {
  productId: string
  quantity: number
  price: number
}

/**
 * POST /api/orders/manual
 * Crée une nouvelle commande manuelle depuis l'admin
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
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

    // 2. Récupérer les données du body
    const body = await request.json();
    const { items, tableId, status } = body as {
      items: OrderItemInput[]
      tableId?: string
      status: 'completed' | 'PAID'
    };

    // 3. Validation des données
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La commande doit contenir au moins un produit' },
        { status: 400 }
      );
    }

    if (!status || (status !== 'completed' && status !== 'PAID')) {
      return NextResponse.json(
        { error: 'Le statut doit être "completed" (traité) ou "PAID" (payé)' },
        { status: 400 }
      );
    }

    // 4. Si une table est fournie, vérifier qu'elle existe et appartient au restaurant
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId }
      });

      if (!table) {
        return NextResponse.json(
          { error: 'Table introuvable' },
          { status: 404 }
        );
      }

      if (table.restaurantId !== user.establishment.id) {
        return NextResponse.json(
          { error: 'Cette table n\'appartient pas à votre restaurant' },
          { status: 400 }
        );
      }
    }

    // 5. Vérifier que tous les produits existent et appartiennent au restaurant
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        establishmentId: user.establishment.id
      }
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Certains produits sont introuvables ou n\'appartiennent pas à votre restaurant' },
        { status: 404 }
      );
    }

    // 6. Calculer le montant total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 7. Créer la commande avec ses items et gérer le stock
    const order = await prisma.$transaction(async (tx) => {
      // Si le statut est PAID, déduire le stock des produits quantifiables
      if (status === 'PAID') {
        for (const item of items) {
          const product = products.find(p => p.id === item.productId);

          if (product?.isQuantifiable) {
            const currentStock = product.quantity ?? 0;

            // Vérifier si le stock est suffisant
            if (currentStock < item.quantity) {
              throw new Error(
                `Stock insuffisant pour "${product.name}". Stock disponible: ${currentStock}, quantité demandée: ${item.quantity}`
              );
            }

            // Déduire la quantité du stock
            await tx.product.update({
              where: { id: product.id },
              data: {
                quantity: currentStock - item.quantity
              }
            });
          }
        }
      }

      // Créer la commande
      return await tx.order.create({
        data: {
          restaurantId: user.establishment!.id,
          tableId: tableId || null,
          totalAmount,
          status,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            }))
          }
        },
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
          table: {
            select: {
              id: true,
              name: true,
              tableToken: true,
            }
          }
        }
      });
    });

    // 8. Retourner la commande créée
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        table: order.table,
        items: order.items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        createdAt: order.createdAt,
      },
      message: 'Commande créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la commande manuelle:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la création de la commande',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
