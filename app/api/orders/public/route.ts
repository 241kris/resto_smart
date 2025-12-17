// ---------------------------------------
//  API Route: POST /api/orders/public
//  Crée une commande depuis le menu public (sans table)
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CustomerData {
  firstName: string
  lastName: string
  phone: string
  address: string
}

interface OrderItemInput {
  productId: string
  quantity: number
  price: number
}

/**
 * POST /api/orders/public
 * Crée une nouvelle commande depuis le menu public (par slug, sans table)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données du body
    const body = await request.json();
    const { restaurantId, items, customer } = body as {
      restaurantId: string
      items: OrderItemInput[]
      customer: CustomerData
    };

    // 2. Validation des données
    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID du restaurant est requis' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La commande doit contenir au moins un produit' },
        { status: 400 }
      );
    }

    // Validation des données client
    if (!customer || typeof customer !== 'object') {
      return NextResponse.json(
        { error: 'Les informations du client sont requises' },
        { status: 400 }
      );
    }

    if (!customer.firstName || !customer.lastName || !customer.phone || !customer.address) {
      return NextResponse.json(
        { error: 'Prénom, nom, téléphone et adresse sont requis' },
        { status: 400 }
      );
    }

    // 3. Vérifier que le restaurant existe
    const restaurant = await prisma.establishment.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant introuvable' },
        { status: 404 }
      );
    }

    // 4. Vérifier que tous les produits existent et appartiennent au restaurant
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        establishmentId: restaurantId
      }
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Certains produits sont introuvables' },
        { status: 404 }
      );
    }

    // 5. Calculer le montant total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 6. Créer la commande avec ses items (sans table)
    const order = await prisma.order.create({
      data: {
        restaurant: {
          connect: {
            id: restaurantId
          }
        },
        totalAmount,
        status: 'PENDING',
        customer: customer as any, // Stocker les infos client dans la commande
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
        }
      }
    });

    // 7. Retourner la commande créée
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        customer: order.customer,
        items: order.items.map((item: any) => ({
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
    console.error('Erreur lors de la création de la commande:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la création de la commande',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
