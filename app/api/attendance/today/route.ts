import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

// Mapper les jours de la semaine
const WEEKDAY_MAP: Record<number, string> = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  0: 'SUNDAY'
}

/**
 * POST /api/attendance/today
 * Créer un pointage pour aujourd'hui uniquement
 * Body: {
 *   employeeId: string,
 *   status: 'PRESENT' | 'ABSENT' | 'REST_DAY' | 'LEAVE' | 'SICK' | 'REMOTE' | 'TRAINING' | 'OTHER',
 *   startTime?: string,  // HH:MM
 *   endTime?: string,    // HH:MM
 *   isException?: boolean,
 *   exceptionReason?: string,
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
      status,
      startTime,
      endTime,
      isException = false,
      exceptionReason,
      notes
    } = body

    // Validation
    if (!employeeId || !status) {
      return NextResponse.json(
        { error: 'employeeId et status requis' },
        { status: 400 }
      )
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'REST_DAY', 'LEAVE', 'SICK', 'REMOTE', 'TRAINING', 'OTHER']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Statuts acceptés: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Vérifier que l'employé existe et appartient à l'établissement
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        establishmentId: user.establishment.id
      },
      include: {
        scheduleAssignment: {
          include: {
            schedule: {
              include: {
                days: true
              }
            }
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    // DATE STRICTEMENT AUJOURD'HUI
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const year = today.getFullYear()
    const month = today.getMonth() + 1 // 1-12

    // Vérifier que le mois est ouvert
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
        { error: `Le mois ${month}/${year} n'est pas ouvert. Veuillez ouvrir le mois avant de pointer.` },
        { status: 403 }
      )
    }

    if (attendanceMonth.status === 'CLOSED') {
      return NextResponse.json(
        { error: `Le mois ${month}/${year} est clôturé. Aucune modification n'est possible.` },
        { status: 403 }
      )
    }

    // Vérifier qu'il n'y a pas déjà un pointage pour aujourd'hui
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Un pointage existe déjà pour aujourd\'hui. Utilisez PATCH pour le modifier.' },
        { status: 409 }
      )
    }

    // RESPECT DU PLANNING
    // Vérifier le jour de la semaine
    const dayOfWeek = today.getDay() // 0 = Dimanche, 1 = Lundi, etc.
    const weekDayName = WEEKDAY_MAP[dayOfWeek]

    // Trouver le jour dans le planning
    const scheduleDay = employee.scheduleAssignment?.schedule?.days.find(
      d => d.dayOfWeek === weekDayName
    )

    // Si l'employé a un planning et que c'est un jour OFF
    if (scheduleDay && !scheduleDay.isWorkingDay) {
      // Si on essaie de marquer PRESENT sans exception
      if (status === 'PRESENT' && !isException) {
        return NextResponse.json(
          {
            error: 'Impossible de marquer PRESENT. Selon le planning, cet employé ne travaille pas aujourd\'hui. Utilisez isException=true si c\'est exceptionnel.'
          },
          { status: 403 }
        )
      }

      // Si c'est une exception, on demande une raison
      if (status === 'PRESENT' && isException && !exceptionReason) {
        return NextResponse.json(
          { error: 'Une raison est requise pour une exception de planning (exceptionReason)' },
          { status: 400 }
        )
      }
    }

    // Calculer les heures travaillées si PRESENT
    let workedHours: number | null = null
    let lateMinutes: number | null = null
    let overtimeMinutes: number | null = null

    if (status === 'PRESENT' && startTime && endTime) {
      workedHours = calculateWorkedHours(startTime, endTime)

      // Calculer retard et heures sup par rapport au planning
      if (scheduleDay && scheduleDay.startTime && scheduleDay.endTime) {
        const ecarts = calculateScheduleDeviations(
          startTime,
          endTime,
          scheduleDay.startTime,
          scheduleDay.endTime
        )
        lateMinutes = ecarts.lateMinutes
        overtimeMinutes = ecarts.overtimeMinutes
      }
    }

    // Créer le pointage
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        monthId: attendanceMonth.id,
        date: today,
        status,
        startTime,
        endTime,
        workedHours,
        lateMinutes,
        overtimeMinutes,
        isException,
        exceptionReason,
        notes
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        message: 'Pointage créé avec succès',
        attendance
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création pointage:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du pointage' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/attendance/today
 * Modifier un pointage existant pour aujourd'hui uniquement
 */
export async function PATCH(request: NextRequest) {
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
      status,
      startTime,
      endTime,
      isException,
      exceptionReason,
      notes
    } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'employé appartient à l'établissement
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        establishmentId: user.establishment.id
      },
      include: {
        scheduleAssignment: {
          include: {
            schedule: {
              include: {
                days: true
              }
            }
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    // DATE STRICTEMENT AUJOURD'HUI
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // Vérifier que le mois est ouvert
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
        { error: `Le mois ${month}/${year} n'est pas ouvert` },
        { status: 403 }
      )
    }

    if (attendanceMonth.status === 'CLOSED') {
      return NextResponse.json(
        { error: `Le mois ${month}/${year} est clôturé. Aucune modification n'est possible.` },
        { status: 403 }
      )
    }

    // Vérifier que le pointage existe
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Aucun pointage trouvé pour aujourd\'hui. Utilisez POST pour créer un pointage.' },
        { status: 404 }
      )
    }

    // Vérifier le planning pour calculer les écarts
    const dayOfWeek = today.getDay()
    const weekDayName = WEEKDAY_MAP[dayOfWeek]

    // Trouver le jour dans le planning
    const scheduleDay = employee.scheduleAssignment?.schedule?.days.find(
      d => d.dayOfWeek === weekDayName
    )

    // Calculer les heures travaillées si modifié
    let workedHours = existing.workedHours
    let lateMinutes = existing.lateMinutes
    let overtimeMinutes = existing.overtimeMinutes

    if (status === 'PRESENT' && startTime && endTime) {
      workedHours = calculateWorkedHours(startTime, endTime)

      // Calculer retard et heures sup par rapport au planning
      if (scheduleDay && scheduleDay.startTime && scheduleDay.endTime) {
        const ecarts = calculateScheduleDeviations(
          startTime,
          endTime,
          scheduleDay.startTime,
          scheduleDay.endTime
        )
        lateMinutes = ecarts.lateMinutes
        overtimeMinutes = ecarts.overtimeMinutes
      }
    } else if (status !== 'PRESENT') {
      workedHours = null
      lateMinutes = null
      overtimeMinutes = null
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date()
    }

    if (status !== undefined) updateData.status = status
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (workedHours !== undefined) updateData.workedHours = workedHours
    if (lateMinutes !== undefined) updateData.lateMinutes = lateMinutes
    if (overtimeMinutes !== undefined) updateData.overtimeMinutes = overtimeMinutes
    if (isException !== undefined) updateData.isException = isException
    if (exceptionReason !== undefined) updateData.exceptionReason = exceptionReason
    if (notes !== undefined) updateData.notes = notes

    // Mettre à jour le pointage
    const attendance = await prisma.attendance.update({
      where: {
        id: existing.id
      },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        message: 'Pointage modifié avec succès',
        attendance
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur modification pointage:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du pointage' },
      { status: 500 }
    )
  }
}

// Helper pour calculer les heures travaillées
function calculateWorkedHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute

  const totalMinutes = endTotalMinutes - startTotalMinutes
  const hours = totalMinutes / 60

  return Math.round(hours * 100) / 100 // Arrondir à 2 décimales
}

// Helper pour calculer les écarts par rapport au planning
function calculateScheduleDeviations(
  actualStart: string,
  actualEnd: string,
  plannedStart: string,
  plannedEnd: string
): { lateMinutes: number; overtimeMinutes: number } {
  // Convertir en minutes
  const [actualStartH, actualStartM] = actualStart.split(':').map(Number)
  const [actualEndH, actualEndM] = actualEnd.split(':').map(Number)
  const [plannedStartH, plannedStartM] = plannedStart.split(':').map(Number)
  const [plannedEndH, plannedEndM] = plannedEnd.split(':').map(Number)

  const actualStartMin = actualStartH * 60 + actualStartM
  const actualEndMin = actualEndH * 60 + actualEndM
  const plannedStartMin = plannedStartH * 60 + plannedStartM
  const plannedEndMin = plannedEndH * 60 + plannedEndM

  // Retard: différence entre heure d'arrivée réelle et prévue (positif = retard)
  const lateMinutes = Math.max(0, actualStartMin - plannedStartMin)

  // Heures travaillées réelles vs prévues
  const actualWorkedMin = actualEndMin - actualStartMin
  const plannedWorkedMin = plannedEndMin - plannedStartMin

  // Heures sup/manquantes (positif = heures sup, négatif = heures manquantes)
  const overtimeMinutes = actualWorkedMin - plannedWorkedMin

  return { lateMinutes, overtimeMinutes }
}
