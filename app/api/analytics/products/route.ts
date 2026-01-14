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
    const period = searchParams.get('period') || 'today';
    const specificDate = searchParams.get('date');

    let startDate: Date;
    let endDate: Date = endOfDay(new Date());

    // Déterminer la période
    if (period === 'today') {
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    } else if (period === 'yesterday') {
      startDate = startOfDay(subDays(new Date(), 1));
      endDate = endOfDay(subDays(new Date(), 1));
    } else if (period === 'before_yesterday') {
      startDate = startOfDay(subDays(new Date(), 2));
      endDate = endOfDay(subDays(new Date(), 2));
    } else if (period === 'week') {
      // Semaine glissante (7 derniers jours incluant aujourd'hui)
      startDate = startOfDay(subDays(new Date(), 6));
      endDate = endOfDay(new Date());
    } else if (period === 'date' && specificDate) {
      const date = new Date(specificDate);
      startDate = startOfDay(date);
      endDate = endOfDay(date);
    } else if (period === '7days') {
      startDate = startOfDay(subDays(new Date(), 6));
    } else if (period.endsWith('months')) {
      const monthsCount = parseInt(period.replace('months', ''));
      startDate = startOfMonth(subMonths(new Date(), monthsCount - 1));
    } else {
      startDate = startOfDay(new Date());
    }

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
            isQuantifiable: true,
            quantity: true,
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
        isQuantifiable: boolean
        remainingQuantity: number | null
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
          isQuantifiable: item.product.isQuantifiable,
          remainingQuantity: item.product.quantity || 0,
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

    // Récupérer TOUS les produits de l'établissement pour inclure ceux qui n'ont pas été vendus
    const allProducts = await prisma.product.findMany({
      where: {
        establishmentId: user.establishment.id,
        status: true, // Uniquement les produits actifs
      },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        isQuantifiable: true,
        quantity: true,
      },
      orderBy: {
        name: 'asc',
      }
    });

    // Fusionner avec les statistiques (ajouter les produits invendus)
    const allProductsWithStats = allProducts.map(product => {
      if (productStats[product.id]) {
        return productStats[product.id];
      } else {
        // Produit non vendu sur la période
        return {
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          currentPrice: product.price,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
          isQuantifiable: product.isQuantifiable,
          remainingQuantity: product.quantity || 0,
        };
      }
    });

    // Trier : Produits quantifiables d'abord, puis par revenu décroissant
    const sortedProducts = [...allProductsWithStats].sort((a, b) => {
      if (a.isQuantifiable && !b.isQuantifiable) return -1;
      if (!a.isQuantifiable && b.isQuantifiable) return 1;
      return b.totalRevenue - a.totalRevenue;
    });

    // Calculer les totaux (uniquement produits vendus)
    const soldProducts = allProductsWithStats.filter(p => p.totalQuantity > 0);
    const totalQuantity = soldProducts.reduce((sum, p) => sum + p.totalQuantity, 0);
    const totalRevenue = soldProducts.reduce((sum, p) => sum + p.totalRevenue, 0);

    return NextResponse.json({
      success: true,
      period,
      startDate,
      endDate,
      summary: {
        totalProducts: soldProducts.length,
        totalQuantitySold: totalQuantity,
        totalRevenue,
        totalProductsInCatalog: allProducts.length,
      },
      products: sortedProducts,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques produits:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
