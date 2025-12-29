"use client"

import { useState } from "react"
import {
  Plus,
  MoreVertical,
  Search,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  Files,
  Calendar,
  Link,
  CheckCircle2,
  Circle
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ConfirmDialog from "@/components/ConfirmDialog"
import EmployeeDetailsPage from "@/components/EmployeeDetailsPage"
import EmployeeFormPage from "@/components/EmployeeFormPage"
import EmployeeDocumentsDrawer from "@/components/EmployeeDocumentsDrawer"
import EmployeeDocumentsPage from "@/components/EmployeeDocumentsPage"
import EmployeeSchedulePage from "@/components/EmployeeSchedulePage"
import AssignScheduleDialog from "@/components/AssignScheduleDialog"
import {
  useEmployees,
  useDeleteEmployee,
  useUpdateEmployeeStatus,
  type Employee,
  type EmployeeSchedule
} from "@/lib/hooks/useEmployees"
import { useQueryClient } from "@tanstack/react-query"
import Image from "next/image"

export default function EmployeesPage() {
  const { data, isLoading, error } = useEmployees()
  const deleteMutation = useDeleteEmployee()
  const updateStatusMutation = useUpdateEmployeeStatus()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<'list' | 'details' | 'form' | 'documents' | 'schedule'>('list')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<EmployeeSchedule | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<{ employee: Employee; status: Employee['status'] } | null>(null)
  const [documentDrawerOpen, setDocumentDrawerOpen] = useState(false)
  const [documentEmployee, setDocumentEmployee] = useState<Employee | null>(null)
  const [assignScheduleDialogOpen, setAssignScheduleDialogOpen] = useState(false)
  const [assignScheduleEmployee, setAssignScheduleEmployee] = useState<Employee | null>(null)

  const employees = data?.employees || []

  const filteredEmployees = employees.filter(employee =>
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone.includes(searchTerm) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Afficher les détails
  const handleShowDetails = (employee: Employee) => {
    setSelectedEmployee(employee)
    setViewMode('details')
  }

  // Retour à la liste
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedEmployee(null)
  }

  // Ouvrir le formulaire de création
  const handleOpenCreate = () => {
    setEditingEmployee(null)
    setViewMode('form')
  }

  // Ouvrir le formulaire de modification
  const handleOpenEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setViewMode('form')
  }

  // Supprimer un employé
  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return
    await deleteMutation.mutateAsync(deletingEmployee.id)
    setDeletingEmployee(null)
  }

  // Mettre à jour le statut
  const handleUpdateStatus = async (employee: Employee, status: Employee['status']) => {
    setUpdatingStatus({ employee, status })
  }

  const confirmStatusUpdate = async () => {
    if (!updatingStatus) return
    await updateStatusMutation.mutateAsync({
      id: updatingStatus.employee.id,
      status: updatingStatus.status
    })
    setUpdatingStatus(null)
  }

  // Ouvrir la modal pour ajouter un document
  const handleAddDocument = (employee: Employee) => {
    setDocumentEmployee(employee)
    setDocumentDrawerOpen(true)
  }

  // Ouvrir la page des documents
  const handleShowDocuments = (employee: Employee) => {
    setSelectedEmployee(employee)
    setViewMode('documents')
  }

  // Ouvrir le dialog pour assigner un planning
  const handleAssignSchedule = (employee: Employee) => {
    setAssignScheduleEmployee(employee)
    setAssignScheduleDialogOpen(true)
  }

  // Assigner un planning à un employé
  const handleAssignScheduleToEmployee = async (scheduleId: string) => {
    if (!assignScheduleEmployee) return

    const response = await fetch(`/api/employees/${assignScheduleEmployee.id}/assign-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scheduleId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de l\'assignation')
    }

    // Rafraîchir les données
    queryClient.invalidateQueries({ queryKey: ['employees'] })
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
  }

  // Ouvrir la page d'un planning
  const handleShowSchedule = (employee: Employee, schedule: EmployeeSchedule) => {
    setSelectedEmployee(employee)
    setSelectedSchedule(schedule)
    setViewMode('schedule')
  }

  // Afficher le formulaire si en mode form
  if (viewMode === 'form') {
    return (
      <EmployeeFormPage
        employee={editingEmployee}
        onBack={handleBackToList}
      />
    )
  }

  // Afficher la page des documents si en mode documents
  if (viewMode === 'documents' && selectedEmployee) {
    return (
      <EmployeeDocumentsPage
        employee={selectedEmployee}
        onBack={handleBackToList}
      />
    )
  }

  // Afficher la page de planning si en mode schedule
  if (viewMode === 'schedule' && selectedEmployee && selectedSchedule) {
    return (
      <EmployeeSchedulePage
        employee={selectedEmployee}
        schedule={selectedSchedule}
        onBack={handleBackToList}
      />
    )
  }

  // Afficher la page de détails si en mode details
  if (viewMode === 'details' && selectedEmployee) {
    return (
      <EmployeeDetailsPage
        employee={selectedEmployee}
        onBack={handleBackToList}
      />
    )
  }

  // Affichage du loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Erreur lors du chargement des employés</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusBadge = (status: Employee['status']) => {
    const variants = {
      ACTIVE: { label: "Actif", variant: "default" as const },
      ON_LEAVE: { label: "En congé", variant: "secondary" as const },
      SUSPENDED: { label: "Suspendu", variant: "outline" as const },
      TERMINATED: { label: "Résilié", variant: "destructive" as const },
    }
    return variants[status]
  }

  // Fonction pour obtenir le label du poste
  const getPositionLabel = (position: Employee['position']) => {
    const labels = {
      WAITER: "Serveur",
      COOK: "Cuisinier",
      CHEF: "Chef",
      CASHIER: "Caissier",
      MANAGER: "Manager",
      DELIVERY: "Livreur"
    }
    return labels[position]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employés</h1>
          <p className="text-muted-foreground">
            Gérez votre équipe et leurs informations
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel employé
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des employés */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Aucun employé trouvé pour cette recherche" : "Aucun employé enregistré"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => {
            const statusBadge = getStatusBadge(employee.status)

            return (
              <Card key={employee.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative h-16 w-16 rounded-full bg-muted flex-shrink-0">
                      {employee.avatar ? (
                        <Image
                          src={employee.avatar}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          fill
                          className="object-cover rounded-lg"
                          unoptimized
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-2xl font-semibold text-muted-foreground">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Informations principales */}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>

                      <CardDescription className="space-y-1">

                        {/* Poste */}
                        <div className="text-sm font-medium text-primary">
                          {getPositionLabel(employee.position)}
                        </div>

                        {/* Téléphone */}
                        {employee.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>{employee.phone}</span>
                          </div>
                        )}

                        {/* Email */}
                        {employee.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span>{employee.email}</span>
                          </div>
                        )}

                        {/* Adresse */}
                        {employee.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{employee.address}</span>
                          </div>
                        )}

                        {/* Documents */}
                        {employee.documents && employee.documents.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span>{employee.documents.length} document{employee.documents.length > 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {/* Planning */}
                        {employee.scheduleAssignment && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{employee.scheduleAssignment.schedule?.name}</span>
                          </div>
                        )}

                      </CardDescription>
                    </div>

                  </div>

                  {/* Badge de statut */}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Dropdown Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full gap-2">
                        <MoreVertical className="h-4 w-4" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleShowDetails(employee)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir les détails
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Sous-menu pour changer le statut */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Changer le statut
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {employee.status !== 'ACTIVE' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(employee, 'ACTIVE')}>
                                Marquer comme actif
                              </DropdownMenuItem>
                            )}
                            {employee.status !== 'ON_LEAVE' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(employee, 'ON_LEAVE')}>
                                Mettre en congé
                              </DropdownMenuItem>
                            )}
                            {employee.status !== 'SUSPENDED' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(employee, 'SUSPENDED')}>
                                Suspendre
                              </DropdownMenuItem>
                            )}
                            {employee.status !== 'TERMINATED' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(employee, 'TERMINATED')}>
                                Résilier
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Sous-menu pour les documents */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Files className="mr-2 h-4 w-4" />
                          Documents
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleAddDocument(employee)}>
                              <Upload className="mr-2 h-4 w-4" />
                              Fournir un document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowDocuments(employee)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Voir les documents ({employee.documents?.length || 0})
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Sous-menu pour les plannings */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Calendar className="mr-2 h-4 w-4" />
                          Planning
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {employee.scheduleAssignment?.schedule ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleShowSchedule(employee, employee.scheduleAssignment!.schedule!)}
                                >
                                  {employee.scheduleAssignment.schedule.status === 'ACTIVE' ? (
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  ) : (
                                    <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="truncate">{employee.scheduleAssignment.schedule.name}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleAssignSchedule(employee)}>
                                  <Link className="mr-2 h-4 w-4" />
                                  Changer de planning
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => handleAssignSchedule(employee)}>
                                <Link className="mr-2 h-4 w-4" />
                                Assigner un planning
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => handleOpenEdit(employee)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingEmployee(employee)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={!!deletingEmployee}
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
        title="Supprimer l'employé"
        description={`Êtes-vous sûr de vouloir supprimer ${deletingEmployee?.firstName} ${deletingEmployee?.lastName} ? Cette action ne peut pas être annulée.`}
        onConfirm={handleDeleteEmployee}
        isLoading={deleteMutation.isPending}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Dialog de confirmation de changement de statut */}
      <ConfirmDialog
        open={!!updatingStatus}
        onOpenChange={(open) => !open && setUpdatingStatus(null)}
        title="Changer le statut"
        description={`Êtes-vous sûr de vouloir changer le statut de ${updatingStatus?.employee.firstName} ${updatingStatus?.employee.lastName} à "${getStatusBadge(updatingStatus?.status || 'ACTIVE').label}" ?`}
        onConfirm={confirmStatusUpdate}
        isLoading={updateStatusMutation.isPending}
        confirmText="Confirmer"
        cancelText="Annuler"
      />

      {/* Drawer pour ajouter un document */}
      {documentEmployee && (
        <EmployeeDocumentsDrawer
          open={documentDrawerOpen}
          onOpenChange={setDocumentDrawerOpen}
          employee={documentEmployee}
        />
      )}

      {/* Dialog pour assigner un planning */}
      {assignScheduleEmployee && (
        <AssignScheduleDialog
          open={assignScheduleDialogOpen}
          onOpenChange={setAssignScheduleDialogOpen}
          employeeId={assignScheduleEmployee.id}
          employeeName={`${assignScheduleEmployee.firstName} ${assignScheduleEmployee.lastName}`}
          onAssign={handleAssignScheduleToEmployee}
        />
      )}
    </div>
  )
}
