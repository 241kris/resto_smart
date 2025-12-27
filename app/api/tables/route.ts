import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateQRCode } from '@/lib/qrcode';
import { prisma } from '@/lib/prisma';
// L'import fonctionnera maintenant car les deux fonctions sont dans le fichier lib
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/uploadImage';

/**
 * POST /api/tables
 * Crée une nouvelle table (Single)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, restaurantId } = body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Le nom de la table est requis' }, { status: 400 });
    }
    if (!restaurantId) {
      return NextResponse.json({ error: 'ID restaurant requis' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Vérification unicité
    const existingTable = await prisma.table.findFirst({
      where: { restaurantId, name: trimmedName }
    });

    if (existingTable) {
      return NextResponse.json({ error: `La table "${trimmedName}" existe déjà` }, { status: 400 });
    }

    // Génération
    const tableToken = nanoid(10);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/t/${restaurantId}/table/${tableToken}`;

    // Image QR
    const qrCodeImage = await generateQRCode(qrUrl);

    // Upload Supabase
    const qrCodeFileName = `${restaurantId}/table-${trimmedName}-${tableToken}.png`;
    let qrCodePath: string;

    try {
      qrCodePath = await uploadImageToSupabase(qrCodeImage, 'qr-codes', qrCodeFileName);
    } catch (uploadError) {
      return NextResponse.json({ error: 'Erreur upload QR code' }, { status: 500 });
    }

    // Save DB
    const newTable = await prisma.table.create({
      data: {
        name: trimmedName,
        restaurantId,
        tableToken,
        qrUrl,
        qrCodePath,
      },
    });

    return NextResponse.json({
      success: true,
      table: newTable,
      qrCode: qrCodeImage,
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST table:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET /api/tables
 * Récupère les tables
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'ID restaurant requis' }, { status: 400 });
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' }, // ou orderBy: { name: 'asc' } selon préférence
    });

    return NextResponse.json({ success: true, tables });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/tables
 * Supprime plusieurs tables (Bulk Delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableIds } = body;

    if (!tableIds || !Array.isArray(tableIds) || tableIds.length === 0) {
      return NextResponse.json({ error: 'IDs des tables requis' }, { status: 400 });
    }

    // 1. Récupérer les infos des tables (pour avoir les chemins d'images)
    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds } },
      select: { id: true, name: true, qrCodePath: true }
    });

    if (tables.length === 0) {
      return NextResponse.json({ error: 'Aucune table trouvée' }, { status: 404 });
    }

    // 2. Supprimer les images sur Supabase
    // On utilise Promise.allSettled pour que si une image échoue, ça ne bloque pas le reste
    await Promise.allSettled(
      tables.map((table) => {
        if (table.qrCodePath) {
          return deleteImageFromSupabase('qr-codes', table.qrCodePath);
        }
        return Promise.resolve();
      })
    );

    // 3. Supprimer les tables en base de données
    const deleteResult = await prisma.table.deleteMany({
      where: { id: { in: tableIds } }
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} table(s) supprimée(s)`,
      deletedCount: deleteResult.count,
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting tables:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la suppression' }, { status: 500 });
  }
}