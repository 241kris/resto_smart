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

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]

    // Vérifier qu'il n'y a pas déjà un autre mois ouvert
    const openMonth = await prisma.attendanceMonth.findFirst({
      where: {
        establishmentId: user.establishment.id,
        status: 'OPEN'
      }
    })

    if (openMonth) {
      // Si c'est le même mois qu'on essaie d'ouvrir, retourner success (idempotent)
      if (openMonth.year === year && openMonth.month === month) {
        return NextResponse.json(
          {
            message: `Le mois ${monthNames[month - 1]} ${year} est déjà ouvert`,
            attendanceMonth: openMonth
          },
          { status: 200 }
        )
      }

      // Un autre mois est ouvert
      return NextResponse.json(
        {
          error: `Impossible d'ouvrir ${monthNames[month - 1]} ${year}. Le mois ${monthNames[openMonth.month - 1]} ${openMonth.year} est actuellement ouvert. Veuillez d'abord clôturer ${monthNames[openMonth.month - 1]} ${openMonth.year} avant d'en ouvrir un nouveau.`,
          openMonth: {
            year: openMonth.year,
            month: openMonth.month,
            monthName: monthNames[openMonth.month - 1]
          }
        },
        { status: 409 }
      )
    }

    // Vérifier si le mois n'existe pas déjà en tant que clôturé
    const existing = await prisma.attendanceMonth.findUnique({
      where: {
        establishmentId_year_month: {
          establishmentId: user.establishment.id,
          year,
          month
        }
      }
    })

    if (existing && existing.status === 'CLOSED') {
      return NextResponse.json(
        {
          error: `Le mois ${monthNames[month - 1]} ${year} est déjà clôturé et ne peut pas être rouvert`,
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
