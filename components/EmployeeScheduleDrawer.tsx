"use client"

import { useState } from "react"
import { CalendarPlus, Check, ChevronDown, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { Separator } from "@/components/ui/separator"
import { useCreateEmployeeSchedule, useEmployees, type Employee, type EmployeeSchedule } from "@/lib/hooks/useEmployees"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface EmployeeScheduleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
}

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

interface WorkSchedule {
  days: DayOfWeek[]
  startTime: string
  endTime: string
}

const daysConfig: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Lundi' },
  { value: 'TUESDAY', label: 'Mardi' },
  { value: 'WEDNESDAY', label: 'Mercredi' },
  { value: 'THURSDAY', label: 'Jeudi' },
  { value: 'FRIDAY', label: 'Vendredi' },
  { value: 'SATURDAY', label: 'Samedi' },
  { value: 'SUNDAY', label: 'Dimanche' },
]

export default function EmployeeScheduleDrawer({ open, onOpenChange, employee }: EmployeeScheduleDrawerProps) {
  const createScheduleMutation = useCreateEmployeeSchedule(employee.id)
  const { data: employeesData } = useEmployees()

  // Vérifier si l'employé a déjà un planning
  const hasExistingSchedule = !!employee.scheduleAssignment

  // Mode de création
  const [useExistingPlanning, setUseExistingPlanning] = useState(false)
  const [selectedExistingSchedule, setSelectedExistingSchedule] = useState<EmployeeSchedule | null>(null)
  const [customName, setCustomName] = useState('')

  // Étapes
  const [currentStep, setCurrentStep] = useState(1)

  // Étape 1: Jours de travail
  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>([])

  // Étape 2: Horaires de travail
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([])
  const [currentWorkStart, setCurrentWorkStart] = useState('07:00')
  const [currentWorkEnd, setCurrentWorkEnd] = useState('20:00')
  const [selectedWorkDays, setSelectedWorkDays] = useState<DayOfWeek[]>([])
  const [showWorkScheduleSelection, setShowWorkScheduleSelection] = useState(false)

  // Obtenir tous les plannings disponibles (des autres employés)
  const getAvailablePlannings = (): Array<{ employee: Employee; schedule: EmployeeSchedule }> => {
    if (!employeesData?.employees) return []

    const plannings: Array<{ employee: Employee; schedule: EmployeeSchedule }> = []
    const seenScheduleIds = new Set<string>()

    employeesData.employees.forEach(emp => {
      if (emp.id !== employee.id && emp.scheduleAssignment?.schedule) {
        const schedule = emp.scheduleAssignment.schedule
        // Éviter les doublons si plusieurs employés partagent le même planning
        if (!seenScheduleIds.has(schedule.id)) {
          seenScheduleIds.add(schedule.id)
          plannings.push({ employee: emp, schedule })
        }
      }
    })
    return plannings
  }

  // Basculer un jour de travail
  const toggleWorkingDay = (day: DayOfWeek) => {
    setWorkingDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  // Obtenir les jours de travail non encore affectés à un horaire
  const getUnassignedWorkDays = () => {
    const assignedDays = workSchedules.flatMap(ws => ws.days)
    return workingDays.filter(d => !assignedDays.includes(d))
  }

  // Ajouter un horaire de travail à tous les jours restants
  const applyWorkScheduleToAll = () => {
    const unassignedDays = getUnassignedWorkDays()
    if (unassignedDays.length === 0) {
      toast.error('Tous les jours ont déjà un horaire affecté')
      return
    }

    setWorkSchedules([...workSchedules, {
      days: unassignedDays,
      startTime: currentWorkStart,
      endTime: currentWorkEnd
    }])
    setShowWorkScheduleSelection(false)
    setSelectedWorkDays([])
    toast.success('Horaire de travail ajouté')
  }

  // Ajouter un horaire de travail à des jours sélectionnés
  const applyWorkScheduleToSelected = () => {
    if (selectedWorkDays.length === 0) {
      toast.error('Veuillez sélectionner au moins un jour')
      return
    }

    setWorkSchedules([...workSchedules, {
      days: selectedWorkDays,
      startTime: currentWorkStart,
      endTime: currentWorkEnd
    }])
    setShowWorkScheduleSelection(false)
    setSelectedWorkDays([])

    // Afficher un message si tous les jours ne sont pas configurés
    const remainingDays = getUnassignedWorkDays().filter(d => !selectedWorkDays.includes(d))
    if (remainingDays.length > 0) {
      toast.info(`Veuillez préciser les horaires de travail pour les ${remainingDays.length} autre${remainingDays.length > 1 ? 's' : ''} jour${remainingDays.length > 1 ? 's' : ''}`)
    } else {
      toast.success('Horaire de travail ajouté')
    }
  }

  // Obtenir l'horaire de travail d'un jour
  const getWorkScheduleForDay = (day: DayOfWeek) => {
    return workSchedules.find(ws => ws.days.includes(day))
  }

  // Passer à l'étape suivante
  const handleNext = () => {
    if (currentStep === 1) {
      if (useExistingPlanning) {
        if (!selectedExistingSchedule) {
          toast.error('Veuillez sélectionner un planning existant')
          return
        }
        // Aller directement à la validation si on utilise un planning existant
        setCurrentStep(3)
      } else {
        if (workingDays.length === 0) {
          toast.error('Veuillez sélectionner au moins un jour de travail')
          return
        }
        if (!customName.trim()) {
          toast.error('Veuillez donner un nom au planning')
          return
        }
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      // Vérifier que tous les jours ont un horaire
      const unassignedDays = getUnassignedWorkDays()
      if (unassignedDays.length > 0) {
        toast.error('Veuillez définir les horaires de travail pour tous les jours')
        return
      }
      setCurrentStep(3)
    }
  }

  // Retour à l'étape précédente
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Soumettre le planning
  const handleSubmit = async () => {
    try {
      if (useExistingPlanning && selectedExistingSchedule) {
        // Utiliser un planning existant
        const days = selectedExistingSchedule.days?.map(day => ({
          dayOfWeek: day.dayOfWeek,
          isWorkingDay: day.isWorkingDay,
          ...(day.isWorkingDay && day.startTime && day.endTime && {
            startTime: day.startTime,
            endTime: day.endTime
          })
        })) || []

        await createScheduleMutation.mutateAsync({
          name: selectedExistingSchedule.name,
          days
        })
      } else {
        // Créer un nouveau planning
        const allDays = daysConfig.map(dayConfig => {
          const isWorkingDay = workingDays.includes(dayConfig.value)
          const workSchedule = getWorkScheduleForDay(dayConfig.value)

          return {
            dayOfWeek: dayConfig.value,
            isWorkingDay,
            ...(isWorkingDay && workSchedule && {
              startTime: workSchedule.startTime,
              endTime: workSchedule.endTime
            })
          }
        })

        await createScheduleMutation.mutateAsync({
          name: customName.trim(),
          days: allDays
        })
      }

      toast.success('Planning créé avec succès')
      onOpenChange(false)

      // Réinitialiser
      setCurrentStep(1)
      setWorkingDays([])
      setWorkSchedules([])
      setUseExistingPlanning(false)
      setSelectedExistingSchedule(null)
      setCustomName('')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du planning')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Réinitialiser après fermeture
    setTimeout(() => {
      setCurrentStep(1)
      setWorkingDays([])
      setWorkSchedules([])
      setUseExistingPlanning(false)
      setSelectedExistingSchedule(null)
      setCustomName('')
    }, 300)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Créer un planning - Étape {currentStep}/3</DrawerTitle>
            <DrawerDescription>
              {currentStep === 1 && "Sélectionnez les jours de travail et donnez un nom au planning"}
              {currentStep === 2 && "Définissez les horaires de travail"}
              {currentStep === 3 && "Vérifiez et validez le planning"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* Avertissement si planning existant */}
            {hasExistingSchedule && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-800">Planning déjà existant</h3>
                    <p className="text-xs text-yellow-700 mt-1">
                      Cet employé possède déjà un planning assigné.
                      La création d'un nouveau planning remplacera le planning actuel.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Indicateur de progression */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${
                    step === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step < currentStep ? <Check className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && <div className={`h-1 w-12 ${step < currentStep ? 'bg-green-600' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            <Separator />

            {/* ÉTAPE 1: Sélection des jours de travail */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Choix du mode de création */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={!useExistingPlanning ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-start gap-1"
                    onClick={() => {
                      setUseExistingPlanning(false)
                      setSelectedExistingSchedule(null)
                    }}
                  >
                    <span className="font-semibold">Créer un nouveau planning</span>
                    <span className="text-xs opacity-80 font-normal">Définir un planning personnalisé</span>
                  </Button>
                  <Button
                    type="button"
                    variant={useExistingPlanning ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-start gap-1"
                    onClick={() => setUseExistingPlanning(true)}
                    disabled={getAvailablePlannings().length === 0}
                  >
                    <span className="font-semibold">Utiliser un planning existant</span>
                    <span className="text-xs opacity-80 font-normal">
                      {getAvailablePlannings().length} planning{getAvailablePlannings().length > 1 ? 's' : ''} disponible{getAvailablePlannings().length > 1 ? 's' : ''}
                    </span>
                  </Button>
                </div>

                <Separator />

                {/* Mode: Utiliser un planning existant */}
                {useExistingPlanning && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Sélectionner un planning existant</Label>
                      <p className="text-sm text-muted-foreground">
                        Choisissez un planning d'un autre employé à copier
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getAvailablePlannings().map(({ employee: emp, schedule }) => {
                        const isSelected = selectedExistingSchedule?.id === schedule.id
                        const workingDaysCount = schedule.days?.filter(d => d.isWorkingDay).length || 0
                        const totalHours = schedule.days?.reduce((sum, day) => {
                          if (!day.isWorkingDay) return sum
                          return sum + (day.dailyHoursManual || day.dailyHoursCalculated || 0)
                        }, 0) || 0

                        return (
                          <div
                            key={schedule.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedExistingSchedule(schedule)}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-sm">{schedule.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {emp.firstName} {emp.lastName}
                                  </p>
                                </div>
                                <Badge variant={schedule.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                  {schedule.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{workingDaysCount} jour{workingDaysCount > 1 ? 's' : ''}</span>
                                <span>•</span>
                                <span>{totalHours.toFixed(1)}h/semaine</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Mode: Créer un nouveau planning */}
                {!useExistingPlanning && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Sélectionner les jours de travail</Label>
                      <p className="text-sm text-muted-foreground">
                        Choisissez quels jours de la semaine l'employé travaillera
                      </p>
                    </div>

                    <Menubar className="w-full justify-start">
                    <MenubarMenu>
                      <MenubarTrigger className="w-full justify-between h-12">
                        {workingDays.length > 0
                          ? `${workingDays.length} jour${workingDays.length > 1 ? 's' : ''} sélectionné${workingDays.length > 1 ? 's' : ''}`
                          : 'Cliquez pour sélectionner les jours'
                        }
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </MenubarTrigger>
                      <MenubarContent className="w-[300px]">
                        <div className="px-2 py-2">
                          <p className="text-sm font-medium mb-2">Sélectionnez les jours de travail</p>
                          <p className="text-xs text-muted-foreground mb-3">Cochez les jours où l'employé travaillera</p>
                        </div>
                        {daysConfig.map(day => {
                          const isWorking = workingDays.includes(day.value)
                          return (
                            <MenubarCheckboxItem
                              key={day.value}
                              checked={isWorking}
                              onCheckedChange={() => toggleWorkingDay(day.value)}
                            >
                              {day.label}
                            </MenubarCheckboxItem>
                          )
                        })}
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>

                  {/* Affichage des jours sélectionnés */}
                  {workingDays.length > 0 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-semibold mb-3">Jours sélectionnés ({workingDays.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {daysConfig.map(day => {
                            const isWorking = workingDays.includes(day.value)
                            if (isWorking) {
                              return (
                                <Badge key={day.value} className="bg-green-600 text-white">
                                  {day.label}
                                </Badge>
                              )
                            }
                            return (
                              <Badge key={day.value} variant="outline" className="border-yellow-600 text-yellow-600">
                                {day.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>

                      {/* Nom personnalisé du planning */}
                      <div className="space-y-2">
                        <Label htmlFor="customName">Nom du planning *</Label>
                        <Input
                          id="customName"
                          placeholder="Ex: Planning Semaine, Équipe Matin, etc."
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Donnez un nom descriptif à ce planning
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}

            {/* ÉTAPE 2: Horaires de travail */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Définir les horaires de travail</Label>
                    <p className="text-sm text-muted-foreground">
                      Précisez les heures de début et de fin pour chaque jour de travail
                    </p>
                  </div>

                  {/* Formulaire d'ajout d'horaire */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-3">Nouvel horaire de travail</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Heure de début</Label>
                        <Input
                          type="time"
                          value={currentWorkStart}
                          onChange={(e) => setCurrentWorkStart(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Heure de fin</Label>
                        <Input
                          type="time"
                          value={currentWorkEnd}
                          onChange={(e) => setCurrentWorkEnd(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowWorkScheduleSelection(true)}
                      className="w-full"
                      disabled={getUnassignedWorkDays().length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {getUnassignedWorkDays().length === 0 ? 'Tous les horaires sont définis' : 'Appliquer cet horaire'}
                    </Button>
                  </div>

                  {/* Sélection des jours pour cet horaire */}
                  {showWorkScheduleSelection && (
                    <div className="p-4 bg-muted/30 rounded-lg border-2 border-primary animate-in slide-in-from-top-2">
                      <div className="mb-4">
                        <p className="font-semibold">À quels jours appliquer cet horaire ?</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sélectionnez un ou plusieurs jours
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto py-3"
                          onClick={applyWorkScheduleToAll}
                        >
                          <div className="flex flex-col items-start w-full">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              <span className="font-medium">Tous les jours restants</span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-6">
                              {getUnassignedWorkDays().length} jour{getUnassignedWorkDays().length > 1 ? 's' : ''} concerné{getUnassignedWorkDays().length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </Button>

                        <Separator className="my-3" />
                        <p className="text-xs text-muted-foreground mb-2">Ou choisissez les jours :</p>

                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {getUnassignedWorkDays().map(day => {
                            const dayLabel = daysConfig.find(d => d.value === day)?.label
                            const isSelected = selectedWorkDays.includes(day)
                            return (
                              <div
                                key={day}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                onClick={() => {
                                  setSelectedWorkDays(prev =>
                                    prev.includes(day)
                                      ? prev.filter(d => d !== day)
                                      : [...prev, day]
                                  )
                                }}
                              >
                                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                </div>
                                <span className="text-sm">{dayLabel}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={applyWorkScheduleToSelected}
                          disabled={selectedWorkDays.length === 0}
                          className="flex-1"
                        >
                          Appliquer à {selectedWorkDays.length} jour{selectedWorkDays.length > 1 ? 's' : ''}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowWorkScheduleSelection(false)
                            setSelectedWorkDays([])
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Affichage des horaires définis */}
                  {workSchedules.length > 0 && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-semibold mb-3">Horaires définis</p>
                      <div className="space-y-2">
                        {daysConfig.map(dayConfig => {
                          if (!workingDays.includes(dayConfig.value)) return null

                          const schedule = getWorkScheduleForDay(dayConfig.value)

                          return (
                            <div
                              key={dayConfig.value}
                              className={`p-3 rounded-lg border-2 ${
                                schedule
                                  ? 'border-green-600/20 bg-green-600/5'
                                  : 'border-yellow-600/20 bg-yellow-600/5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{dayConfig.label}</span>
                                {schedule ? (
                                  <span className="text-green-700 font-mono text-sm font-medium">
                                    {schedule.startTime} → {schedule.endTime}
                                  </span>
                                ) : (
                                  <span className="text-yellow-700 text-sm italic">
                                    En attente d'horaire
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ÉTAPE 3: Validation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {useExistingPlanning && selectedExistingSchedule ? (
                  /* Affichage du planning sélectionné pour validation */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Validation du planning</Label>
                      <p className="text-sm text-muted-foreground">
                        Vérifiez le planning avant de l'appliquer à {employee.firstName} {employee.lastName}
                      </p>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="mb-4">
                        <p className="font-semibold">{selectedExistingSchedule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {selectedExistingSchedule.days?.reduce((sum, day) => {
                            if (!day.isWorkingDay) return sum
                            return sum + (day.dailyHoursManual || day.dailyHoursCalculated || 0)
                          }, 0).toFixed(1)}h/semaine
                        </p>
                      </div>

                      <div className="space-y-2">
                        {daysConfig.map(dayConfig => {
                          const dayData = selectedExistingSchedule.days?.find(d => d.dayOfWeek === dayConfig.value)
                          if (!dayData) return null

                          return (
                            <div
                              key={dayConfig.value}
                              className={`p-3 rounded-lg border ${
                                dayData.isWorkingDay
                                  ? 'border-primary/20 bg-primary/5'
                                  : 'border-muted bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{dayConfig.label}</span>
                                {dayData.isWorkingDay ? (
                                  <p className="text-sm font-mono">
                                    {dayData.startTime} → {dayData.endTime}
                                  </p>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">Repos</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mode création manuelle - Récapitulatif */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Récapitulatif du planning</Label>
                      <p className="text-sm text-muted-foreground">
                        Vérifiez les horaires avant de valider
                      </p>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="mb-4">
                        <p className="font-semibold">{customName}</p>
                        <p className="text-sm text-muted-foreground">
                          {workingDays.length} jour{workingDays.length > 1 ? 's' : ''} de travail
                        </p>
                      </div>

                      <div className="space-y-2">
                        {daysConfig.map(dayConfig => {
                          const isWorkingDay = workingDays.includes(dayConfig.value)
                          const workSchedule = getWorkScheduleForDay(dayConfig.value)

                          return (
                            <div
                              key={dayConfig.value}
                              className={`p-3 rounded-lg border ${
                                isWorkingDay
                                  ? 'border-primary/20 bg-primary/5'
                                  : 'border-muted bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{dayConfig.label}</span>
                                {isWorkingDay && workSchedule ? (
                                  <span className="text-green-700 font-mono font-medium text-sm">
                                    {workSchedule.startTime} → {workSchedule.endTime}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">Repos</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DrawerFooter>
            <div className="flex gap-2 w-full">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious} className="flex-1">
                  Précédent
                </Button>
              )}
              {currentStep < 3 ? (
                <Button onClick={handleNext} className="flex-1">
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createScheduleMutation.isPending}
                  className="flex-1 gap-2"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {createScheduleMutation.isPending ? 'Création en cours...' : 'Valider le planning'}
                </Button>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
