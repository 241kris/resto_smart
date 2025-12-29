import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * POST /api/attendance-month/close
 * Clôturer un mois de pointage (lecture seule après clôture)
 * Body: { year: 2025, month: 1 }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { year, month } = body

    // Validation
    if (!year || !month) {
      return NextResponse.json(
        { error: 'Année et mois requis' },
        { status: 400 }
      )
    }

    // Vérifier que le mois existe et est ouvert
    const attendanceMonth = await prisma.attendanceMonth.findUnique({
      where: {
        establishmentId_year_month: {
          establishmentId: user.establishment.id,
          year,
          month
        }
      }
    })

    if (!attendanceMonth) {
      return NextResponse.json(
        { error: `Le mois ${month}/${year} n'existe pas` },
        { status: 404 }
      )
    }

    if (attendanceMonth.status === 'CLOSED') {
      return NextResponse.json(
        { error: `Le mois ${month}/${year} est déjà clôturé` },
        { status: 409 }
      )
    }

    // Clôturer le mois
    const closedMonth = await prisma.attendanceMonth.update({
      where: {
        id: attendanceMonth.id
      },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    })

    return NextResponse.json(
      {
        message: `Mois ${month}/${year} clôturé avec succès`,
        attendanceMonth: closedMonth
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur clôture mois:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la clôture du mois' },
      { status: 500 }
    )
  }
}
