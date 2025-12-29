"use client"

import { useState } from "react"
import {
  X,
  Plus,
  Calendar,
  Check,
  Ban,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  useEmployeeLeaves,
  useLeavePeriod,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  getLeaveStatusColor,
  type LeaveType,
  type LeaveStatus,
} from "@/lib/hooks/useLeavePeriod"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface LeavePeriodDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    position: string
  }
}

const leaveTypeOptions: { value: LeaveType; label: string }[] = [
  { value: "ANNUAL_LEAVE", label: "Congés annuels" },
  { value: "SICK_LEAVE", label: "Arrêt maladie" },
  { value: "MATERNITY_LEAVE", label: "Congé maternité" },
  { value: "PATERNITY_LEAVE", label: "Congé paternité" },
  { value: "UNPAID_LEAVE", label: "Congé sans solde" },
  { value: "REMOTE_WORK", label: "Télétravail" },
  { value: "TRAINING", label: "Formation" },
  { value: "OTHER", label: "Autre" },
]

export default function LeavePeriodDrawer({
  open,
  onOpenChange,
  employee,
}: LeavePeriodDrawerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all')

  // Form state
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [leaveType, setLeaveType] = useState<LeaveType>("ANNUAL_LEAVE")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  // Hooks
  const { data, isLoading } = useEmployeeLeaves(employee.id)
  const { createLeavePeriod, updateLeavePeriodStatus } = useLeavePeriod()

  const leavePeriods = data?.leavePeriods || []
  const stats = data?.stats

  // Filtrer les périodes
  const filteredPeriods =
    filterStatus === 'all'
      ? leavePeriods
      : leavePeriods.filter((p) => p.status === filterStatus)

  const handleCreatePeriod = async () => {
    if (!startDate || !endDate) {
      toast.error("Les dates de début et fin sont requises")
      return
    }

    try {
      await createLeavePeriod.mutateAsync({
        employeeId: employee.id,
        startDate,
        endDate,
        leaveType,
        reason: reason || undefined,
        notes: notes || undefined,
      })

      toast.success("Période d'absence créée avec succès")

      // Reset form
      setStartDate("")
      setEndDate("")
      setLeaveType("ANNUAL_LEAVE")
      setReason("")
      setNotes("")
      setShowCreateForm(false)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  const handleUpdateStatus = async (
    leavePeriodId: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED'
  ) => {
    try {
      await updateLeavePeriodStatus.mutateAsync({
        employeeId: employee.id,
        leavePeriodId,
        status,
      })

      const statusLabels = {
        APPROVED: 'approuvée',
        REJECTED: 'rejetée',
        CANCELLED: 'annulée',
      }

      toast.success(`Période ${statusLabels[status]} avec succès`)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour")
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[96vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.avatar || undefined} />
                  <AvatarFallback>
                    {employee.firstName[0]}{employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DrawerTitle className="text-lg">Périodes d'absence</DrawerTitle>
                  <DrawerDescription>
                    {employee.firstName} {employee.lastName} • {employee.position}
                  </DrawerDescription>
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4 overflow-y-auto max-h-[calc(96vh-140px)]">
            {/* Statistiques */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approuvées</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
                  <p className="text-xs text-muted-foreground">À venir</p>
                </div>
              </div>
            )}

            {/* Bouton créer et filtre */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex-1"
                variant={showCreateForm ? "outline" : "default"}
              >
                {showCreateForm ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle période
                  </>
                )}
              </Button>

              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as LeaveStatus | 'all')}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvées</SelectItem>
                  <SelectItem value="REJECTED">Rejetées</SelectItem>
                  <SelectItem value="CANCELLED">Annulées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Formulaire de création */}
            {showCreateForm && (
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Nouvelle période d'absence</CardTitle>
                  <CardDescription>
                    Les dates doivent être à partir d'aujourd'hui
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs">
                        Date de début <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={getMinDate()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-xs">
                        Date de fin <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || getMinDate()}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="leaveType" className="text-xs">
                      Type de congé <span className="text-red-500">*</span>
                    </Label>
                    <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                      <SelectTrigger id="leaveType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reason" className="text-xs">
                      Raison (optionnel)
                    </Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Motif de l'absence..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs">
                      Notes (optionnel)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes supplémentaires..."
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleCreatePeriod}
                    disabled={createLeavePeriod.isPending}
                    className="w-full"
                  >
                    {createLeavePeriod.isPending ? "Création..." : "Créer la période"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Liste des périodes */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredPeriods.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {filterStatus === 'all'
                      ? "Aucune période d'absence enregistrée"
                      : `Aucune période ${getLeaveStatusLabel(filterStatus).toLowerCase()}`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredPeriods.map((period) => {
                  const startDateObj = new Date(period.startDate)
                  const endDateObj = new Date(period.endDate)

                  return (
                    <Card key={period.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">
                                {getLeaveTypeLabel(period.leaveType)}
                              </p>
                              <Badge className={getLeaveStatusColor(period.status)}>
                                {getLeaveStatusLabel(period.status)}
                              </Badge>
                              {period.isCurrent && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  En cours
                                </Badge>
                              )}
                              {period.isUpcoming && (
                                <Badge variant="outline" className="text-xs">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  À venir
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(startDateObj, 'd MMM yyyy', { locale: fr })}
                              </span>
                              <span>→</span>
                              <span>
                                {format(endDateObj, 'd MMM yyyy', { locale: fr })}
                              </span>
                              <span className="text-xs">
                                ({period.daysCount} jour{period.daysCount! > 1 ? 's' : ''})
                              </span>
                            </div>

                            {period.reason && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {period.reason}
                              </p>
                            )}

                            {period.notes && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <p className="font-medium mb-0.5">Notes:</p>
                                <p className="text-muted-foreground">{period.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions (si en attente) */}
                        {period.status === 'PENDING' && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-green-600 hover:bg-green-50 border-green-200"
                              onClick={() => handleUpdateStatus(period.id, 'APPROVED')}
                              disabled={updateLeavePeriodStatus.isPending}
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() => handleUpdateStatus(period.id, 'REJECTED')}
                              disabled={updateLeavePeriodStatus.isPending}
                            >
                              <Ban className="h-3.5 w-3.5 mr-1.5" />
                              Rejeter
                            </Button>
                          </div>
                        )}

                        {/* Action annuler (si approuvé ou en attente) */}
                        {(period.status === 'APPROVED' || period.status === 'PENDING') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-gray-600 hover:bg-gray-50"
                            onClick={() => handleUpdateStatus(period.id, 'CANCELLED')}
                            disabled={updateLeavePeriodStatus.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Annuler cette période
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium">Gestion des absences</p>
                  <p className="text-xs mt-1 text-blue-700 dark:text-blue-200">
                    Les périodes approuvées empêchent le pointage manuel pour les jours concernés.
                    Les périodes doivent être créées à partir d'aujourd'hui.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
