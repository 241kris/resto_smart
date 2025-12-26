"use client"

import { Download, QrCode as QrIcon, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTables, useDeleteTables } from "@/lib/hooks/useTables"
import { useEstablishment } from "@/lib/hooks/useEstablishment"
import { CreateTablesModal } from "@/components/CreateTablesModal"
import Image from "next/image"
import { useState } from "react"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { toast } from "sonner"

export default function TablesPage() {
  const { data: establishmentData } = useEstablishment()
  const establishment = establishmentData?.establishment
  const { data: tablesData, isLoading } = useTables(establishment?.id)
  const tables = tablesData?.tables || []
  const { mutate: deleteTables, isPending: isDeleting } = useDeleteTables()

  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const toggleTableSelection = (tableId: string) => {
    const newSelected = new Set(selectedTables)
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId)
    } else {
      newSelected.add(tableId)
    }
    setSelectedTables(newSelected)
  }

  const selectAll = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set())
    } else {
      setSelectedTables(new Set(tables.map(t => t.id)))
    }
  }

  const downloadQRAsBlob = async (qrCodePath: string): Promise<Blob> => {
    const response = await fetch(qrCodePath)
    if (!response.ok) throw new Error('Failed to fetch QR code')
    return await response.blob()
  }

  const downloadSingleQR = async (tableName: string, qrCodePath: string) => {
    try {
      const blob = await downloadQRAsBlob(qrCodePath)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `table-${tableName}-QR.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Erreur lors du téléchargement du code QR')
    }
  }

  const downloadSelectedQRs = async () => {
    if (selectedTables.size === 0) return
    
    setIsDownloading(true)
    try {
      const zip = new JSZip()
      const selectedTablesList = tables.filter(t => selectedTables.has(t.id))

      for (const table of selectedTablesList) {
        try {
          const blob = await downloadQRAsBlob(table.qrCodePath)
          zip.file(`table-${table.name}-QR.png`, blob)
        } catch (error) {
          console.error(`Error downloading QR for table ${table.name}:`, error)
        }
      }

      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `qr-codes-${establishment?.name || 'tables'}.zip`)
      setSelectedTables(new Set())
    } catch (error) {
      console.error('Error creating zip:', error)
      toast.error('Erreur lors de la création du fichier ZIP')
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadAllQRs = async () => {
    if (tables.length === 0) return

    setIsDownloading(true)
    try {
      const zip = new JSZip()

      for (const table of tables) {
        try {
          const blob = await downloadQRAsBlob(table.qrCodePath)
          zip.file(`table-${table.name}-QR.png`, blob)
        } catch (error) {
          console.error(`Error downloading QR for table ${table.name}:`, error)
        }
      }

      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `qr-codes-${establishment?.name || 'tables'}-all.zip`)
    } catch (error) {
      console.error('Error creating zip:', error)
      toast.error('Erreur lors de la création du fichier ZIP')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDeleteTables = () => {
    if (!establishment) return

    const tableIds = Array.from(selectedTables)

    deleteTables(
      { tableIds, restaurantId: establishment.id },
      {
        onSuccess: (data) => {
          toast.success(data.message)
          setSelectedTables(new Set())
          setShowDeleteDialog(false)
        },
        onError: (error) => {
          toast.error(error.message || 'Erreur lors de la suppression des tables')
        },
      }
    )
  }

  if (!establishment) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Veuillez d'abord créer votre établissement pour gérer vos tables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Gérez vos tables et leurs codes QR
          </p>
        </div>
        <CreateTablesModal
          restaurantId={establishment.id}
          existingTableCount={tables.length}
          existingTableNames={tables.map(t => t.name)}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <QrIcon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{tables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Codes QR Générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{tables.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {!isLoading && tables.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                >
                  {selectedTables.size === tables.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
                {selectedTables.size > 0 && (
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {selectedTables.size} table(s) sélectionnée(s)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedTables.size > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? 'Suppression...' : `Supprimer (${selectedTables.size})`}
                    </Button>
                    <Button
                      size="sm"
                      onClick={downloadSelectedQRs}
                      disabled={isDownloading}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isDownloading ? 'Téléchargement...' : `Télécharger la sélection (${selectedTables.size})`}
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={downloadAllQRs}
                  disabled={isDownloading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Téléchargement...' : 'Télécharger tout'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-[hsl(var(--muted-foreground))]">Chargement des tables...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tables.length === 0 && (
        <Card className="bg-[hsl(var(--muted))]/50">
          <CardContent className="pt-6 text-center">
            <QrIcon className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-lg font-semibold mb-2">Aucune table</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Créez vos premières tables pour commencer à générer des codes QR
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tables Grid */}
      {!isLoading && tables.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id} className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Checkbox
                  checked={selectedTables.has(table.id)}
                  onCheckedChange={() => toggleTableSelection(table.id)}
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrIcon className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Table {table.name}
                </CardTitle>
                <CardDescription className="text-xs break-all">
                  Token: {table.tableToken}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-lg border">
                    <Image
                      src={table.qrCodePath}
                      alt={`QR Code Table ${table.name}`}
                      width={200}
                      height={200}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => downloadSingleQR(table.name, table.qrCodePath)}
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Table Info */}
      <Card className="bg-[hsl(var(--muted))]/50">
        <CardHeader>
          <CardTitle className="text-lg">Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            1. Créez de nouvelles tables en cliquant sur le bouton "Nouvelle table"
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            2. Donnez un nom unique à chaque table (chiffres ou lettres)
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            3. Un code QR unique est automatiquement généré pour chaque table
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            4. Téléchargez les codes QR individuellement, par sélection ou tous en même temps
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            5. Les clients scannent le code pour accéder au menu du restaurant
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedTables.size} table(s) ?
              <br />
              <span className="font-semibold text-destructive">
                Cette action est irréversible et supprimera définitivement les tables ainsi que leurs codes QR.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTables}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}