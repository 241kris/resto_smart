import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/schedules
 * Récupérer tous les plannings de l'établissement
 */
export async function GET() {
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
    const establishmentId = user.establishment.id

    // Récupérer tous les plannings avec leurs jours et assignations
    const schedules = await prisma.employeeSchedule.findMany({
      where: {
        OR: [
          { establishmentId },
          {
            employeeAssignments: {
              some: {
                employee: {
                  establishmentId: user.establishment.id
                }
              }
            }
          }
        ]
      },
      include: {
        days: {
          orderBy: {
            dayOfWeek: 'asc'
          }
        },
        employeeAssignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      { schedules },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération plannings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des plannings' },
      { status: 500 }
    )
  }
}
