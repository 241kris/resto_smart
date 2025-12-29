"use client"

import { useState } from "react"
import { Calendar, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSchedules, type Schedule } from "@/lib/hooks/useSchedules"
import { toast } from "sonner"

interface AssignScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  employeeName: string
  onAssign: (scheduleId: string) => Promise<void>
}

export default function AssignScheduleDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onAssign
}: AssignScheduleDialogProps) {
  const { data, isLoading } = useSchedules()
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  const schedules = data?.schedules || []

  const handleAssign = async () => {
    if (!selectedScheduleId) {
      toast.error('Veuillez sélectionner un planning')
      return
    }

    setIsAssigning(true)
    try {
      await onAssign(selectedScheduleId)
      toast.success('Planning assigné avec succès')
      onOpenChange(false)
      setSelectedScheduleId(null)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'assignation')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assigner un planning</DialogTitle>
          <DialogDescription>
            Sélectionnez un planning à assigner à {employeeName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Aucun planning disponible. Créez d'abord des plannings depuis la section Plannings.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule) => {
              const workingDaysCount = schedule.days.filter(d => d.isWorkingDay).length
              const totalHours = schedule.days.reduce((sum, day) => {
                if (!day.isWorkingDay) return sum
                return sum + (day.dailyHoursManual || day.dailyHoursCalculated || 0)
              }, 0)

              const isSelected = selectedScheduleId === schedule.id

              return (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedScheduleId(schedule.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{schedule.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{workingDaysCount} jour{workingDaysCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{totalHours.toFixed(1)}h/sem</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{schedule.employeeAssignments.length} employé{schedule.employeeAssignments.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={schedule.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {schedule.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    {/* Aperçu des jours */}
                    <div className="grid grid-cols-7 gap-1">
                      {schedule.days.map((day) => {
                        const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
                        const dayIndex = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].indexOf(day.dayOfWeek)

                        return (
                          <div
                            key={day.id}
                            className={`text-center text-xs py-1 rounded ${
                              day.isWorkingDay
                                ? 'bg-green-100 text-green-700 font-medium'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {dayLabels[dayIndex]}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Annuler
          </Button>
          <Button onClick={handleAssign} disabled={!selectedScheduleId || isAssigning}>
            {isAssigning ? 'Assignation...' : 'Assigner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
