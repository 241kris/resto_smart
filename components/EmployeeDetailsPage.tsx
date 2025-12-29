"use client"

import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, FileText, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { type Employee } from "@/lib/hooks/useEmployees"
import Image from "next/image"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface EmployeeDetailsPageProps {
  employee: Employee
  onBack: () => void
}

export default function EmployeeDetailsPage({ employee, onBack }: EmployeeDetailsPageProps) {
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

  // Fonction pour obtenir le label du département
  const getDepartmentLabel = (department: Employee['department']) => {
    const labels = {
      DINING_ROOM: "Salle",
      KITCHEN: "Cuisine",
      ADMINISTRATION: "Administration",
      DELIVERY: "Livraison"
    }
    return labels[department]
  }

  // Fonction pour obtenir le label du type de contrat
  const getContractTypeLabel = (contractType: Employee['contractType']) => {
    const labels = {
      CDI: "CDI (Contrat à Durée Indéterminée)",
      CDD: "CDD (Contrat à Durée Déterminée)",
      PART_TIME: "Temps partiel",
      DAILY_EXTRA: "Extra / Journalier"
    }
    return labels[contractType]
  }

  // Fonction pour obtenir le label du genre
  const getGenderLabel = (gender: Employee['gender']) => {
    const labels = {
      MALE: "Homme",
      FEMALE: "Femme",
      OTHER: "Autre"
    }
    return labels[gender]
  }

  const statusBadge = getStatusBadge(employee.status)

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Détails de l'employé</h1>
          <p className="text-muted-foreground">
            Informations complètes de l'employé
          </p>
        </div>
      </div>

      {/* Carte principale avec photo et infos de base */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative h-32 w-32 rounded-full bg-muted shrink-0">
              {employee.avatar ? (
                <Image
                  src={employee.avatar}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  fill
                  className="object-cover rounded-full"
                  unoptimized
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-4xl font-semibold text-muted-foreground">
                    {employee.firstName[0]}{employee.lastName[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-1 space-y-4">
              <div>
                <CardTitle className="text-2xl">
                  {employee.firstName} {employee.lastName}
                </CardTitle>
                <CardDescription className="text-lg mt-1">
                  {getPositionLabel(employee.position)} - {getDepartmentLabel(employee.department)}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={statusBadge.variant} className="text-sm">
                  {statusBadge.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                <p className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(employee.dateOfBirth), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Sexe</p>
                <p className="mt-1">{getGenderLabel(employee.gender)}</p>
              </div>

              {employee.identityNumber && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Numéro d'identité</p>
                    <p className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {employee.identityNumber}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coordonnées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                <p className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {employee.phone}
                </p>
              </div>

              {employee.email && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {employee.email}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                <p className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {employee.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations professionnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Poste</p>
                <p className="mt-1">{getPositionLabel(employee.position)}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Département</p>
                <p className="mt-1">{getDepartmentLabel(employee.department)}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Type de contrat</p>
                <p className="mt-1">{getContractTypeLabel(employee.contractType)}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Date d'embauche</p>
                <p className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(employee.hireDate), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métadonnées */}
        <Card>
          <CardHeader>
            <CardTitle>Métadonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de création</p>
                <p className="text-sm mt-1">
                  {format(new Date(employee.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">Dernière modification</p>
                <p className="text-sm mt-1">
                  {format(new Date(employee.updatedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Retour à la liste
        </Button>
      </div>
    </div>
  )
}
