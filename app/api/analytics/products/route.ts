// ---------------------------------------
//  API Route: /api/analytics/products
//  Récupère les statistiques de ventes par produit
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth } from 'date-fns';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
);

/**
 * GET /api/analytics/products?period=7days|Xmonths
 * Récupère les statistiques de ventes par produit pour la période spécifiée
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

    // Récupérer les paramètres de la requête
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7days';

    let startDate: Date;

    // Déterminer la période
    if (period === '7days') {
      startDate = startOfDay(subDays(new Date(), 6));
    } else if (period.endsWith('months')) {
      const monthsCount = parseInt(period.replace('months', ''));
      if (isNaN(monthsCount) || monthsCount < 1 || monthsCount > 12) {
        return NextResponse.json(
          { error: 'Nombre de mois invalide (1-12)' },
          { status: 400 }
        );
      }
      startDate = startOfMonth(subMonths(new Date(), monthsCount - 1));
    } else {
      return NextResponse.json(
        { error: 'Période invalide' },
        { status: 400 }
      );
    }

    const endDate = endOfDay(new Date());

    // Récupérer tous les items de commandes PAID de la période
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId: user.establishment.id,
          status: 'PAID',
          createdAt: {
            gte: startDate,
            lte: endDate,
          }
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
          }
        }
      }
    });

    // Grouper les données par produit
    const productStats: {
      [productId: string]: {
        productId: string
        productName: string
        productImage: string | null
        currentPrice: number
        totalQuantity: number
        totalRevenue: number
        orderCount: number
      }
    } = {};

    // Compter les commandes uniques par produit
    const ordersByProduct: { [productId: string]: Set<string> } = {};

    orderItems.forEach(item => {
      const productId = item.product.id;

      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          productName: item.product.name,
          productImage: item.product.image,
          currentPrice: item.product.price,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
        };
        ordersByProduct[productId] = new Set();
      }

      productStats[productId].totalQuantity += item.quantity;
      productStats[productId].totalRevenue += item.total;
      ordersByProduct[productId].add(item.orderId);
    });

    // Mettre à jour le nombre de commandes uniques
    Object.keys(productStats).forEach(productId => {
      productStats[productId].orderCount = ordersByProduct[productId].size;
    });

    // Convertir en tableau et trier par revenu décroissant
    const productsArray = Object.values(productStats).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculer les totaux
    const totalQuantity = productsArray.reduce((sum, p) => sum + p.totalQuantity, 0);
    const totalRevenue = productsArray.reduce((sum, p) => sum + p.totalRevenue, 0);

    // Top 10 produits
    const top10Products = productsArray.slice(0, 10);

    return NextResponse.json({
      success: true,
      period,
      startDate,
      endDate,
      summary: {
        totalProducts: productsArray.length,
        totalQuantitySold: totalQuantity,
        totalRevenue,
      },
      products: productsArray,
      top10: top10Products,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques produits:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
