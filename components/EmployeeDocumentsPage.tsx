"use client"

import { useState } from "react"
import { ArrowLeft, Download, Pencil, Trash2, Plus, FileText, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ConfirmDialog from "@/components/ConfirmDialog"
import EmployeeDocumentsDrawer from "@/components/EmployeeDocumentsDrawer"
import {
  useDeleteEmployeeDocument,
  type Employee,
  type EmployeeDocument
} from "@/lib/hooks/useEmployees"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

interface EmployeeDocumentsPageProps {
  employee: Employee
  onBack: () => void
}

export default function EmployeeDocumentsPage({ employee, onBack }: EmployeeDocumentsPageProps) {
  const deleteMutation = useDeleteEmployeeDocument(employee.id)

  const [deletingDocument, setDeletingDocument] = useState<EmployeeDocument | null>(null)
  const [editingDocument, setEditingDocument] = useState<EmployeeDocument | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)

  const documents = employee.documents || []

  const handleDownload = (document: EmployeeDocument) => {
    // Ouvrir le fichier dans un nouvel onglet
    window.open(document.fileUrl, '_blank')
    toast.success('Téléchargement en cours...')
  }

  const handleDownloadAll = () => {
    // Télécharger tous les documents
    documents.forEach((doc, index) => {
      setTimeout(() => {
        window.open(doc.fileUrl, '_blank')
      }, index * 500) // Délai pour éviter le blocage des popups
    })
    toast.success(`Téléchargement de ${documents.length} document(s) en cours...`)
  }

  const handleDelete = async () => {
    if (!deletingDocument) return

    try {
      await deleteMutation.mutateAsync(deletingDocument.id)
      toast.success('Document supprimé avec succès')
      setDeletingDocument(null)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (fileUrl: string) => {
    const extension = fileUrl.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return '🖼️'
    } else if (extension === 'pdf') {
      return '📄'
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝'
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return '📊'
    }
    return '📎'
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            {employee.firstName} {employee.lastName} - {documents.length} document{documents.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {documents.length > 0 && (
            <Button variant="outline" onClick={handleDownloadAll} className="gap-2">
              <Download className="h-4 w-4" />
              Tout télécharger
            </Button>
          )}
          <Button onClick={() => setDrawerOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un document
          </Button>
        </div>
      </div>

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucun document enregistré
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setDrawerOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter le premier document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <Card key={document.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-3xl shrink-0">
                      {getFileIcon(document.fileUrl)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {document.fileName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {document.documentType}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Date d'upload */}
                <div className="text-sm text-muted-foreground">
                  Ajouté le {format(new Date(document.uploadedAt), 'dd MMM yyyy', { locale: fr })}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDocument(document)
                      setEditDrawerOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingDocument(document)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
        title="Supprimer le document"
        description={`Êtes-vous sûr de vouloir supprimer "${deletingDocument?.fileName}" ? Cette action ne peut pas être annulée.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Drawer pour ajouter un document */}
      <EmployeeDocumentsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        employee={employee}
      />

      {/* Drawer pour modifier un document */}
      {editingDocument && (
        <EmployeeDocumentsDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          employee={employee}
          document={editingDocument}
        />
      )}
    </div>
  )
}
