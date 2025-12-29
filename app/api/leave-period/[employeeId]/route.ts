import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votre-secret-jwt-super-securise'
)

/**
 * GET /api/leave-period/[employeeId]
 * Récupérer toutes les périodes d'absence d'un employé
 * Query params:
 *   - status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' (optionnel, filtre par statut)
 *   - upcoming?: 'true' (optionnel, récupère uniquement les périodes futures/en cours)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
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
    const { employeeId } = await params

    // Vérifier que l'employé existe et appartient à l'établissement
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        establishmentId: user.establishment.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        position: true,
        department: true
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé introuvable' },
        { status: 404 }
      )
    }

    // Récupérer les query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const upcomingOnly = searchParams.get('upcoming') === 'true'

    // Construire les filtres
    const whereClause: any = {
      employeeId
    }

    if (statusFilter) {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          { error: `Statut invalide. Statuts acceptés: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      whereClause.status = statusFilter
    }

    if (upcomingOnly) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      whereClause.endDate = { gte: today }
    }

    // Récupérer les périodes d'absence
    const leavePeriods = await prisma.leavePeriod.findMany({
      where: whereClause,
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
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    // Calculer des statistiques
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = {
      total: leavePeriods.length,
      pending: leavePeriods.filter(p => p.status === 'PENDING').length,
      approved: leavePeriods.filter(p => p.status === 'APPROVED').length,
      rejected: leavePeriods.filter(p => p.status === 'REJECTED').length,
      cancelled: leavePeriods.filter(p => p.status === 'CANCELLED').length,
      upcoming: leavePeriods.filter(p => p.endDate >= today && (p.status === 'PENDING' || p.status === 'APPROVED')).length,
      current: leavePeriods.filter(p => p.startDate <= today && p.endDate >= today && (p.status === 'PENDING' || p.status === 'APPROVED')).length
    }

    // Enrichir les périodes avec des informations calculées
    const enrichedPeriods = leavePeriods.map(period => {
      const daysCount = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const isCurrent = period.startDate <= today && period.endDate >= today
      const isUpcoming = period.startDate > today
      const isPast = period.endDate < today

      return {
        ...period,
        daysCount,
        isCurrent,
        isUpcoming,
        isPast
      }
    })

    return NextResponse.json({
      employee,
      leavePeriods: enrichedPeriods,
      stats
    })
  } catch (error) {
    console.error('Erreur récupération périodes d\'absence:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des périodes d\'absence' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/leave-period/[employeeId]
 * Mettre à jour le statut d'une période d'absence (approuver, rejeter, annuler)
 * Body: {
 *   leavePeriodId: string,
 *   status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
 *   notes?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
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
    const { employeeId } = await params
    const body = await request.json()
    const { leavePeriodId, status, notes } = body

    // Validation
    if (!leavePeriodId || !status) {
      return NextResponse.json(
        { error: 'leavePeriodId et status sont requis' },
        { status: 400 }
      )
    }

    const validStatuses = ['APPROVED', 'REJECTED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Statuts acceptés: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Vérifier que la période d'absence existe et appartient à l'employé
    const leavePeriod = await prisma.leavePeriod.findFirst({
      where: {
        id: leavePeriodId,
        employeeId,
        employee: {
          establishmentId: user.establishment.id
        }
      }
    })

    if (!leavePeriod) {
      return NextResponse.json(
        { error: 'Période d\'absence introuvable' },
        { status: 404 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Si on approuve, ajouter les infos d'approbation
    if (status === 'APPROVED') {
      updateData.approvedBy = userId
      updateData.approvedAt = new Date()
    }

    // Mettre à jour la période
    const updatedPeriod = await prisma.leavePeriod.update({
      where: {
        id: leavePeriodId
      },
      data: updateData,
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

    return NextResponse.json({
      message: `Période d'absence ${status === 'APPROVED' ? 'approuvée' : status === 'REJECTED' ? 'rejetée' : 'annulée'} avec succès`,
      leavePeriod: updatedPeriod
    })
  } catch (error) {
    console.error('Erreur mise à jour période d\'absence:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la période d\'absence' },
      { status: 500 }
    )
  }
}
