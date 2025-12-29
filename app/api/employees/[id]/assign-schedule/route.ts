import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * POST /api/employees/:id/assign-schedule
 * Assigner un planning existant à un employé
 */
export async function POST(
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

    const { id: employeeId } = await params
    const body = await request.json()
    const { scheduleId } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'ID du planning manquant' },
        { status: 400 }
      )
    }

    // Vérifier que l'employé appartient à l'établissement
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        establishmentId: user.establishment.id
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le planning existe
    const schedule = await prisma.employeeSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        employeeAssignments: {
          include: {
            employee: {
              select: {
                establishmentId: true
              }
            }
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Planning introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le planning appartient à l'établissement
    // (soit il n'a aucune assignation, soit toutes les assignations sont du même établissement)
    if (schedule.employeeAssignments.length > 0) {
      const belongsToEstablishment = schedule.employeeAssignments.every(
        assignment => assignment.employee.establishmentId === user.establishment!.id
      )

      if (!belongsToEstablishment) {
        return NextResponse.json(
          { error: 'Ce planning appartient à un autre établissement' },
          { status: 403 }
        )
      }
    }

    // Supprimer l'ancienne assignation si elle existe (un employé ne peut avoir qu'un planning)
    await prisma.employeeScheduleAssignment.deleteMany({
      where: { employeeId }
    })

    // Créer la nouvelle assignation
    const assignment = await prisma.employeeScheduleAssignment.create({
      data: {
        employeeId,
        scheduleId
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
      { assignment },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur assignation planning:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation du planning' },
      { status: 500 }
    )
  }
}
