// ---------------------------------------
//  API Route: POST /api/tables/bulk
//  Crée plusieurs tables à la fois avec QR Codes
// ---------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateQRCode } from '@/lib/qrcode';
import { prisma } from '@/lib/prisma';
import { uploadImageToSupabase } from '@/lib/uploadImage';

/**
 * POST /api/tables/bulk
 * Crée plusieurs tables à la fois pour un restaurant avec QR Codes
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données du body
    const body = await request.json();
    const { restaurantId, count } = body;

    // 2. Validation des données
    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json(
        { error: 'L\'ID du restaurant est requis' },
        { status: 400 }
      );
    }

    if (!count || typeof count !== 'number' || count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'Le nombre de tables doit être entre 1 et 50' },
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

    // 4. Récupérer le numéro de la dernière table existante
    const lastTable = await prisma.table.findFirst({
      where: { restaurantId },
      orderBy: { number: 'desc' }
    });

    const startNumber = lastTable ? lastTable.number + 1 : 1;

    // 5. Créer les tables en batch
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const tablesToCreate = [];

    for (let i = 0; i < count; i++) {
      const tableNumber = startNumber + i;
      const tableToken = nanoid(10);
      const qrUrl = `${baseUrl}/t/${restaurantId}/table/${tableToken}`;
      const qrCodeFileName = `${restaurantId}/table-${tableNumber}-${tableToken}.png`;

      // Générer le QR Code (base64)
      const qrCodeImage = await generateQRCode(qrUrl);

      // Upload du QR Code sur Supabase
      let qrCodePath: string;
      try {
        qrCodePath = await uploadImageToSupabase(qrCodeImage, 'qr-codes', qrCodeFileName);
      } catch (uploadError) {
        console.error('Erreur upload QR code:', uploadError);
        return NextResponse.json(
          { error: `Erreur lors de l'upload du QR code pour la table ${tableNumber}` },
          { status: 500 }
        );
      }

      tablesToCreate.push({
        number: tableNumber,
        restaurantId,
        tableToken,
        qrUrl,
        qrCodePath,
      });
    }

    // 6. Insérer toutes les tables dans la base de données
    const createdTables = await prisma.table.createMany({
      data: tablesToCreate,
    });

    // 7. Récupérer les tables créées avec les relations
    const tables = await prisma.table.findMany({
      where: {
        restaurantId,
        number: {
          gte: startNumber,
          lt: startNumber + count,
        }
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { number: 'asc' }
    });

    // 8. Retourner la réponse
    return NextResponse.json({
      success: true,
      tables,
      qrCodes: tables.map(table => ({
        tableId: table.id,
        tableNumber: table.number,
        qrCodePath: table.qrCodePath,
      })),
      message: `${createdTables.count} table(s) créée(s) avec succès`
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la création des tables',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
