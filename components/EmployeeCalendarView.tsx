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
  Clock,
  AlertTriangle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { AttendanceStatus, Attendance, EmployeeStats } from "@/lib/hooks/useAttendance"
import { getPositionLabel } from "@/lib/utils/translations"
import { decimalToHHMM } from "@/lib/utils/timeUtils"
import { cn } from "@/lib/utils"

interface EmployeeCalendarViewProps {
  employees: any[]
  employeeStats: EmployeeStats[]
  attendances: Attendance[]
  year: number
  month: number
  onDayClick: (employee: any, date: Date) => void
  schedule?: any // Planning de l'employé (si vue single)
}

/**
 * Helper pour obtenir le statut et la couleur d'un jour
 */
function getStatusColor(status: AttendanceStatus | null): { bg: string; border: string; icon: any; label: string } {
  if (!status) {
    return {
      bg: "bg-slate-50 dark:bg-slate-800/30",
      border: "border-slate-200 dark:border-slate-700",
      icon: null,
      label: "Non pointé"
    }
  }

  const statusMap = {
    PRESENT: {
      bg: "bg-emerald-100 dark:bg-emerald-500/20",
      border: "border-emerald-300 dark:border-emerald-500/40",
      icon: CheckCircle2,
      label: "Présent"
    },
    ABSENT: {
      bg: "bg-red-100 dark:bg-red-500/20",
      border: "border-red-300 dark:border-red-500/40",
      icon: XCircle,
      label: "Absent"
    },
    REST_DAY: {
      bg: "bg-slate-100 dark:bg-slate-700/30",
      border: "border-slate-300 dark:border-slate-600/40",
      icon: Coffee,
      label: "Repos"
    },
    LEAVE: {
      bg: "bg-blue-100 dark:bg-blue-500/20",
      border: "border-blue-300 dark:border-blue-500/40",
      icon: Plane,
      label: "Congé"
    },
    SICK: {
      bg: "bg-purple-100 dark:bg-purple-500/20",
      border: "border-purple-300 dark:border-purple-500/40",
      icon: Stethoscope,
      label: "Maladie"
    },
    REMOTE: {
      bg: "bg-indigo-100 dark:bg-indigo-500/20",
      border: "border-indigo-300 dark:border-indigo-500/40",
      icon: Home,
      label: "Télétravail"
    },
    TRAINING: {
      bg: "bg-orange-100 dark:bg-orange-500/20",
      border: "border-orange-300 dark:border-orange-500/40",
      icon: GraduationCap,
      label: "Formation"
    },
    OTHER: {
      bg: "bg-slate-100 dark:bg-slate-500/20",
      border: "border-slate-300 dark:border-slate-500/40",
      icon: MoreHorizontal,
      label: "Autre"
    },
  }

  return statusMap[status] || statusMap.OTHER
}

export default function EmployeeCalendarView({
  employees,
  employeeStats,
  attendances,
  year,
  month,
  onDayClick,
  schedule,
}: EmployeeCalendarViewProps) {
  // Map WeekDay enum to JS day of week (0 = Sunday, 1 = Monday, etc.)
  const weekDayMap: Record<string, number> = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6,
  }

  // Vérifier si un jour est un jour de repos selon le planning
  const isRestDayInSchedule = (date: Date): boolean => {
    if (!schedule?.days) return false
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
    const scheduleDay = schedule.days.find((d: any) => weekDayMap[d.dayOfWeek] === dayOfWeek)
    return scheduleDay ? !scheduleDay.isWorkingDay : false
  }
  // Obtenir le nombre de jours dans le mois
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Date d'aujourd'hui
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const currentDay = isCurrentMonth ? today.getDate() : null

  // Premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 // Lundi = 0

  // Obtenir le pointage d'un employé pour un jour donné
  const getAttendanceForDay = (employeeId: string, day: number): Attendance | null => {
    const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0]
    return attendances.find(a => a.employeeId === employeeId && a.date.split('T')[0] === dateStr) || null
  }

  // Obtenir les stats d'un employé
  const getStatsForEmployee = (employeeId: string) => {
    return employeeStats.find(s => s.employee.id === employeeId)?.stats
  }

  return (
    <div className="space-y-4">
      {/* Légende */}
      <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Légende:</span>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40" />
              <span className="text-xs font-medium">Présent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/40" />
              <span className="text-xs font-medium">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/40" />
              <span className="text-xs font-medium">Congé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-700/30 border border-slate-300 dark:border-slate-600/40" />
              <span className="text-xs font-medium">Repos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700" />
              <span className="text-xs font-medium">Non pointé</span>
            </div>
          </div>
        </div>
      </Card>

      {/* En-tête des jours */}
      <div className="sticky top-0 z-10 bg-background pb-2">
        <div className="flex gap-2">
          <div className="w-48 shrink-0" /> {/* Espace pour la colonne employé */}
          <div className="flex-1 grid grid-cols-7 gap-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i} className="text-center text-xs font-black uppercase tracking-wider text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des employés avec leur calendrier */}
      <TooltipProvider>
        <div className="space-y-3">
          {employees.map((employee) => {
            const stats = getStatsForEmployee(employee.id)

            return (
              <Card key={employee.id} className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Info employé */}
                  <div className="w-48 shrink-0 flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                      {employee.avatar ? (
                        <Avatar className="h-full w-full">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback className="rounded-xl text-xs">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-primary font-bold text-[9px] uppercase tracking-wider">
                        {getPositionLabel(employee.position)}
                      </p>
                    </div>
                  </div>

                  {/* Calendrier */}
                  <div className="flex-1">
                    <div className="grid grid-cols-7 gap-1">
                      {/* Offset pour aligner avec le bon jour de la semaine */}
                      {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`offset-${i}`} />
                      ))}

                      {/* Jours du mois */}
                      {days.map((day) => {
                        const date = new Date(year, month - 1, day)
                        const attendance = getAttendanceForDay(employee.id, day)
                        const statusInfo = getStatusColor(attendance?.status || null)
                        const isToday = day === currentDay
                        const isScheduledRestDay = isRestDayInSchedule(date)
                        const canClick = isToday && !isScheduledRestDay

                        // Si c'est un jour de repos selon le planning, forcer l'apparence
                        const displayBg = isScheduledRestDay
                          ? "bg-slate-100 dark:bg-slate-700/30"
                          : statusInfo.bg
                        const displayBorder = isScheduledRestDay
                          ? "border-slate-300 dark:border-slate-600/40"
                          : statusInfo.border
                        const displayLabel = isScheduledRestDay ? "Repos (Planning)" : statusInfo.label

                        return (
                          <Tooltip key={day}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => canClick && onDayClick(employee, date)}
                                disabled={!canClick}
                                className={cn(
                                  "relative aspect-square rounded-lg border-2 transition-all",
                                  displayBg,
                                  displayBorder,
                                  canClick && "cursor-pointer hover:scale-110 hover:shadow-md",
                                  !canClick && "cursor-not-allowed opacity-60",
                                  isToday && !isScheduledRestDay && "ring-2 ring-primary ring-offset-2",
                                  isScheduledRestDay && "opacity-50"
                                )}
                              >
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-[10px] font-bold">{day}</span>
                                  {isScheduledRestDay ? (
                                    <Coffee className="h-3 w-3 mt-0.5 opacity-60" />
                                  ) : attendance && statusInfo.icon ? (
                                    <statusInfo.icon className="h-3 w-3 mt-0.5 opacity-60" />
                                  ) : null}
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p className="font-bold">{day} {["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"][month - 1]} {year}</p>
                                <p>{displayLabel}</p>
                                {attendance?.workedHours && (
                                  <p className="text-muted-foreground">
                                    Heures: {decimalToHHMM(attendance.workedHours)}
                                  </p>
                                )}
                                {attendance?.lateMinutes && attendance.lateMinutes > 0 && (
                                  <p className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Retard: {attendance.lateMinutes} min
                                  </p>
                                )}
                                {attendance?.overtimeMinutes && attendance.overtimeMinutes !== 0 && (
                                  <p className={cn(
                                    "font-bold flex items-center gap-1",
                                    attendance.overtimeMinutes > 0
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-rose-600 dark:text-rose-400"
                                  )}>
                                    <AlertTriangle className="h-3 w-3" />
                                    {attendance.overtimeMinutes > 0 ? "Heures sup: +" : "Manquant: "}
                                    {Math.abs(attendance.overtimeMinutes)} min
                                  </p>
                                )}
                                {isToday && <Badge variant="secondary" className="text-[9px]">Aujourd'hui</Badge>}
                                {isScheduledRestDay && <Badge variant="secondary" className="text-[9px]">Jour de repos</Badge>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>

                    {/* Stats résumé */}
                    {stats && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Badge variant="secondary" className="text-[9px] font-bold">
                          {stats.daysPresent} présences
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] font-bold">
                          {decimalToHHMM(stats.totalWorkedHours)} heures
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
