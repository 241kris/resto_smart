import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * POST /api/attendance-month/open
 * Ouvrir un mois de pointage pour un établissement
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

    if (typeof year !== 'number' || typeof month !== 'number') {
      return NextResponse.json(
        { error: 'Année et mois doivent être des nombres' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Le mois doit être entre 1 et 12' },
        { status: 400 }
      )
    }

    if (year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Année invalide' },
        { status: 400 }
      )
    }

    // Vérifier qu'il n'y a pas déjà un autre mois ouvert
    const openMonth = await prisma.attendanceMonth.findFirst({
      where: {
        establishmentId: user.establishment.id,
        status: 'OPEN'
      }
    })

    if (openMonth) {
      return NextResponse.json(
        {
          error: `Impossible d'ouvrir le mois ${month}/${year}. Le mois ${openMonth.month}/${openMonth.year} est déjà ouvert. Veuillez le clôturer avant d'en ouvrir un nouveau.`,
          openMonth
        },
        { status: 409 }
      )
    }

    // Vérifier si le mois n'est pas déjà ouvert
    const existing = await prisma.attendanceMonth.findUnique({
      where: {
        establishmentId_year_month: {
          establishmentId: user.establishment.id,
          year,
          month
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        {
          error: `Le mois ${month}/${year} est déjà ${existing.status === 'OPEN' ? 'ouvert' : 'clôturé'}`,
          attendanceMonth: existing
        },
        { status: 409 }
      )
    }

    // Créer le mois
    const attendanceMonth = await prisma.attendanceMonth.create({
      data: {
        establishmentId: user.establishment.id,
        year,
        month,
        status: 'OPEN'
      }
    })

    return NextResponse.json(
      {
        message: `Mois ${month}/${year} ouvert avec succès`,
        attendanceMonth
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur ouverture mois:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ouverture du mois' },
      { status: 500 }
    )
  }
}
