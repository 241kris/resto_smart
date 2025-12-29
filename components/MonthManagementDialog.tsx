"use client"

import { useState } from "react"
import { Calendar, Lock, LockOpen, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { useAttendanceMonth } from "@/lib/hooks/useAttendanceMonth"
import { toast } from "sonner"

interface MonthManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  month: number
  currentStatus?: 'OPEN' | 'CLOSED' | null
}

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

export default function MonthManagementDialog({
  open,
  onOpenChange,
  year,
  month,
  currentStatus,
}: MonthManagementDialogProps) {
  const { openMonth, closeMonth } = useAttendanceMonth()
  const [action, setAction] = useState<'open' | 'close' | null>(null)

  const handleOpenMonth = async () => {
    try {
      await openMonth.mutateAsync({ year, month })
      toast.success(`Le mois ${monthNames[month - 1]} ${year} a été ouvert`)
      onOpenChange(false)
      setAction(null)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ouverture du mois")
    }
  }

  const handleCloseMonth = async () => {
    try {
      await closeMonth.mutateAsync({ year, month })
      toast.success(`Le mois ${monthNames[month - 1]} ${year} a été clôturé`)
      onOpenChange(false)
      setAction(null)
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la clôture du mois")
    }
  }

  const renderContent = () => {
    if (!currentStatus) {
      // Mois pas encore ouvert
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockOpen className="h-5 w-5" />
              Ouvrir le mois
            </DialogTitle>
            <DialogDescription>
              {monthNames[month - 1]} {year}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Ouvrir le mois de {monthNames[month - 1]} {year}</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  Une fois le mois ouvert, vous pourrez:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>Enregistrer les pointages quotidiens</li>
                  <li>Modifier les présences et absences</li>
                  <li>Créer des périodes d'absence</li>
                  <li>Suivre les heures travaillées</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-2">À savoir:</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Les pointages ne peuvent être effectués que pour le jour en cours</li>
                <li>• Vous devrez ouvrir un nouveau mois chaque début de mois</li>
                <li>• Une fois clôturé, un mois devient non modifiable</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={openMonth.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleOpenMonth}
              disabled={openMonth.isPending}
            >
              {openMonth.isPending ? "Ouverture..." : "Ouvrir le mois"}
            </Button>
          </DialogFooter>
        </>
      )
    }

    if (currentStatus === 'OPEN') {
      // Mois ouvert - proposer de clôturer
      if (action === 'close') {
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                Clôturer le mois
              </DialogTitle>
              <DialogDescription>
                {monthNames[month - 1]} {year}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention: Action irréversible</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>
                    Une fois le mois clôturé:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Aucun pointage ne pourra plus être ajouté ou modifié</li>
                    <li>Les données seront en lecture seule</li>
                    <li>Cette action est définitive</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Avant de clôturer, vérifiez:</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>✓ Tous les pointages sont à jour</li>
                  <li>✓ Les heures travaillées sont correctes</li>
                  <li>✓ Les absences sont justifiées</li>
                  <li>✓ Les exceptions sont documentées</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={closeMonth.isPending}
              >
                Retour
              </Button>
              <Button
                variant="destructive"
                onClick={handleCloseMonth}
                disabled={closeMonth.isPending}
              >
                {closeMonth.isPending ? "Clôture..." : "Clôturer le mois"}
              </Button>
            </DialogFooter>
          </>
        )
      }

      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gérer le mois
            </DialogTitle>
            <DialogDescription>
              {monthNames[month - 1]} {year}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
                <LockOpen className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">Mois ouvert</p>
                <p className="text-sm text-muted-foreground">
                  Les pointages peuvent être enregistrés et modifiés
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Actions disponibles</p>
                  <ul className="text-sm text-muted-foreground mt-1.5 space-y-1">
                    <li>• Pointer les employés pour aujourd'hui</li>
                    <li>• Modifier les pointages existants</li>
                    <li>• Gérer les périodes d'absence</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/10"
              onClick={() => setAction('close')}
            >
              <Lock className="h-4 w-4 mr-2" />
              Clôturer ce mois
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fermer
            </Button>
          </DialogFooter>
        </>
      )
    }

    // Mois clôturé
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-600" />
            Mois clôturé
          </DialogTitle>
          <DialogDescription>
            {monthNames[month - 1]} {year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800">
              <Lock className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Mois clôturé</p>
              <p className="text-sm text-muted-foreground">
                Les données sont en lecture seule
              </p>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Aucune modification possible</AlertTitle>
            <AlertDescription className="mt-2">
              Ce mois a été clôturé et ne peut plus être modifié. Les pointages
              et statistiques sont consultables uniquement.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fermer
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
