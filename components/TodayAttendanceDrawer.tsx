"use client"

import { useState, useEffect } from "react"
import { X, Clock, AlertCircle, CalendarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAttendance, type AttendanceStatus, type Attendance } from "@/lib/hooks/useAttendance"
import { useEmployees } from "@/lib/hooks/useEmployees"
import { toast } from "sonner"

interface TodayAttendanceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    position: string
  }
  existingAttendance?: Attendance | null
}

const statusOptions: { value: AttendanceStatus; label: string; description: string }[] = [
  { value: "PRESENT", label: "Présent", description: "L'employé est présent aujourd'hui" },
  { value: "ABSENT", label: "Absent", description: "Absent non justifié" },
  { value: "REST_DAY", label: "Jour de repos", description: "Repos selon planning" },
  { value: "LEAVE", label: "Congé", description: "Congé planifié" },
  { value: "SICK", label: "Maladie", description: "Arrêt maladie" },
  { value: "REMOTE", label: "Télétravail", description: "Travail à distance" },
  { value: "TRAINING", label: "Formation", description: "En formation" },
  { value: "OTHER", label: "Autre", description: "Autre motif" },
]

export default function TodayAttendanceDrawer({
  open,
  onOpenChange,
  employee,
  existingAttendance,
}: TodayAttendanceDrawerProps) {
  const { createTodayAttendance, updateTodayAttendance } = useAttendance()
  const { data: employeeData } = useEmployees()
  const isEditing = !!existingAttendance

  // Vérifier si c'est un jour de repos selon le planning
  const todayDate = new Date()
  const todayDayOfWeek = todayDate.getDay()
  const WEEKDAY_MAP: Record<number, string> = {
    1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY',
    5: 'FRIDAY', 6: 'SATURDAY', 0: 'SUNDAY'
  }

  const fullEmployee = employeeData?.employees?.find(e => e.id === employee.id)
  const scheduleDay = fullEmployee?.scheduleAssignment?.schedule?.days?.find(
    d => d.dayOfWeek === WEEKDAY_MAP[todayDayOfWeek]
  )
  const isRestDayInSchedule = scheduleDay ? !scheduleDay.isWorkingDay : false

  // Form state
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isException, setIsException] = useState(false)
  const [exceptionReason, setExceptionReason] = useState("")
  const [notes, setNotes] = useState("")

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (existingAttendance) {
      setStatus(existingAttendance.status)
      setStartTime(existingAttendance.startTime || "")
      setEndTime(existingAttendance.endTime || "")
      setIsException(existingAttendance.isException)
      setExceptionReason(existingAttendance.exceptionReason || "")
      setNotes(existingAttendance.notes || "")
    } else {
      // Réinitialiser pour un nouveau pointage
      setStatus("PRESENT")
      setStartTime("")
      setEndTime("")
      // Auto-activer isException si c'est un jour de repos
      setIsException(isRestDayInSchedule)
      setExceptionReason("")
      setNotes("")
    }
  }, [existingAttendance, open, isRestDayInSchedule])

  // Auto-activer isException si PRESENT et jour de repos
  useEffect(() => {
    if (status === "PRESENT" && isRestDayInSchedule) {
      setIsException(true)
    } else if (status !== "PRESENT") {
      setIsException(false)
      setExceptionReason("")
    }
  }, [status, isRestDayInSchedule])

  const handleSubmit = async () => {
    // Validation
    if (status === "PRESENT" && (!startTime || !endTime)) {
      toast.error("Les heures de début et fin sont requises pour un statut 'Présent'")
      return
    }

    // Si c'est un jour de repos et PRESENT, la raison est obligatoire
    if (status === "PRESENT" && isRestDayInSchedule && !exceptionReason) {
      toast.error("Une raison est requise car c'est un jour de repos selon le planning")
      return
    }

    const data = {
      employeeId: employee.id,
      status,
      startTime: status === "PRESENT" ? startTime : undefined,
      endTime: status === "PRESENT" ? endTime : undefined,
      isException,
      exceptionReason: isException ? exceptionReason : undefined,
      notes: notes || undefined,
    }

    try {
      if (isEditing) {
        await updateTodayAttendance.mutateAsync(data)
        toast.success("Pointage modifié avec succès")
      } else {
        await createTodayAttendance.mutateAsync(data)
        toast.success("Pointage créé avec succès")
      }
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde")
    }
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

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
                  <DrawerTitle className="text-lg">
                    {isEditing ? "Modifier le pointage" : "Pointer aujourd'hui"}
                  </DrawerTitle>
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

            <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground capitalize">{today}</span>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4 overflow-y-auto max-h-[calc(96vh-200px)]">
            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Statut <span className="text-red-500">*</span>
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heures (si présent) */}
            {status === "PRESENT" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    Heure de début <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="09:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    Heure de fin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="17:00"
                  />
                </div>
              </div>
            )}

            {/* Raison si jour de repos */}
            {status === "PRESENT" && isRestDayInSchedule && (
              <div className="space-y-2 border rounded-lg p-4 border-orange-300 bg-orange-50/50 dark:bg-orange-900/5">
                <Label htmlFor="exceptionReason" className="text-orange-900 dark:text-orange-100 font-medium">
                  Raison de présence (jour de repos) <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Selon le planning, aujourd'hui est un jour de repos. Indiquez la raison de la présence.
                </p>
                <Input
                  id="exceptionReason"
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="Ex: Renfort service, remplacement, urgence..."
                  autoFocus
                />
              </div>
            )}

             

             
          </div>

          <DrawerFooter className="pt-4 border-t">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createTodayAttendance.isPending || updateTodayAttendance.isPending}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createTodayAttendance.isPending || updateTodayAttendance.isPending}
                className="flex-1"
              >
                {createTodayAttendance.isPending || updateTodayAttendance.isPending
                  ? "Enregistrement..."
                  : isEditing
                  ? "Modifier"
                  : "Enregistrer"}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
