// ---------------------------------------
//  API Route: GET /api/restaurants/slug/[slug]/menu
//  Récupère le menu complet d'un restaurant par son slug (public)
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/restaurants/slug/[slug]/menu
 * Récupère les informations du restaurant, catégories et produits par slug (route publique)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Récupérer les informations du restaurant par slug
    const restaurant = await prisma.establishment.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        email: true,
        phones: true,
        images: true,
        address: true,
        latitude: true,
        longitude: true,
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
        establishmentId: restaurant.id,
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

    // 3. Récupérer tous les produits actifs du restaurant avec leurs catégories
    const products = await prisma.product.findMany({
      where: {
        establishmentId: restaurant.id,
        status: true // Uniquement les produits disponibles
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
        slug: restaurant.slug,
        description: restaurant.description,
        email: restaurant.email,
        phones: restaurant.phones,
        images: restaurant.images,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
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
        isQuantifiable: product.isQuantifiable,
        quantity: product.quantity,
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
