"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateTable } from "@/lib/hooks/useTables"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface CreateTablesModalProps {
  restaurantId: string
  existingTableCount: number
  existingTableNames: string[]
}

type CreationMode = "single" | "series"

export function CreateTablesModal({ restaurantId, existingTableCount, existingTableNames }: CreateTablesModalProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<CreationMode>("single")
  const [tableName, setTableName] = useState<string>("")
  const [startNumber, setStartNumber] = useState<string>("")
  const [endNumber, setEndNumber] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const { mutate: createTable } = useCreateTable()

  const handleReset = () => {
    setTableName("")
    setStartNumber("")
    setEndNumber("")
    setError("")
    setMode("single")
  }

  const handleClose = () => {
    setOpen(false)
    handleReset()
  }

  const validateTableName = (name: string): boolean => {
    if (!name.trim()) {
      setError("Le nom de la table est requis")
      return false
    }

    if (name.length > 20) {
      setError("Le nom de la table ne peut pas dépasser 20 caractères")
      return false
    }

    if (existingTableNames.includes(name)) {
      setError(`Une table nommée "${name}" existe déjà`)
      return false
    }

    return true
  }

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmedName = tableName.trim()
    if (!validateTableName(trimmedName)) {
      return
    }

    setIsCreating(true)
    createTable(
      { restaurantId, name: trimmedName },
      {
        onSuccess: () => {
          toast.success(`Table "${trimmedName}" créée avec succès`)
          handleClose()
        },
        onError: (error) => {
          setError(error.message || "Impossible de créer la table")
        },
        onSettled: () => {
          setIsCreating(false)
        }
      }
    )
  }

  const handleSubmitSeries = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const start = parseInt(startNumber)
    const end = parseInt(endNumber)

    // Validation
    if (isNaN(start) || isNaN(end)) {
      setError("Veuillez entrer des nombres valides")
      return
    }

    if (start < 1) {
      setError("Le numéro de départ doit être au minimum 1")
      return
    }

    if (end < start) {
      setError("Le numéro de fin doit être supérieur ou égal au numéro de départ")
      return
    }

    if (end - start > 99) {
      setError("Vous ne pouvez pas créer plus de 100 tables à la fois")
      return
    }

    // Vérifier les doublons
    const tablesToCreate: string[] = []
    const duplicates: string[] = []

    for (let i = start; i <= end; i++) {
      const name = i.toString()
      if (existingTableNames.includes(name)) {
        duplicates.push(name)
      } else {
        tablesToCreate.push(name)
      }
    }

    if (duplicates.length > 0) {
      setError(`Les tables suivantes existent déjà: ${duplicates.join(", ")}`)
      return
    }

    if (tablesToCreate.length === 0) {
      setError("Aucune nouvelle table à créer")
      return
    }

    // Créer les tables une par une
    setIsCreating(true)
    let successCount = 0
    let failedTables: string[] = []

    for (const name of tablesToCreate) {
      try {
        await new Promise<void>((resolve, reject) => {
          createTable(
            { restaurantId, name },
            {
              onSuccess: () => {
                successCount++
                resolve()
              },
              onError: (error) => {
                failedTables.push(name)
                console.error(`Erreur création table ${name}:`, error)
                reject(error)
              }
            }
          )
        })
      } catch (error) {
        // Continue avec la prochaine table même en cas d'erreur
        continue
      }
    }

    setIsCreating(false)

    // Afficher le résultat
    if (successCount > 0) {
      toast.success(`${successCount} table(s) créée(s) avec succès`)
    }

    if (failedTables.length > 0) {
      toast.error(`Échec de création pour: ${failedTables.join(", ")}`)
      setError(`Certaines tables n'ont pas pu être créées: ${failedTables.join(", ")}`)
    } else {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nouvelle table
      </Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer des tables</DialogTitle>
          <DialogDescription>
            {existingTableCount > 0
              ? `Vous avez déjà ${existingTableCount} table(s).`
              : "Créez vos premières tables avec des codes QR uniques."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={mode === "single" ? handleSubmitSingle : handleSubmitSeries}>
          <div className="space-y-4 py-4">
            {/* Mode Selection */}
            <div className="flex gap-2 border-b pb-3">
              <button
                type="button"
                onClick={() => {
                  setMode("single")
                  setError("")
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "single"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                disabled={isCreating}
              >
                Table unique
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("series")
                  setError("")
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "series"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                disabled={isCreating}
              >
                Tables en série
              </button>
            </div>

            {/* Single Mode */}
            {mode === "single" && (
              <div className="space-y-2">
                <Label htmlFor="tableName">Nom de la table</Label>
                <Input
                  id="tableName"
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ex: 1, A, T25, VIP, etc."
                  disabled={isCreating}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez des chiffres (1, 25) ou des lettres (A, VIP, T12)
                </p>
              </div>
            )}

            {/* Series Mode */}
            {mode === "series" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startNumber">De (numéro)</Label>
                    <Input
                      id="startNumber"
                      type="number"
                      min="1"
                      value={startNumber}
                      onChange={(e) => setStartNumber(e.target.value)}
                      placeholder="Ex: 1"
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endNumber">À (numéro)</Label>
                    <Input
                      id="endNumber"
                      type="number"
                      min="1"
                      value={endNumber}
                      onChange={(e) => setEndNumber(e.target.value)}
                      placeholder="Ex: 7"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                {startNumber && endNumber && parseInt(endNumber) >= parseInt(startNumber) && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Tables à créer:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(
                        { length: Math.min(parseInt(endNumber) - parseInt(startNumber) + 1, 100) },
                        (_, i) => {
                          const tableNum = parseInt(startNumber) + i
                          const name = tableNum.toString()
                          const exists = existingTableNames.includes(name)
                          return (
                            <Badge
                              key={i}
                              variant={exists ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {name} {exists && "✗"}
                            </Badge>
                          )
                        }
                      )}
                    </div>
                    {parseInt(endNumber) - parseInt(startNumber) > 99 && (
                      <p className="text-xs text-destructive mt-2">
                        Maximum 100 tables à la fois
                      </p>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Exemple: de 2 à 7 créera les tables 2, 3, 4, 5, 6, 7
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Création..." : mode === "single" ? "Créer" : "Créer les tables"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
