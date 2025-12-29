import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/schedules/:id
 * Récupérer un planning par son ID avec tous ses détails
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

    const schedule = await prisma.employeeSchedule.findFirst({
      where: {
        id,
        employeeAssignments: {
          some: {
            employee: {
              establishmentId: user.establishment.id
            }
          }
        }
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
                position: true,
                department: true,
                status: true
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

    return NextResponse.json(
      { schedule },
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

/**
 * DELETE /api/schedules/:id
 * Supprimer un planning (supprime aussi toutes les assignations)
 */
export async function DELETE(
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

    // Vérifier que le planning appartient à l'établissement
    const schedule = await prisma.employeeSchedule.findFirst({
      where: {
        id,
        employeeAssignments: {
          some: {
            employee: {
              establishmentId: user.establishment.id
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

    // Supprimer le planning (les jours et assignations seront supprimés en cascade)
    await prisma.employeeSchedule.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Planning supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur suppression planning:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du planning' },
      { status: 500 }
    )
  }
}
