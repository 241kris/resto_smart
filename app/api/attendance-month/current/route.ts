import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/attendance-month/current
 * Récupérer le mois actuellement ouvert pour un établissement
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const userId = payload.userId as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishment: true }
    })

    if (!user?.establishment) {
      return NextResponse.json(
        { error: 'Aucun établissement trouvé' },
        { status: 404 }
      )
    }

    // Chercher le mois ouvert
    const openMonth = await prisma.attendanceMonth.findFirst({
      where: {
        establishmentId: user.establishment.id,
        status: 'OPEN'
      }
    })

    // Chercher le dernier mois clôturé pour savoir quel mois ouvrir ensuite
    const lastClosedMonth = await prisma.attendanceMonth.findFirst({
      where: {
        establishmentId: user.establishment.id,
        status: 'CLOSED'
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    if (!openMonth) {
      return NextResponse.json(
        { openMonth: null, lastClosedMonth },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { openMonth, lastClosedMonth },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération mois ouvert:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du mois ouvert' },
      { status: 500 }
    )
  }
}
