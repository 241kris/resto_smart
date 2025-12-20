import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateQRCode } from '@/lib/qrcode';
import { prisma } from '@/lib/prisma';
import { uploadImageToSupabase } from '@/lib/uploadImage';

/**
 * POST /api/tables
 * Crée une nouvelle table pour un restaurant avec QR Code personnalisé
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données du body
    const body = await request.json();
    const { name, restaurantId } = body;

    // 2. Validation des données
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom de la table est requis' },
        { status: 400 }
      );
    }

    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID du restaurant est requis' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 20) {
      return NextResponse.json(
        { error: 'Le nom de la table ne peut pas dépasser 20 caractères' },
        { status: 400 }
      );
    }

    // 3. Vérifier que le restaurant existe
    const restaurantExists = await prisma.establishment.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurantExists) {
      return NextResponse.json(
        { error: 'Restaurant introuvable' },
        { status: 404 }
      );
    }

    // 4. Vérifier que le nom de la table est unique pour ce restaurant
    const existingTable = await prisma.table.findFirst({
      where: {
        restaurantId,
        name: trimmedName
      }
    });

    if (existingTable) {
      return NextResponse.json(
        { error: `Une table avec le nom "${trimmedName}" existe déjà` },
        { status: 400 }
      );
    }

    // 5. Générer un token unique pour la table
    const tableToken = nanoid(10);

    // 6. Construire l'URL personnalisée pour le QR Code
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/t/${restaurantId}/table/${tableToken}`;

    // 7. Générer l'image du QR Code avec le nom au centre
    const qrCodeImage = await generateQRCode(qrUrl, trimmedName);

    // 8. Upload du QR Code sur Supabase
    const qrCodeFileName = `${restaurantId}/table-${trimmedName}-${tableToken}.png`;
    let qrCodePath: string;

    try {
      qrCodePath = await uploadImageToSupabase(qrCodeImage, 'qr-codes', qrCodeFileName);
    } catch (uploadError) {
      console.error('Erreur upload QR code:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload du QR code' },
        { status: 500 }
      );
    }

    // 9. Sauvegarder la table dans la base de données
    const newTable = await prisma.table.create({
      data: {
        name: trimmedName,
        restaurantId,
        tableToken,
        qrUrl,
        qrCodePath,
      },
    });

    // 10. Retourner la réponse avec les données de la table et le QR Code
    return NextResponse.json({
      success: true,
      table: {
        id: newTable.id,
        name: newTable.name,
        tableToken: newTable.tableToken,
        qrUrl: newTable.qrUrl,
        qrCodePath: newTable.qrCodePath,
        restaurantId: newTable.restaurantId,
        createdAt: newTable.createdAt,
        updatedAt: newTable.updatedAt,
      },
      qrCode: qrCodeImage,
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la table:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la création de la table',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
/**
 * GET /api/tables?restaurantId=xxx
 * Récupère toutes les tables d'un restaurant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'L\'ID du restaurant est requis' },
        { status: 400 }
      );
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: {
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
      tables,
      count: tables.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
