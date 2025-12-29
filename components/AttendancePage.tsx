"use client"

import { useState } from "react"
import {
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
  AlertCircle,
  Lock,
  LockOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMonthlyAttendance } from "@/lib/hooks/useAttendance"
import { useEmployees } from "@/lib/hooks/useEmployees"
import { toast } from "sonner"
import TodayAttendanceDrawer from "./TodayAttendanceDrawer"
import MonthManagementDialog from "./MonthManagementDialog"
import LeavePeriodDrawer from "./LeavePeriodDrawer"
import EmployeeAttendanceCard from "./EmployeeAttendanceCard"

export default function AttendancePage() {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [attendanceDrawerOpen, setAttendanceDrawerOpen] = useState(false)
  const [leavePeriodDrawerOpen, setLeavePeriodDrawerOpen] = useState(false)
  const [monthManagementOpen, setMonthManagementOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  // Récupérer les données du mois
  const { data: monthData, isLoading: isLoadingMonth } = useMonthlyAttendance(selectedYear, selectedMonth)
  const { data: employeesData } = useEmployees()

  const employees = employeesData?.employees || []
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1
  const monthStatus = monthData?.month?.status
  const isMonthOpen = monthStatus === 'OPEN'
  const isMonthClosed = monthStatus === 'CLOSED'

  // Navigation mois précédent/suivant
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    // Empêcher d'aller vers le futur
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1

    // Si on essaie d'aller dans le futur, bloquer
    if (nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth)) {
      toast.error("Impossible de naviguer vers un mois futur")
      return
    }

    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // Obtenir le pointage du jour pour un employé
  const getTodayAttendance = (employeeId: string) => {
    if (!monthData?.attendances) return null

    const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0]

    return monthData.attendances.find(
      a => a.employeeId === employeeId && a.date.split('T')[0] === todayStr
    )
  }

  // Obtenir les stats d'un employé
  const getEmployeeStats = (employeeId: string) => {
    return monthData?.employeeStats?.find(s => s.employee.id === employeeId)
  }

  // Ouvrir le drawer de pointage
  const handleOpenAttendanceDrawer = (employee: any) => {
    setSelectedEmployee(employee)
    setAttendanceDrawerOpen(true)
  }

  // Ouvrir le drawer de période d'absence
  const handleOpenLeavePeriodDrawer = (employee: any) => {
    setSelectedEmployee(employee)
    setLeavePeriodDrawerOpen(true)
  }

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pointages</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Gérez les présences et absences de vos employés
          </p>
        </div>
      </div>

      {/* Sélecteur de mois et statut */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground hidden md:block" />
                <div>
                  <p className="font-semibold text-base md:text-lg">
                    {monthNames[selectedMonth - 1]} {selectedYear}
                  </p>
                  {isCurrentMonth && (
                    <p className="text-xs text-muted-foreground">Mois en cours</p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                disabled={isCurrentMonth}
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {monthStatus && (
                <Badge
                  variant={isMonthOpen ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  {isMonthOpen ? (
                    <>
                      <LockOpen className="h-3 w-3" />
                      <span className="hidden sm:inline">Mois ouvert</span>
                      <span className="sm:hidden">Ouvert</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span className="hidden sm:inline">Mois clôturé</span>
                      <span className="sm:hidden">Clôturé</span>
                    </>
                  )}
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthManagementOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Gérer le mois</span>
                <span className="md:hidden">Mois</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Statistiques globales */}
        {monthData?.globalStats && (
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-muted-foreground">Employés</span>
                <span className="text-xl md:text-2xl font-bold">{monthData.globalStats.totalEmployees}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-muted-foreground">Pointages</span>
                <span className="text-xl md:text-2xl font-bold">{monthData.globalStats.totalAttendances}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-muted-foreground">Présents</span>
                <span className="text-xl md:text-2xl font-bold text-green-600">{monthData.globalStats.totalPresent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm text-muted-foreground">Heures</span>
                <span className="text-xl md:text-2xl font-bold">{monthData.globalStats.totalWorkedHours}h</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Message si le mois n'est pas ouvert */}
      {!monthStatus && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-base">Mois non ouvert</CardTitle>
                <CardDescription className="mt-1.5">
                  Le mois {monthNames[selectedMonth - 1]} {selectedYear} n'est pas encore ouvert.
                  Ouvrez-le pour commencer à enregistrer les pointages.
                </CardDescription>
                <Button
                  onClick={() => setMonthManagementOpen(true)}
                  className="mt-3"
                  size="sm"
                >
                  Ouvrir le mois
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Liste des employés */}
      {isLoadingMonth ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : employees.length === 0 ? (
        <Card>
          <CardHeader>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Aucun employé trouvé. Ajoutez des employés pour commencer.
              </p>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
          {employees.map((employee) => {
            const todayAttendance = getTodayAttendance(employee.id) || null
            const stats = getEmployeeStats(employee.id)

            return (
              <EmployeeAttendanceCard
                key={employee.id}
                employee={employee}
                todayAttendance={todayAttendance}
                stats={stats?.stats}
                isMonthOpen={isMonthOpen}
                onOpenAttendanceDrawer={handleOpenAttendanceDrawer}
                onOpenLeavePeriodDrawer={handleOpenLeavePeriodDrawer}
              />
            )
          })}
        </div>
      )}

      {/* Drawers et Dialogs */}
      {selectedEmployee && (
        <>
          <TodayAttendanceDrawer
            open={attendanceDrawerOpen}
            onOpenChange={setAttendanceDrawerOpen}
            employee={selectedEmployee}
            existingAttendance={getTodayAttendance(selectedEmployee.id)}
          />

          <LeavePeriodDrawer
            open={leavePeriodDrawerOpen}
            onOpenChange={setLeavePeriodDrawerOpen}
            employee={selectedEmployee}
          />
        </>
      )}

      <MonthManagementDialog
        open={monthManagementOpen}
        onOpenChange={setMonthManagementOpen}
        year={selectedYear}
        month={selectedMonth}
        currentStatus={monthStatus}
      />
    </div>
  )
}
