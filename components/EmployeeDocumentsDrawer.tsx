"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useCreateEmployeeDocument, useUpdateEmployeeDocument, type Employee, type EmployeeDocument } from "@/lib/hooks/useEmployees"
import { toast } from "sonner"

interface EmployeeDocumentsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
  document?: EmployeeDocument
}

export default function EmployeeDocumentsDrawer({ open, onOpenChange, employee, document }: EmployeeDocumentsDrawerProps) {
  const createDocumentMutation = useCreateEmployeeDocument(employee.id)
  const updateDocumentMutation = useUpdateEmployeeDocument(employee.id)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!document

  const [documentType, setDocumentType] = useState(document?.documentType || "")
  const [fileName, setFileName] = useState(document?.fileName || "")
  const [file, setFile] = useState<string>("")
  const [filePreview, setFilePreview] = useState<string | null>(null)

  // Mettre à jour les états quand le document change
  useEffect(() => {
    if (document) {
      setDocumentType(document.documentType)
      setFileName(document.fileName)
      setFile("") // Pas de nouveau fichier par défaut
      setFilePreview(null)
    }
  }, [document])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Vérifier la taille (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5 Mo')
      return
    }

    // Toujours utiliser le nom du fichier sélectionné
    setFileName(selectedFile.name)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFile(base64String)

      // Aperçu pour les images
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(base64String)
      } else {
        setFilePreview(null)
      }
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleRemoveFile = () => {
    setFile("")
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!documentType.trim()) {
      toast.error('Le type de document est requis')
      return
    }

    if (!fileName.trim()) {
      toast.error('Le nom du fichier est requis')
      return
    }

    // En mode création, le fichier est obligatoire
    if (!isEditing && !file) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    try {
      if (isEditing && document) {
        // Mode édition
        const updateData: any = {
          documentType: documentType.trim(),
          fileName: fileName.trim()
        }

        // Ajouter le fichier seulement s'il a été changé
        if (file) {
          updateData.file = file
        }

        await updateDocumentMutation.mutateAsync({
          documentId: document.id,
          data: updateData
        })

        toast.success('Document modifié avec succès')
      } else {
        // Mode création
        await createDocumentMutation.mutateAsync({
          documentType: documentType.trim(),
          fileName: fileName.trim(),
          file
        })

        toast.success('Document ajouté avec succès')
      }

      // Réinitialiser le formulaire
      setDocumentType("")
      setFileName("")
      setFile("")
      setFilePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || `Erreur lors de ${isEditing ? 'la modification' : 'l\'ajout'} du document`)
    }
  }

  const handleClose = () => {
    // Réinitialiser le formulaire
    setDocumentType("")
    setFileName("")
    setFile("")
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>{isEditing ? 'Modifier le document' : 'Ajouter un document'}</DrawerTitle>
            <DrawerDescription>
              {isEditing
                ? `Modifiez le document de ${employee.firstName} ${employee.lastName}`
                : `Ajoutez un document pour ${employee.firstName} ${employee.lastName}`
              }
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            {/* Type de document */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Type de document *</Label>
              <Input
                id="documentType"
                placeholder="Ex: Contrat de travail, CV, CNI, etc."
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              />
            </div>

            {/* Nom du fichier */}
            <div className="space-y-2">
              <Label htmlFor="fileName">Nom du fichier *</Label>
              <Input
                id="fileName"
                placeholder={isEditing ? "Nom actuel du fichier" : "Le nom sera automatiquement rempli depuis le fichier..."}
                value={fileName}
                disabled
                className="cursor-not-allowed opacity-70"
              />
            </div>

            {/* Sélection du fichier */}
            <div className="space-y-2">
              <Label>Fichier {isEditing ? '(optionnel)' : '*'}</Label>
              <div className="flex items-center gap-4">
                {/* Aperçu ou icône */}
                <div className="relative h-24 w-24 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center border-2 border-dashed">
                  {filePreview ? (
                    <>
                      <img
                        src={filePreview}
                        alt="Aperçu"
                        className="h-full w-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : file ? (
                    <>
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Bouton upload */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {file ? 'Changer le fichier' : (isEditing ? 'Remplacer le fichier' : 'Choisir un fichier')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isEditing
                      ? "Choisissez un nouveau fichier uniquement si vous souhaitez le remplacer. Images, PDF, Word, Excel. Max 5 Mo."
                      : "Images, PDF, Word, Excel. Max 5 Mo."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button
              onClick={handleSubmit}
              disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}
            >
              {isEditing
                ? (updateDocumentMutation.isPending ? 'Modification en cours...' : 'Modifier')
                : (createDocumentMutation.isPending ? 'Ajout en cours...' : 'Ajouter')
              }
            </Button>
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
