"use client"

import { useState } from "react"
import { Calendar, Clock, Users, ArrowLeft, Check, Plus, Trash2, CalendarPlus, ChevronRight, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEmployees } from "@/lib/hooks/useEmployees"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreateScheduleFlowProps {
    onBack: () => void
    onSuccess: () => void
}

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

const daysConfig: { value: DayOfWeek; label: string }[] = [
    { value: 'MONDAY', label: 'Lundi' },
    { value: 'TUESDAY', label: 'Mardi' },
    { value: 'WEDNESDAY', label: 'Mercredi' },
    { value: 'THURSDAY', label: 'Jeudi' },
    { value: 'FRIDAY', label: 'Vendredi' },
    { value: 'SATURDAY', label: 'Samedi' },
    { value: 'SUNDAY', label: 'Dimanche' },
]

interface DaySchedule {
    dayOfWeek: DayOfWeek
    isWorkingDay: boolean
    startTime: string
    endTime: string
}

export default function CreateScheduleFlow({ onBack, onSuccess }: CreateScheduleFlowProps) {
    const { data: employeesData } = useEmployees()
    const queryClient = useQueryClient()

    // Étapes
    const [currentStep, setCurrentStep] = useState(1)

    // Form data
    const [name, setName] = useState('')
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])

    // Initialize with all days, but only selected ones will be sent as working
    const [daySchedules, setDaySchedules] = useState<Record<DayOfWeek, { startTime: string; endTime: string }>>(
        daysConfig.reduce((acc, day) => ({
            ...acc,
            [day.value]: { startTime: '08:00', endTime: '17:00' }
        }), {} as Record<DayOfWeek, { startTime: string; endTime: string }>)
    )

    const handleSelectAll = () => {
        setSelectedDays(daysConfig.map(d => d.value))
    }

    const handleSelectWeekdays = () => {
        setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])
    }

    const handleApplyToAll = (sourceDay: DayOfWeek) => {
        const { startTime, endTime } = daySchedules[sourceDay]
        setDaySchedules(prev => {
            const next = { ...prev }
            selectedDays.forEach(day => {
                next[day] = { startTime, endTime }
            })
            return next
        })
        toast.success("Horaires appliqués à tous les jours sélectionnés")
    }

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const employees = employeesData?.employees || []

    const toggleDay = (day: DayOfWeek) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    const handleTimeChange = (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => {
        setDaySchedules(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }))
    }

    const toggleEmployee = (id: string) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
        )
    }

    const handleNext = () => {
        if (currentStep === 1) {
            if (!name.trim()) return toast.error("Veuillez donner un nom au planning")
            if (selectedDays.length === 0) return toast.error("Sélectionnez au moins un jour de travail")
            setCurrentStep(2)
        } else if (currentStep === 2) {
            setCurrentStep(3)
        }
    }

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)

            const daysPayload = daysConfig.map(d => ({
                dayOfWeek: d.value,
                isWorkingDay: selectedDays.includes(d.value),
                startTime: daySchedules[d.value].startTime,
                endTime: daySchedules[d.value].endTime
            }))

            const response = await fetch('/api/schedules/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    days: daysPayload,
                    employeeIds: selectedEmployeeIds
                }),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Erreur lors de la création')
            }

            toast.success('Planning créé avec succès')
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            queryClient.invalidateQueries({ queryKey: ['employees'] })
            onSuccess()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Nouveau Planning</h1>
                        <p className="text-sm text-muted-foreground">Temps de travail hebdomadaire</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                                currentStep === step ? "bg-primary border-primary text-primary-foreground shadow-md scale-110" :
                                    currentStep > step ? "bg-green-600 border-green-600 text-white" :
                                        "bg-background border-muted text-muted-foreground"
                            )}>
                                {currentStep > step ? <Check className="h-4 w-4" /> : step}
                            </div>
                            {step < 3 && (
                                <div className={cn(
                                    "h-[2px] w-8 mx-1 transition-colors",
                                    currentStep > step ? "bg-green-600" : "bg-muted"
                                )} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="space-y-6">
                {currentStep === 1 && (
                    <Card className="border-2 border-primary/10 shadow-sm">
                        <CardHeader className="bg-primary/5 pb-6">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Étape 1 : Informations de base
                            </CardTitle>
                            <CardDescription>Nom du planning et jours de travail hebdomadaires</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            <div className="space-y-3">
                                <Label htmlFor="sc-name" className="text-base font-semibold">Comment s'appelle ce planning ? *</Label>
                                <Input
                                    id="sc-name"
                                    placeholder="Ex: Équipe Week-end, Planning Standard, etc."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 text-lg"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <Label className="text-base font-semibold">Jours de travail *</Label>
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-[10px] h-7 px-2">Tout</Button>
                                        <Button variant="outline" size="sm" onClick={handleSelectWeekdays} className="text-[10px] h-7 px-2">Lun-Ven</Button>
                                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-2 py-0.5 ml-auto sm:ml-2">
                                            {selectedDays.length} sélec.
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 md:gap-3">
                                    {daysConfig.map(day => {
                                        const isSelected = selectedDays.includes(day.value)
                                        return (
                                            <button
                                                key={day.value}
                                                onClick={() => toggleDay(day.value)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all hover:shadow-md",
                                                    isSelected
                                                        ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20 scale-105"
                                                        : "bg-background border-muted text-muted-foreground hover:border-primary/50"
                                                )}
                                            >
                                                <span className="text-xs font-bold uppercase mb-1">{day.label.slice(0, 3)}</span>
                                                <span className="text-sm font-medium">{day.label}</span>
                                                <div className={cn(
                                                    "mt-2 h-2 w-2 rounded-full",
                                                    isSelected ? "bg-primary animate-pulse" : "bg-muted"
                                                )} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 2 && (
                    <Card className="border-2 border-primary/10 shadow-sm">
                        <CardHeader className="bg-primary/5 pb-6">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Étape 2 : Horaires de travail
                            </CardTitle>
                            <CardDescription>Configurez les horaires pour chaque jour</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table className="min-w-[600px] md:min-w-0">
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="w-[200px] pl-6 font-bold text-foreground">Jour</TableHead>
                                        <TableHead className="font-bold text-foreground">Début</TableHead>
                                        <TableHead className="font-bold text-foreground">Fin</TableHead>
                                        <TableHead className="text-center font-bold text-foreground">Actions</TableHead>
                                        <TableHead className="text-right pr-6 font-bold text-foreground">Aperçu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {daysConfig.filter(d => selectedDays.includes(d.value)).map(day => (
                                        <TableRow key={day.value} className="hover:bg-primary/5 transition-colors">
                                            <TableCell className="font-bold pl-6 py-4 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                {day.label}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="time"
                                                    value={daySchedules[day.value].startTime}
                                                    onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                                                    className="w-28 h-9 border-muted focus:ring-primary shadow-sm"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="time"
                                                    value={daySchedules[day.value].endTime}
                                                    onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                                                    className="w-28 h-9 border-muted focus:ring-primary shadow-sm"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleApplyToAll(day.value)}
                                                    className="h-8 text-[10px] text-primary hover:bg-primary/10 transition-colors"
                                                    title="Appliquer ces horaires à tous les jours sélectionnés"
                                                >
                                                    Appliquer à tous
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-mono text-xs">
                                                    {daySchedules[day.value].startTime} - {daySchedules[day.value].endTime}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 3 && (
                    <Card className="border-2 border-primary/10 shadow-sm">
                        <CardHeader className="bg-primary/5 pb-6">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Étape 3 : Assignation du personnel
                            </CardTitle>
                            <CardDescription>Sélectionnez les employés qui suivront ce planning</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-4">
                            <div className="relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto p-1">
                                    {employees.length === 0 ? (
                                        <div className="col-span-2 text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                                            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                            <p>Aucun employé disponible</p>
                                        </div>
                                    ) : (
                                        employees.map(employee => {
                                            const isSelected = selectedEmployeeIds.includes(employee.id)
                                            return (
                                                <div
                                                    key={employee.id}
                                                    onClick={() => toggleEmployee(employee.id)}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md group",
                                                        isSelected
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                                                            : "border-muted hover:border-primary/30 bg-background"
                                                    )}
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleEmployee(employee.id)}
                                                        className="h-5 w-5 rounded-md"
                                                    />
                                                    <Avatar className="h-10 w-10 border group-hover:scale-105 transition-transform">
                                                        <AvatarImage src={employee.avatar || undefined} />
                                                        <AvatarFallback>{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold truncate text-sm">{employee.firstName} {employee.lastName}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{employee.position}</p>
                                                    </div>
                                                    {employee.scheduleAssignment && (
                                                        <Badge variant="secondary" className="text-[10px] h-5">Assigné</Badge>
                                                    )}
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                                <div className="text-xs font-medium text-muted-foreground order-2 sm:order-1">
                                    {selectedEmployeeIds.length} employé{selectedEmployeeIds.length > 1 ? 's' : ''} sélectionné{selectedEmployeeIds.length > 1 ? 's' : ''}
                                </div>
                                {selectedEmployeeIds.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEmployeeIds([])} className="h-8 text-[10px] text-destructive hover:bg-destructive/10 order-1 sm:order-2">
                                        Effacer la sélection
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-6 border-t gap-4">
                    <Button variant="ghost" onClick={currentStep === 1 ? onBack : () => setCurrentStep(prev => prev - 1)} className="gap-2 h-12">
                        <ArrowLeft className="h-4 w-4" />
                        {currentStep === 1 ? 'Annuler' : 'Retour'}
                    </Button>

                    {currentStep < 3 ? (
                        <Button onClick={handleNext} className="gap-2 flex-1 sm:flex-none px-8 h-12 md:h-14 text-base md:text-lg rounded-xl shadow-lg shadow-primary/20">
                            Suivant
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="gap-2 flex-1 sm:flex-none px-8 h-12 md:h-14 text-base md:text-lg rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                                    <span>Création...</span>
                                </>
                            ) : (
                                <>
                                    <CalendarPlus className="h-5 w-5" />
                                    <span>Créer</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
