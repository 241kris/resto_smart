"use client"

import { useState } from "react"
import { CalendarPlus, Check, ChevronDown, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useEmployees } from "@/lib/hooks/useEmployees"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface CreateScheduleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export default function CreateScheduleDrawer({ open, onOpenChange }: CreateScheduleDrawerProps) {
  const { data: employeesData } = useEmployees()
  const queryClient = useQueryClient()

  // Étapes
  const [currentStep, setCurrentStep] = useState(1)

  // Planning
  const [customName, setCustomName] = useState('')
  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>([])
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([])
  const [currentWorkStart, setCurrentWorkStart] = useState('07:00')
  const [currentWorkEnd, setCurrentWorkEnd] = useState('20:00')
  const [selectedWorkDays, setSelectedWorkDays] = useState<DayOfWeek[]>([])
  const [showWorkScheduleSelection, setShowWorkScheduleSelection] = useState(false)

  // Employés à assigner
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])

  // Soumission
  const [isSubmitting, setIsSubmitting] = useState(false)

  const employees = employeesData?.employees || []

  const toggleWorkingDay = (day: DayOfWeek) => {
    setWorkingDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const getUnassignedWorkDays = () => {
    const assignedDays = workSchedules.flatMap(ws => ws.days)
    return workingDays.filter(d => !assignedDays.includes(d))
  }

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

    const remainingDays = getUnassignedWorkDays().filter(d => !selectedWorkDays.includes(d))
    if (remainingDays.length > 0) {
      toast.info(`Veuillez préciser les horaires de travail pour les ${remainingDays.length} autre${remainingDays.length > 1 ? 's' : ''} jour${remainingDays.length > 1 ? 's' : ''}`)
    } else {
      toast.success('Horaire de travail ajouté')
    }
  }

  const getWorkScheduleForDay = (day: DayOfWeek) => {
    return workSchedules.find(ws => ws.days.includes(day))
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (workingDays.length === 0) {
        toast.error('Veuillez sélectionner au moins un jour de travail')
        return
      }
      if (!customName.trim()) {
        toast.error('Veuillez donner un nom au planning')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      const unassignedDays = getUnassignedWorkDays()
      if (unassignedDays.length > 0) {
        toast.error('Veuillez définir les horaires de travail pour tous les jours')
        return
      }
      setCurrentStep(3)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

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

      const response = await fetch('/api/schedules/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customName.trim(),
          days: allDays,
          employeeIds: selectedEmployeeIds
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      toast.success('Planning créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })

      onOpenChange(false)
      handleReset()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du planning')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setCustomName('')
    setWorkingDays([])
    setWorkSchedules([])
    setSelectedEmployeeIds([])
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(handleReset, 300)
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
              {currentStep === 3 && "Assignez des employés au planning (optionnel)"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6 space-y-6">
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

            {/* ÉTAPE 1: Jours de travail et nom */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Sélectionner les jours de travail</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez quels jours de la semaine seront travaillés
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
                        <p className="text-xs text-muted-foreground mb-3">Cochez les jours qui seront travaillés</p>
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

                {workingDays.length > 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-semibold mb-3">Jours sélectionnés ({workingDays.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {daysConfig.map(day => {
                          const isWorking = workingDays.includes(day.value)
                          return (
                            <Badge
                              key={day.value}
                              className={isWorking ? "bg-green-600 text-white" : ""}
                              variant={isWorking ? "default" : "outline"}
                            >
                              {day.label}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>

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

            {/* ÉTAPE 3: Sélection des employés */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Assigner des employés (optionnel)</Label>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez les employés qui utiliseront ce planning. Vous pourrez aussi le faire plus tard.
                  </p>
                </div>

                {employees.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Aucun employé disponible
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleEmployeeSelection(employee.id)}
                      >
                        <Checkbox
                          checked={selectedEmployeeIds.includes(employee.id)}
                          onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                        {employee.scheduleAssignment && (
                          <Badge variant="outline" className="text-xs">
                            A déjà un planning
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedEmployeeIds.length > 0 && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-semibold">
                      {selectedEmployeeIds.length} employé{selectedEmployeeIds.length > 1 ? 's' : ''} sélectionné{selectedEmployeeIds.length > 1 ? 's' : ''}
                    </p>
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
                  disabled={isSubmitting}
                  className="flex-1 gap-2"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {isSubmitting ? 'Création en cours...' : 'Créer le planning'}
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
