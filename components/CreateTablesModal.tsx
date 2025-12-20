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

interface CreateTablesModalProps {
  restaurantId: string
  existingTableCount: number
}

export function CreateTablesModal({ restaurantId, existingTableCount }: CreateTablesModalProps) {
  const [open, setOpen] = useState(false)
  const [tableName, setTableName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const { mutate: createTable, isPending } = useCreateTable()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation du nom de table
    const trimmedName = tableName.trim()
    if (!trimmedName) {
      setError("Le nom de la table est requis")
      return
    }

    if (trimmedName.length > 20) {
      setError("Le nom de la table ne peut pas dépasser 20 caractères")
      return
    }

    createTable(
      { restaurantId, name: trimmedName },
      {
        onSuccess: () => {
          setOpen(false)
          setTableName("")
          setError("")
        },
        onError: (error) => {
          setError(error.message || "Impossible de créer la table")
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nouvelle table
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle table</DialogTitle>
            <DialogDescription>
              {existingTableCount > 0
                ? `Vous avez déjà ${existingTableCount} table(s). Donnez un nom unique à votre nouvelle table.`
                : "Créez votre première table avec un code QR unique."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tableName">Nom de la table</Label>
              <Input
                id="tableName"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Ex: 1, A, T25, VIP, etc."
                disabled={isPending}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Utilisez des chiffres (1, 25) ou des lettres (A, VIP, T12) pour identifier votre table
              </p>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
