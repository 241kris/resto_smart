// ---------------------------------------
//  API Route: /api/orders
//  Gestion des commandes
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
 * GET /api/orders?period=today|yesterday|day-before-yesterday
 * Récupère toutes les commandes de l'établissement (authentifié)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Récupérer le paramètre de période
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'today';

    // Calculer les dates selon la période
    const now = new Date();
    let startOfDay: Date;
    let endOfDay: Date;

    switch (period) {
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
        endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        break;
      case 'day-before-yesterday':
        const dayBeforeYesterday = new Date(now);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        startOfDay = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate(), 0, 0, 0, 0);
        endOfDay = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate(), 23, 59, 59, 999);
        break;
      case 'today':
      default:
        startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
    }

    // Récupérer toutes les commandes de l'établissement pour la période
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: user.establishment.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        table: order.table,
        customer: order.customer,
        items: order.items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      count: orders.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Crée une nouvelle commande depuis le menu public
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données du body
    const body = await request.json();
    const { restaurantId, tableToken, items } = body as {
      restaurantId: string
      tableToken: string
      items: OrderItemInput[]
    };

    // 2. Validation des données
    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID du restaurant est requis' },
        { status: 400 }
      );
    }

    if (!tableToken || typeof tableToken !== 'string') {
      return NextResponse.json(
        { error: 'Le token de la table est requis' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La commande doit contenir au moins un produit' },
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

    // 4. Trouver la table par son token
    const table = await prisma.table.findUnique({
      where: { tableToken }
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table introuvable' },
        { status: 404 }
      );
    }

    // 5. Vérifier que la table appartient au restaurant
    if (table.restaurantId !== restaurantId) {
      return NextResponse.json(
        { error: 'Cette table n\'appartient pas à ce restaurant' },
        { status: 400 }
      );
    }

    // 6. Vérifier que tous les produits existent et appartiennent au restaurant
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

    // 7. Calculer le montant total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 8. Créer la commande avec ses items
    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId: table.id,
        totalAmount,
        status: 'PENDING',
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
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // 9. Retourner la commande créée
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant.name,
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
