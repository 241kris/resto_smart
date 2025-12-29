import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * POST /api/leave-period
 * Créer une période d'absence planifiée
 * Body: {
 *   employeeId: string,
 *   startDate: string (ISO),
 *   endDate: string (ISO),
 *   leaveType: 'ANNUAL_LEAVE' | 'SICK_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE' | 'UNPAID_LEAVE' | 'REMOTE_WORK' | 'TRAINING' | 'OTHER',
 *   reason?: string,
 *   notes?: string
 * }
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
    const {
      employeeId,
      startDate,
      endDate,
      leaveType,
      reason,
      notes
    } = body

    // Validation des champs requis
    if (!employeeId || !startDate || !endDate || !leaveType) {
      return NextResponse.json(
        { error: 'employeeId, startDate, endDate et leaveType sont requis' },
        { status: 400 }
      )
    }

    // Validation du type de congé
    const validLeaveTypes = [
      'ANNUAL_LEAVE',
      'SICK_LEAVE',
      'MATERNITY_LEAVE',
      'PATERNITY_LEAVE',
      'UNPAID_LEAVE',
      'REMOTE_WORK',
      'TRAINING',
      'OTHER'
    ]

    if (!validLeaveTypes.includes(leaveType)) {
      return NextResponse.json(
        { error: `Type de congé invalide. Types acceptés: ${validLeaveTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Vérifier que l'employé existe et appartient à l'établissement
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

    // Parser les dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Validation des dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Dates invalides' },
        { status: 400 }
      )
    }

    // La date de début doit être >= aujourd'hui
    if (start < today) {
      return NextResponse.json(
        { error: 'La date de début doit être aujourd\'hui ou dans le futur' },
        { status: 400 }
      )
    }

    // La date de fin doit être > date de début
    if (end <= start) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      )
    }

    // Vérifier les chevauchements avec d'autres périodes d'absence APPROVED ou PENDING
    const overlappingPeriods = await prisma.leavePeriod.findMany({
      where: {
        employeeId,
        status: {
          in: ['PENDING', 'APPROVED']
        },
        OR: [
          // La nouvelle période commence pendant une période existante
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          // La nouvelle période se termine pendant une période existante
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          },
          // La nouvelle période englobe une période existante
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ]
      }
    })

    if (overlappingPeriods.length > 0) {
      return NextResponse.json(
        {
          error: 'Cette période chevauche une autre période d\'absence déjà planifiée ou approuvée',
          overlappingPeriods
        },
        { status: 409 }
      )
    }

    // Créer la période d'absence
    const leavePeriod = await prisma.leavePeriod.create({
      data: {
        employeeId,
        startDate: start,
        endDate: end,
        leaveType,
        reason: reason || null,
        notes: notes || null,
        status: 'PENDING'
      },
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
    })

    // Calculer le nombre de jours
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return NextResponse.json(
      {
        message: 'Période d\'absence créée avec succès',
        leavePeriod,
        daysCount
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création période d\'absence:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la période d\'absence' },
      { status: 500 }
    )
  }
}
