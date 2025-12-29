"use client"

import { useState } from "react"
import { Calendar, Clock, Users, Trash2, Eye, AlertCircle, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ConfirmDialog from "@/components/ConfirmDialog"
import ScheduleDetailsPage from "@/components/ScheduleDetailsPage"
import CreateScheduleDrawer from "@/components/CreateScheduleDrawer"
import { useSchedules, useDeleteSchedule, type Schedule } from "@/lib/hooks/useSchedules"
import { toast } from "sonner"

export default function SchedulesPage() {
  const { data, isLoading, error } = useSchedules()
  const deleteMutation = useDeleteSchedule()

  const [viewMode, setViewMode] = useState<'list' | 'details'>('list')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)

  const schedules = data?.schedules || []

  const filteredSchedules = schedules.filter(schedule =>
    schedule.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <Button onClick={() => setCreateDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un planning
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un planning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total plannings</CardDescription>
            <CardTitle className="text-3xl">{schedules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Plannings actifs</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {schedules.filter(s => s.status === 'ACTIVE').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Employés assignés</CardDescription>
            <CardTitle className="text-3xl">
              {schedules.reduce((acc, s) => acc + s.employeeAssignments.length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
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
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{schedule.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={schedule.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {schedule.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Statistiques du planning */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{workingDaysCount} jour{workingDaysCount > 1 ? 's' : ''} de travail</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{totalHours.toFixed(1)}h/semaine</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{schedule.employeeAssignments.length} employé{schedule.employeeAssignments.length > 1 ? 's' : ''}</span>
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
                      className="flex-1"
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

      {/* Drawer de création de planning */}
      <CreateScheduleDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
      />
    </div>
  )
}
