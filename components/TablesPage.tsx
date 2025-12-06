"use client"

import { Download, QrCode as QrIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTables } from "@/lib/hooks/useTables"
import { useEstablishment } from "@/lib/hooks/useEstablishment"
import { CreateTablesModal } from "@/components/CreateTablesModal"
import Image from "next/image"

export default function TablesPage() {
  const { data: establishmentData } = useEstablishment()
  const establishment = establishmentData?.establishment
  const { data: tablesData, isLoading } = useTables(establishment?.id)
  const tables = tablesData?.tables || []

  const downloadQR = (tableNumber: number, qrCodePath: string) => {
    const link = document.createElement("a")
    link.download = `table-${tableNumber}-QR.png`
    link.href = qrCodePath
    link.click()
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrIcon className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Table {table.number}
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
                      alt={`QR Code Table ${table.number}`}
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
                      onClick={() => downloadQR(table.number, table.qrCodePath)}
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
            2. Spécifiez le nombre de tables à créer (elles seront numérotées automatiquement)
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            3. Un code QR unique est automatiquement généré pour chaque table
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            4. Téléchargez et imprimez les codes QR pour les placer sur vos tables
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            5. Les clients scannent le code pour accéder au menu du restaurant
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
