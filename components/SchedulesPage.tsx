"use client"

import { useState } from "react"
import { Calendar, Clock, Users, Trash2, Eye, AlertCircle, Plus, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ConfirmDialog from "@/components/ConfirmDialog"
import ScheduleDetailsPage from "@/components/ScheduleDetailsPage"
import CreateScheduleFlow from "@/components/CreateScheduleFlow"
import { useSchedules, useDeleteSchedule, type Schedule } from "@/lib/hooks/useSchedules"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SchedulesPage() {
  const { data, isLoading, error } = useSchedules()
  const deleteMutation = useDeleteSchedule()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<'list' | 'details' | 'create'>('list')
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null)

  const schedules = data?.schedules || []

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || schedule.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleShowDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setViewMode('details')
  }

  const handleBackToList = () => {
    setSelectedSchedule(null)
    setViewMode('list')
  }

  const handleDelete = async () => {
    if (!deletingSchedule) return

    try {
      await deleteMutation.mutateAsync(deletingSchedule.id)
      toast.success('Planning supprimé avec succès')
      setDeletingSchedule(null)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  // Afficher la création si en mode create
  if (viewMode === 'create') {
    return (
      <CreateScheduleFlow
        onBack={handleBackToList}
        onSuccess={() => {
          handleBackToList()
          queryClient.invalidateQueries({ queryKey: ['schedules'] })
        }}
      />
    )
  }

  // Afficher la page de détails si en mode details
  if (viewMode === 'details' && selectedSchedule) {
    return (
      <ScheduleDetailsPage
        schedule={selectedSchedule}
        onBack={handleBackToList}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des plannings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="mt-4 text-destructive">Erreur lors du chargement des plannings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plannings</h1>
          <p className="text-muted-foreground mt-2">
            Gérez tous les plannings de travail de votre établissement
          </p>
        </div>
        <Button onClick={() => setViewMode('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un planning
        </Button>
      </div>



      {/* Statistiques en liste */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-4 px-6 bg-muted/30 rounded-2xl border border-muted/50">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6  rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Plannings</p>
            <p className="text-sm font-bold">{schedules.length}</p>
          </div>
        </div>

        <div className="h-8 w-px bg-muted hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Actifs</p>
            <p className="text-sm font-bold text-green-600">
              {schedules.filter(s => s.status === 'ACTIVE').length}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-muted hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="h-6 w-6  rounded-full bg-blue-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Employés</p>
            <p className="text-sm font-bold">
              {schedules.reduce((acc, s) => acc + s.employeeAssignments.length, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des plannings */}
      {filteredSchedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun planning trouvé</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm
                ? "Aucun planning ne correspond à votre recherche."
                : "Créez des plannings depuis la page Employés en assignant des horaires à vos employés."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchedules.map((schedule) => {
            const workingDaysCount = schedule.days.filter(d => d.isWorkingDay).length
            const totalHours = schedule.days.reduce((sum, day) => {
              if (!day.isWorkingDay) return sum
              return sum + (day.dailyHoursManual || day.dailyHoursCalculated || 0)
            }, 0)

            return (
              <Card key={schedule.id} className="group overflow-hidden border-2 border-muted hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-background/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          schedule.status === 'ACTIVE' ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                        )} />
                        <span className="text-sm   font-semibold tracking-widest text-muted-foreground">
                          {schedule.status === 'ACTIVE' ? 'Travail en cours' : 'Hors service'}
                        </span>
                      </div>
                      <CardTitle className="text-sm group-hover:text-primary transition-colors">{schedule.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Statistiques du planning */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 p-3 rounded-xl border border-muted flex flex-col items-center justify-center text-center">
                      <Calendar className="h-4 w-4 mb-1 text-primary" />
                      <span className="text-xs font-bold">{workingDaysCount}</span>
                      <span className="text-[10px] text-muted-foreground">Jours/Sem</span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl border border-muted flex flex-col items-center justify-center text-center">
                      <Clock className="h-4 w-4 mb-1 text-blue-500" />
                      <span className="text-xs font-bold">{totalHours.toFixed(1)}h</span>
                      <span className="text-[10px] text-muted-foreground">Total/Heures</span>
                    </div>
                  </div>

                  {/* Employés assignés */}
                  {schedule.employeeAssignments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Employés :</p>
                      <div className="flex flex-wrap gap-2">
                        {schedule.employeeAssignments.slice(0, 3).map((assignment) => (
                          <div key={assignment.id} className="flex items-center gap-2 bg-muted rounded-full px-2 py-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={assignment.employee.avatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {assignment.employee.firstName[0]}{assignment.employee.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">
                              {assignment.employee.firstName} {assignment.employee.lastName}
                            </span>
                          </div>
                        ))}
                        {schedule.employeeAssignments.length > 3 && (
                          <div className="flex items-center justify-center bg-muted rounded-full px-2 py-1">
                            <span className="text-xs font-medium">
                              +{schedule.employeeAssignments.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"

                      onClick={() => handleShowDetails(schedule)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingSchedule(schedule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        open={!!deletingSchedule}
        onOpenChange={(open) => !open && setDeletingSchedule(null)}
        onConfirm={handleDelete}
        title="Supprimer ce planning ?"
        description={`Êtes-vous sûr de vouloir supprimer le planning "${deletingSchedule?.name}" ? Cette action supprimera toutes les assignations et ne peut pas être annulée.`}
        confirmText="Supprimer"
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />

    </div>
  )
}
