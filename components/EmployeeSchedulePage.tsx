"use client"

import { ArrowLeft, Clock, CheckCircle2, Circle, Moon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Employee, type EmployeeSchedule } from "@/lib/hooks/useEmployees"

interface EmployeeSchedulePageProps {
  employee: Employee
  schedule: EmployeeSchedule
  onBack: () => void
}

const daysLabels: Record<string, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
}

const daysLabelsFull: Record<string, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche',
}

export default function EmployeeSchedulePage({ employee, schedule, onBack }: EmployeeSchedulePageProps) {
  const days = schedule.days || []

  // Calculer le total d'heures hebdomadaires et de repos
  const totalWeeklyHours = days.reduce((sum, day) => {
    if (!day.isWorkingDay) return sum
    const hours = day.dailyHoursManual || day.dailyHoursCalculated || 0
    return sum + hours
  }, 0)

  const workingDaysCount = days.filter(d => d.isWorkingDay).length
  const restDaysCount = days.filter(d => !d.isWorkingDay).length

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 md:h-10 md:w-10">
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">{schedule.name}</h1>
            <Badge variant={schedule.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
              {schedule.status === 'ACTIVE' ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Actif
                </>
              ) : (
                <>
                  <Circle className="mr-1 h-3 w-3" />
                  Inactif
                </>
              )}
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {employee.firstName} {employee.lastName}
          </p>
        </div>
      </div>

      {/* Informations générales */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 md:pb-3 px-4 pt-4 md:px-6">
            <CardDescription className="text-xs">Heures hebdomadaires</CardDescription>
            <CardTitle className="text-lg md:text-xl">
              <Clock className="inline h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" />
              {totalWeeklyHours.toFixed(1)}h
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6">
            <p className="text-xs md:text-sm text-muted-foreground">
              Sur {workingDaysCount} jour{workingDaysCount > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3 px-4 pt-4 md:px-6">
            <CardDescription className="text-xs">Statut</CardDescription>
            <CardTitle className="text-lg md:text-xl">
              {schedule.status === 'ACTIVE' ? (
                <span className="text-green-600">
                  <CheckCircle2 className="inline h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" />
                  Actif
                </span>
              ) : (
                <span className="text-muted-foreground">
                  <Circle className="inline h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" />
                  Inactif
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Horaires par jour */}
      <Card>
        <CardHeader className="px-4 py-3 md:px-6 md:py-4">
          <CardTitle className="text-base md:text-lg">Horaires de la semaine</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Détail des horaires jour par jour
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6">
          <div className="space-y-2 md:space-y-3">
            {days.map((day) => {
              const dayLabelShort = daysLabels[day.dayOfWeek]
              const dayLabelFull = daysLabelsFull[day.dayOfWeek]
              const hours = day.dailyHoursManual || day.dailyHoursCalculated

              return (
                <div
                  key={day.id}
                  className={`p-3 md:p-4 rounded-lg border ${
                    day.isWorkingDay
                      ? 'border-primary/20 bg-primary/5'
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                      <div className="min-w-[50px] md:min-w-[80px]">
                        <span className={`text-sm md:text-base font-semibold ${!day.isWorkingDay && 'text-muted-foreground'}`}>
                          <span className="md:hidden">{dayLabelShort}</span>
                          <span className="hidden md:inline">{dayLabelFull}</span>
                        </span>
                      </div>

                      {day.isWorkingDay ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-mono text-xs md:text-sm">{day.startTime} → {day.endTime}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground italic">
                          <Moon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="text-xs md:text-sm">Repos</span>
                        </div>
                      )}
                    </div>

                    {day.isWorkingDay && hours !== null && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm md:text-base font-semibold">{hours.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">par jour</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Récapitulatif */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="px-4 py-3 md:px-6 md:py-4">
          <CardTitle className="text-base md:text-lg">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs md:text-sm text-muted-foreground">Jours travaillés</span>
            <span className="text-sm md:text-base font-semibold">{workingDaysCount} jour{workingDaysCount > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs md:text-sm text-muted-foreground">Jours de repos</span>
            <span className="text-sm md:text-base font-semibold">{restDaysCount} jour{restDaysCount > 1 ? 's' : ''}</span>
          </div>
          <div className="pt-2 border-t border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base font-semibold">Total hebdomadaire</span>
              <span className="text-base md:text-lg font-bold text-primary">{totalWeeklyHours.toFixed(1)}h</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs md:text-sm text-muted-foreground">Moyenne par jour travaillé</span>
            <span className="text-xs md:text-sm text-muted-foreground font-medium">{workingDaysCount > 0 ? (totalWeeklyHours / workingDaysCount).toFixed(1) : 0}h</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
