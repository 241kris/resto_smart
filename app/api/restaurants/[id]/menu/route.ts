// ---------------------------------------
//  API Route: GET /api/restaurants/[id]/menu
//  Récupère le menu complet d'un restaurant (public)
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/restaurants/[id]/menu
 * Récupère les informations du restaurant, catégories et produits (route publique)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurantId = id;

    // 1. Récupérer les informations du restaurant
    const restaurant = await prisma.establishment.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image_cover: true,
      }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant introuvable' },
        { status: 404 }
      );
    }

    // 2. Récupérer toutes les catégories actives du restaurant
    const categories = await prisma.category.findMany({
      where: {
        establishmentId: restaurantId,
        deleted: false
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 3. Récupérer tous les produits du restaurant avec leurs catégories
    const products = await prisma.product.findMany({
      where: {
        establishmentId: restaurantId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 4. Retourner les données
    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        coverImage: restaurant.image_cover,
      },
      categories,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        categoryId: product.categoryId,
        category: product.category,
      })),
      totalProducts: products.length,
      totalCategories: categories.length,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du menu:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la récupération du menu',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
