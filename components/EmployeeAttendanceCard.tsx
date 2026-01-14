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
  AlertCircle,
  Clock,
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
    <Card className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
              {employee.avatar ? (
                <Avatar className="h-full w-full">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback className="rounded-2xl">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-primary font-bold text-[10px] uppercase tracking-wider">
                {getPositionLabel(employee.position)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl dark:bg-slate-900 dark:border-slate-800">
              <DropdownMenuLabel className="font-bold">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenLeavePeriodDrawer(employee)} className="rounded-lg">
                <Plane className="h-4 w-4 mr-2" />
                Gérer les absences
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Statut du jour */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Aujourd'hui</span>
            {todayAttendance && statusInfo && (
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${statusInfo.bgColor}`}>
                  <statusInfo.icon className={`h-3.5 w-3.5 ${statusInfo.color}`} />
                </div>
                <span className={`font-bold text-sm ${statusInfo.color}`}>
                  {getStatusLabel(todayAttendance.status)}
                </span>
                {todayAttendance.workedHours && (
                  <Badge variant="secondary" className="rounded-lg text-[10px] font-bold">
                    {decimalToHHMM(todayAttendance.workedHours)}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Période d'absence en cours */}
          {currentLeavePeriod ? (
            <div className="space-y-2">
              <Button
                size="sm"
                disabled
                className="w-full h-11 rounded-xl font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Pointer
              </Button>
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <Plane className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  Période d'absence en cours
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                size="sm"
                onClick={() => onOpenAttendanceDrawer(employee)}
                disabled={!isMonthOpen}
                className="w-full h-11 rounded-xl font-bold shadow-lg"
                variant={todayAttendance ? "outline" : "default"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {todayAttendance ? "Modifier le pointage" : "Pointer maintenant"}
              </Button>
              {isRestDayInSchedule && !currentLeavePeriod && (
                <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                  <Coffee className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    Jour de repos selon planning
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistiques du mois */}
        {stats && (
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Statistiques du mois</span>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {stats.daysPresent}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Présences</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {stats.daysAbsent}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Absences</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {decimalToHHMM(stats.totalWorkedHours)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Heures</span>
              </div>
            </div>

            {/* Retard et heures sup */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Retard</span>
                </div>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {stats.totalLateMinutes > 0 ? `${Math.floor(stats.totalLateMinutes / 60)}h${(stats.totalLateMinutes % 60).toString().padStart(2, '0')}` : '0h00'}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {stats.totalOvertimeMinutes >= 0 ? 'H. Sup' : 'H. Manq'}
                  </span>
                </div>
                <span className={`text-lg font-black ${stats.totalOvertimeMinutes >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
