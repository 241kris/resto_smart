import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/attendance/month/[year]/[month]
 * Récupérer tous les pointages d'un mois avec statistiques
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
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

    // Await params (Next.js 15+)
    const { year: yearStr, month: monthStr } = await params

    // Valider les paramètres
    const year = parseInt(yearStr)
    const month = parseInt(monthStr)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Année ou mois invalide' },
        { status: 400 }
      )
    }

    // Vérifier que le mois existe
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
        { status: 404 }
      )
    }

    // Récupérer tous les pointages du mois avec détails employés
    const attendances = await prisma.attendance.findMany({
      where: {
        monthId: attendanceMonth.id
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
            department: true,
            contractType: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { employee: { lastName: 'asc' } }
      ]
    })

    // Récupérer tous les employés de l'établissement pour voir qui n'a pas de pointages
    const allEmployees = await prisma.employee.findMany({
      where: {
        establishmentId: user.establishment.id,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        position: true,
        department: true,
        contractType: true
      }
    })

    // Calculer les statistiques par employé
    const employeeStats = allEmployees.map(employee => {
      const employeeAttendances = attendances.filter(a => a.employeeId === employee.id)

      const totalDays = employeeAttendances.length
      const daysPresent = employeeAttendances.filter(a => a.status === 'PRESENT').length
      const daysAbsent = employeeAttendances.filter(a => a.status === 'ABSENT').length
      const daysRestDay = employeeAttendances.filter(a => a.status === 'REST_DAY').length
      const daysLeave = employeeAttendances.filter(a => a.status === 'LEAVE').length
      const daysSick = employeeAttendances.filter(a => a.status === 'SICK').length
      const daysRemote = employeeAttendances.filter(a => a.status === 'REMOTE').length
      const daysTraining = employeeAttendances.filter(a => a.status === 'TRAINING').length
      const daysOther = employeeAttendances.filter(a => a.status === 'OTHER').length

      const totalWorkedHours = employeeAttendances.reduce((sum, a) => {
        return sum + (a.workedHours || 0)
      }, 0)

      const totalLateMinutes = employeeAttendances.reduce((sum, a) => {
        return sum + (a.lateMinutes || 0)
      }, 0)

      const totalOvertimeMinutes = employeeAttendances.reduce((sum, a) => {
        return sum + (a.overtimeMinutes || 0)
      }, 0)

      const exceptionsCount = employeeAttendances.filter(a => a.isException).length

      return {
        employee,
        stats: {
          totalDays,
          daysPresent,
          daysAbsent,
          daysRestDay,
          daysLeave,
          daysSick,
          daysRemote,
          daysTraining,
          daysOther,
          totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
          totalLateMinutes,
          totalOvertimeMinutes,
          exceptionsCount
        },
        attendances: employeeAttendances
      }
    })

    // Statistiques globales du mois
    const globalStats = {
      totalEmployees: allEmployees.length,
      totalAttendances: attendances.length,
      totalPresent: attendances.filter(a => a.status === 'PRESENT').length,
      totalAbsent: attendances.filter(a => a.status === 'ABSENT').length,
      totalWorkedHours: Math.round(
        attendances.reduce((sum, a) => sum + (a.workedHours || 0), 0) * 100
      ) / 100,
      totalExceptions: attendances.filter(a => a.isException).length
    }

    return NextResponse.json({
      month: attendanceMonth,
      employeeStats,
      globalStats,
      attendances
    })
  } catch (error) {
    console.error('Erreur récupération pointages mensuels:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pointages' },
      { status: 500 }
    )
  }
}
