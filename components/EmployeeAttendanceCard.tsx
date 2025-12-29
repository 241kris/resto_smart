"use client"

import {
  CheckCircle2,
  XCircle,
  Coffee,
  Plane,
  Home,
  Stethoscope,
  GraduationCap,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AttendanceStatus, Attendance } from "@/lib/hooks/useAttendance"
import { useEmployeeLeaves } from "@/lib/hooks/useLeavePeriod"
import { decimalToHHMM, isTodayInPeriod } from "@/lib/utils/timeUtils"
import { getPositionLabel } from "@/lib/utils/translations"

interface EmployeeAttendanceCardProps {
  employee: any
  todayAttendance: Attendance | null
  stats: any
  isMonthOpen: boolean
  onOpenAttendanceDrawer: (employee: any) => void
  onOpenLeavePeriodDrawer: (employee: any) => void
}

/**
 * Helper pour obtenir l'icône et la couleur d'un statut
 */
function getStatusIcon(status: AttendanceStatus) {
  const icons = {
    PRESENT: { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100" },
    ABSENT: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
    REST_DAY: { icon: Coffee, color: "text-gray-600", bgColor: "bg-gray-100" },
    LEAVE: { icon: Plane, color: "text-blue-600", bgColor: "bg-blue-100" },
    SICK: { icon: Stethoscope, color: "text-purple-600", bgColor: "bg-purple-100" },
    REMOTE: { icon: Home, color: "text-indigo-600", bgColor: "bg-indigo-100" },
    TRAINING: { icon: GraduationCap, color: "text-orange-600", bgColor: "bg-orange-100" },
    OTHER: { icon: MoreHorizontal, color: "text-gray-600", bgColor: "bg-gray-100" },
  }
  return icons[status] || icons.OTHER
}

/**
 * Helper pour obtenir le label d'un statut
 */
function getStatusLabel(status: AttendanceStatus): string {
  const labels = {
    PRESENT: "Présent",
    ABSENT: "Absent",
    REST_DAY: "Repos",
    LEAVE: "Congé",
    SICK: "Maladie",
    REMOTE: "Télétravail",
    TRAINING: "Formation",
    OTHER: "Autre",
  }
  return labels[status] || status
}

export default function EmployeeAttendanceCard({
  employee,
  todayAttendance,
  stats,
  isMonthOpen,
  onOpenAttendanceDrawer,
  onOpenLeavePeriodDrawer
}: EmployeeAttendanceCardProps) {
  // Hook pour charger les périodes d'absence de l'employé
  const { data: leavesData } = useEmployeeLeaves(employee.id, { upcomingOnly: true })

  // Vérifier si l'employé est en période d'absence aujourd'hui
  const currentLeavePeriod = leavesData?.leavePeriods?.find(
    period =>
      (period.status === 'APPROVED' || period.status === 'PENDING') &&
      isTodayInPeriod(period.startDate, period.endDate)
  )

  // Vérifier si c'est un jour de repos selon le planning
  const today = new Date()
  const todayDayOfWeek = today.getDay()
  const WEEKDAY_MAP: Record<number, string> = {
    1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY',
    5: 'FRIDAY', 6: 'SATURDAY', 0: 'SUNDAY'
  }
  const scheduleDay = employee.scheduleAssignment?.schedule?.days?.find(
    (d: any) => d.dayOfWeek === WEEKDAY_MAP[todayDayOfWeek]
  )
  const isRestDayInSchedule = scheduleDay && !scheduleDay.isWorkingDay

  const statusInfo = todayAttendance ? getStatusIcon(todayAttendance.status) : null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
              <AvatarImage src={employee.avatar || undefined} />
              <AvatarFallback>
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base md:text-lg truncate">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm truncate">
                {getPositionLabel(employee.position)}
              </CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenLeavePeriodDrawer(employee)}>
                <Plane className="h-4 w-4 mr-2" />
                Gérer les absences
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Statut du jour */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-muted-foreground font-medium">Aujourd'hui</span>
            {todayAttendance && statusInfo && (
              <div className="flex items-center gap-1.5">
                <statusInfo.icon className={`h-4 w-4 ${statusInfo.color}`} />
                <span className={`font-medium ${statusInfo.color}`}>
                  {getStatusLabel(todayAttendance.status)}
                </span>
                {todayAttendance.workedHours && (
                  <span className="text-muted-foreground">
                    ({decimalToHHMM(todayAttendance.workedHours)})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Période d'absence en cours */}
          {currentLeavePeriod ? (
            <div className="space-y-1">
              <Button
                size="sm"
                disabled
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Pointer
              </Button>
              <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                Période d'absence: {currentLeavePeriod.leaveType}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <Button
                size="sm"
                onClick={() => onOpenAttendanceDrawer(employee)}
                disabled={!isMonthOpen}
                className="w-full"
                variant={todayAttendance ? "outline" : "default"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {todayAttendance ? "Modifier" : "Pointer"}
              </Button>
              {isRestDayInSchedule && !currentLeavePeriod && (
                <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                  Jour de repos selon planning
                </p>
              )}
            </div>
          )}
        </div>

        {/* Statistiques du mois */}
        {stats && (
          <div className="space-y-2 pt-2 border-t">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Présences</span>
                <span className="text-base md:text-lg font-semibold text-green-600">
                  {stats.daysPresent}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Absences</span>
                <span className="text-base md:text-lg font-semibold text-red-600">
                  {stats.daysAbsent}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Heures</span>
                <span className="text-base md:text-lg font-semibold">
                  {decimalToHHMM(stats.totalWorkedHours)}
                </span>
              </div>
            </div>

            {/* Retard et heures sup */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col bg-orange-50 dark:bg-orange-900/10 rounded-lg p-2">
                <span className="text-xs text-muted-foreground">Retard total</span>
                <span className="text-sm md:text-base font-semibold text-orange-600">
                  {stats.totalLateMinutes > 0 ? `${Math.floor(stats.totalLateMinutes / 60)}h${(stats.totalLateMinutes % 60).toString().padStart(2, '0')}` : '0h00'}
                </span>
              </div>
              <div className="flex flex-col bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2">
                <span className="text-xs text-muted-foreground">
                  {stats.totalOvertimeMinutes >= 0 ? 'Heures sup' : 'Heures manq.'}
                </span>
                <span className={`text-sm md:text-base font-semibold ${stats.totalOvertimeMinutes >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {Math.abs(stats.totalOvertimeMinutes) > 0
                    ? `${stats.totalOvertimeMinutes >= 0 ? '+' : '-'}${Math.floor(Math.abs(stats.totalOvertimeMinutes) / 60)}h${(Math.abs(stats.totalOvertimeMinutes) % 60).toString().padStart(2, '0')}`
                    : '0h00'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
