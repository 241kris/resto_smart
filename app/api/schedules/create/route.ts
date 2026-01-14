import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

function calculateDailyHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute

  const totalMinutes = endTotalMinutes - startTotalMinutes
  const hours = totalMinutes / 60

  return Math.round(hours * 100) / 100
}

/**
 * POST /api/schedules/create
 * Créer un nouveau planning avec assignation aux employés
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

    const establishmentId = user.establishment.id

    const body = await request.json()
    const { name, days, employeeIds = [] } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom du planning est requis' },
        { status: 400 }
      )
    }

    if (!days || !Array.isArray(days) || days.length !== 7) {
      return NextResponse.json(
        { error: 'Les jours du planning sont requis (7 jours)' },
        { status: 400 }
      )
    }

    // Vérifier que tous les employés appartiennent à l'établissement
    if (employeeIds.length > 0) {
      const employeesCount = await prisma.employee.count({
        where: {
          id: { in: employeeIds },
          establishmentId: user.establishment.id
        }
      })

      if (employeesCount !== employeeIds.length) {
        return NextResponse.json(
          { error: 'Certains employés n\'appartiennent pas à votre établissement' },
          { status: 400 }
        )
      }
    }

    // Créer le planning avec les jours et les assignations en une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer le planning
      const schedule = await tx.employeeSchedule.create({
        data: {
          name: name.trim(),
          status: 'ACTIVE',
          establishmentId
        }
      })

      // Créer les jours
      for (const day of days) {
        let dailyHoursCalculated = null

        if (day.isWorkingDay && day.startTime && day.endTime) {
          dailyHoursCalculated = calculateDailyHours(day.startTime, day.endTime)
        }

        await tx.employeeScheduleDay.create({
          data: {
            scheduleId: schedule.id,
            dayOfWeek: day.dayOfWeek,
            isWorkingDay: day.isWorkingDay,
            startTime: day.isWorkingDay ? day.startTime : null,
            endTime: day.isWorkingDay ? day.endTime : null,
            dailyHoursCalculated,
            dailyHoursManual: day.dailyHoursManual || null
          }
        })
      }

      // Assigner aux employés sélectionnés
      if (employeeIds.length > 0) {
        // Supprimer les anciennes assignations de ces employés
        await tx.employeeScheduleAssignment.deleteMany({
          where: {
            employeeId: { in: employeeIds }
          }
        })

        // Créer les nouvelles assignations
        for (const employeeId of employeeIds) {
          await tx.employeeScheduleAssignment.create({
            data: {
              employeeId,
              scheduleId: schedule.id
            }
          })
        }
      }

      // Récupérer le planning complet avec jours et assignations
      return await tx.employeeSchedule.findUnique({
        where: { id: schedule.id },
        include: {
          days: {
            orderBy: { dayOfWeek: 'asc' }
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
        }
      })
    })

    return NextResponse.json(
      { schedule: result },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création planning:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du planning' },
      { status: 500 }
    )
  }
}
