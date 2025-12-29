import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/employees/:id/schedule
 * Récupérer le planning actif d'un employé
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Vérifier que l'employé existe et appartient à l'établissement
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        establishmentId: user.establishment.id
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    // Récupérer l'affectation de planning de l'employé
    const assignment = await prisma.employeeScheduleAssignment.findUnique({
      where: {
        employeeId: id
      },
      include: {
        schedule: {
          include: {
            days: {
              orderBy: {
                dayOfWeek: 'asc'
              }
            }
          }
        }
      }
    })

    return NextResponse.json(
      { schedule: assignment?.schedule || null },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur récupération planning:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du planning' },
      { status: 500 }
    )
  }
}

// NOTE: La création de plannings se fait maintenant UNIQUEMENT via /api/schedules/create
// L'assignation de plannings existants se fait via /api/employees/[id]/assign-schedule
// Cette route ne sert plus qu'à CONSULTER le planning d'un employé
