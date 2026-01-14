"use client"

import { useState } from "react"
import {
  Plus, MoreVertical, Search, Eye, Pencil, Trash2,
  Users, UserPlus, ChevronRight,
  CheckCircle2, Clock
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import ConfirmDialog from "@/components/ConfirmDialog"
import EmployeeDetailsPage from "@/components/EmployeeDetailsPage"
import EmployeeFormPage from "@/components/EmployeeFormPage"
import EmployeeSingleAttendanceView from "@/components/EmployeeSingleAttendanceView"
import {
  useEmployees,
  useDeleteEmployee,
  type Employee
} from "@/lib/hooks/useEmployees"
import { useQueryClient } from "@tanstack/react-query"
import Image from "next/image"

export default function EmployeesPage() {
  const { data } = useEmployees()
  const deleteMutation = useDeleteEmployee()

  const [viewMode, setViewMode] = useState<'list' | 'details' | 'form' | 'attendance'>('list')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)

  const employees = data?.employees || []
  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBackToList = () => { setViewMode('list'); setSelectedEmployee(null); }
  const handleOpenCreate = () => { setEditingEmployee(null); setViewMode('form'); }
  const handleOpenEdit = (emp: Employee) => { setEditingEmployee(emp); setViewMode('form'); }
  const handleShowDetails = (emp: Employee) => { setSelectedEmployee(emp); setViewMode('details'); }
  const handleShowAttendance = (emp: Employee) => { setSelectedEmployee(emp); setViewMode('attendance'); }

  if (viewMode === 'form') return <EmployeeFormPage employee={editingEmployee} onBack={handleBackToList} />
  if (viewMode === 'details' && selectedEmployee) return <EmployeeDetailsPage employee={selectedEmployee} onBack={handleBackToList} />
  if (viewMode === 'attendance' && selectedEmployee) return <EmployeeSingleAttendanceView employee={selectedEmployee} onBack={handleBackToList} />


  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-6 pb-10">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 dark:text-white">
          <Users className="h-8 w-8 text-primary" /> ÉQUIPE
        </h1>
        <Button onClick={handleOpenCreate} className="rounded-xl shadow-lg gap-2 h-12 px-6 font-bold">
          <UserPlus className="h-5 w-5" /> Ajouter
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Rechercher un collaborateur..."
          className="pl-12 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="group border-none shadow-sm hover:shadow-md transition-all rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                  {employee.avatar ? (
                    <Image src={employee.avatar} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{employee.firstName} {employee.lastName}</h3>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl dark:bg-slate-900 dark:border-slate-800">
                        <DropdownMenuItem onClick={() => handleShowDetails(employee)}><Eye className="mr-2 h-4 w-4" /> Profil</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(employee)}><Pencil className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeletingEmployee(employee)} className="text-rose-500"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-primary font-bold text-[10px] uppercase tracking-wider">{employee.position}</p>
                </div>
              </div>

              <Separator className="my-4 opacity-50" />

              <div className="mb-4">
                {employee.scheduleAssignment?.schedule ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold truncate">{employee.scheduleAssignment.schedule.name}</span>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-9 rounded-xl text-xs gap-2 font-bold shadow-md"
                      onClick={() => handleShowAttendance(employee)}
                    >
                      <Clock className="h-3.5 w-3.5" /> Pointage
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      Aucun planning assigné
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="rounded-lg text-[10px] font-bold">
                  {employee.status}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => handleShowDetails(employee)} className="text-xs font-bold gap-1 group/btn rounded-lg">
                  Détails <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        open={!!deletingEmployee}
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
        title="Supprimer l'employé ?"
        description={`Voulez-vous vraiment supprimer "${deletingEmployee?.firstName} ${deletingEmployee?.lastName}" ? Cette action est irréversible.`}
        onConfirm={() => deleteMutation.mutateAsync(deletingEmployee!.id)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  )
}