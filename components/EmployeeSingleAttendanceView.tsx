"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Calendar,
  Settings,
  AlertCircle,
  Lock,
  LockOpen,
  Clock,
  TrendingUp,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMonthlyAttendance } from "@/lib/hooks/useAttendance"
import { useCurrentOpenMonth } from "@/lib/hooks/useAttendanceMonth"
import TodayAttendanceDrawer from "./TodayAttendanceDrawer"
import MonthManagementDialog from "./MonthManagementDialog"
import EmployeeCalendarView from "./EmployeeCalendarView"
import { getPositionLabel } from "@/lib/utils/translations"
import type { Employee } from "@/lib/hooks/useEmployees"

interface EmployeeSingleAttendanceViewProps {
  employee: Employee
  onBack: () => void
}

export default function EmployeeSingleAttendanceView({
  employee,
  onBack,
}: EmployeeSingleAttendanceViewProps) {
  const [attendanceDrawerOpen, setAttendanceDrawerOpen] = useState(false)
  const [monthManagementOpen, setMonthManagementOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Récupérer le mois actuellement ouvert et le dernier mois clôturé
  const { data: currentOpenMonthData, isLoading: isLoadingOpenMonth } = useCurrentOpenMonth()
  const openMonth = currentOpenMonthData?.openMonth
  const lastClosedMonth = currentOpenMonthData?.lastClosedMonth

  // État pour le mois sélectionné (navigation)
  const [selectedYear, setSelectedYear] = useState<number>(openMonth?.year || new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(openMonth?.month || new Date().getMonth() + 1)

  // Mettre à jour le mois sélectionné quand le mois ouvert change
  useEffect(() => {
    if (openMonth) {
      setSelectedYear(openMonth.year)
      setSelectedMonth(openMonth.month)
    }
  }, [openMonth])

  // Récupérer les données du mois sélectionné
  const { data: monthData, isLoading: isLoadingMonth } = useMonthlyAttendance(
    selectedYear,
    selectedMonth
  )

  // Navigation entre les mois
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const goToCurrentMonth = () => {
    if (openMonth) {
      setSelectedYear(openMonth.year)
      setSelectedMonth(openMonth.month)
    } else {
      const now = new Date()
      setSelectedYear(now.getFullYear())
      setSelectedMonth(now.getMonth() + 1)
    }
  }

  // Calculer le mois à ouvrir (le mois suivant le dernier mois clôturé)
  const getNextMonthToOpen = () => {
    if (lastClosedMonth) {
      // Calculer le mois suivant
      if (lastClosedMonth.month === 12) {
        return { year: lastClosedMonth.year + 1, month: 1 }
      } else {
        return { year: lastClosedMonth.year, month: lastClosedMonth.month + 1 }
      }
    }
    // Par défaut, utiliser le mois actuel
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }

  // Handler pour le clic sur un jour
  const handleDayClick = (emp: any, date: Date) => {
    // Only allow clicking if it's the open month
    const isOpenMonth = openMonth && selectedYear === openMonth.year && selectedMonth === openMonth.month
    if (!isOpenMonth) return

    setSelectedDate(date)
    setAttendanceDrawerOpen(true)
  }

  // Obtenir le pointage du jour pour un employé
  const getTodayAttendance = () => {
    if (!monthData?.attendances || !selectedDate) return null

    const dateStr = selectedDate.toISOString().split('T')[0]

    return monthData.attendances.find(
      a => a.employeeId === employee.id && a.date.split('T')[0] === dateStr
    )
  }

  // Obtenir les stats de l'employé
  const getEmployeeStats = () => {
    return monthData?.employeeStats?.find(s => s.employee.id === employee.id)?.stats
  }

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const isLoading = isLoadingOpenMonth || isLoadingMonth
  const stats = getEmployeeStats()

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 px-4 md:px-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
              {employee.avatar ? (
                <Avatar className="h-full w-full">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback className="rounded-2xl text-lg">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight dark:text-white">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-primary font-bold text-xs uppercase tracking-wider">
                {getPositionLabel(employee.position)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PLANNING INFO */}
      {employee.scheduleAssignment?.schedule && (
        <Card className="rounded-[2rem] border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-lg dark:text-white">Planning assigné</h3>
                <p className="text-sm font-bold text-primary">
                  {employee.scheduleAssignment.schedule.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MOIS OUVERT */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Chargement...</p>
        </div>
      ) : !openMonth ? (
        <Card className="rounded-[2rem] border-amber-200 bg-amber-50 dark:bg-amber-900/10 border-2">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 shrink-0">
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg dark:text-white mb-1">Aucun mois ouvert</h3>
                <p className="text-sm text-muted-foreground">
                  Vous devez ouvrir un mois pour commencer à enregistrer les pointages.
                  Ouvrez le mois actuel pour permettre le pointage.
                </p>
                <Button
                  onClick={() => setMonthManagementOpen(true)}
                  className="mt-4 rounded-xl font-bold shadow-lg"
                >
                  <LockOpen className="h-4 w-4 mr-2" />
                  Ouvrir un mois
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* EN-TÊTE DU MOIS SÉLECTIONNÉ */}
          <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Info mois avec navigation */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPreviousMonth}
                        className="h-8 w-8 rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-xl md:text-2xl font-black dark:text-white">
                          {monthNames[selectedMonth - 1]} {selectedYear}
                        </h2>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextMonth}
                        className="h-8 w-8 rounded-lg"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {openMonth && (selectedYear !== openMonth.year || selectedMonth !== openMonth.month) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToCurrentMonth}
                          className="h-8 px-3 rounded-lg text-xs font-bold"
                        >
                          Mois ouvert
                        </Button>
                      )}
                    </div>
                    {openMonth && selectedYear === openMonth.year && selectedMonth === openMonth.month ? (
                      <Badge variant="secondary" className="mt-1.5 rounded-lg text-[10px] font-bold w-fit">
                        MOIS ACTUELLEMENT OUVERT
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1.5 rounded-lg text-[10px] font-bold w-fit">
                        CONSULTATION HISTORIQUE
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Statut et actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  {openMonth && selectedYear === openMonth.year && selectedMonth === openMonth.month && (
                    <>
                      <Badge
                        variant="default"
                        className="gap-2 h-10 px-4 rounded-xl text-xs font-bold"
                      >
                        <LockOpen className="h-4 w-4" />
                        <span>OUVERT</span>
                      </Badge>

                      <Button
                        variant="outline"
                        onClick={() => setMonthManagementOpen(true)}
                        className="h-10 rounded-xl font-bold gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Gérer le mois
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Statistiques de l'employé */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.daysPresent}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Présences</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-500 mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.totalWorkedHours}h</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Heures</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10">
                    <AlertCircle className="h-5 w-5 text-rose-500 mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.daysAbsent || 0}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Absences</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                    <UserCheck className="h-5 w-5 text-blue-500 mb-2" />
                    <span className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400">{stats.daysRestDay || 0}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Repos</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CALENDRIER */}
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                {openMonth && selectedYear === openMonth.year && selectedMonth === openMonth.month
                  ? "Calendrier - Cliquez sur aujourd'hui pour pointer"
                  : "Calendrier - Consultation historique (lecture seule)"}
              </h2>
            </div>

            <EmployeeCalendarView
              employees={[employee]}
              employeeStats={monthData?.employeeStats || []}
              attendances={monthData?.attendances || []}
              year={selectedYear}
              month={selectedMonth}
              onDayClick={handleDayClick}
              schedule={employee.scheduleAssignment?.schedule}
            />
          </div>
        </>
      )}

      {/* Drawers et Dialogs */}
      <TodayAttendanceDrawer
        open={attendanceDrawerOpen}
        onOpenChange={setAttendanceDrawerOpen}
        employee={{
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          avatar: employee.avatar || undefined,
          position: employee.position
        }}
        existingAttendance={getTodayAttendance()}
      />

      <MonthManagementDialog
        open={monthManagementOpen}
        onOpenChange={setMonthManagementOpen}
        year={openMonth?.year || getNextMonthToOpen().year}
        month={openMonth?.month || getNextMonthToOpen().month}
        currentStatus={openMonth?.status}
      />
    </div>
  )
}
