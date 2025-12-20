import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteImageFromSupabase } from '@/lib/uploadImage'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Await params dans Next.js 15+

    const table = await prisma.table.findUnique({
      where: { id },
      select: { id: true, name: true, qrCodePath: true },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table non trouvée' }, { status: 404 })
    }

    // Suppression de l'image
    if (table.qrCodePath) {
      await deleteImageFromSupabase('qr-codes', table.qrCodePath)
    }

    // Suppression de la donnée
    await prisma.table.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Table supprimée' })
  } catch (error) {
    console.error('Erreur delete:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}