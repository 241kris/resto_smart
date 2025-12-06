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
import { useCreateTables } from "@/lib/hooks/useTables"

interface CreateTablesModalProps {
  restaurantId: string
  existingTableCount: number
}

export function CreateTablesModal({ restaurantId, existingTableCount }: CreateTablesModalProps) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState<number>(1)
  const [error, setError] = useState<string>("")
  const { mutate: createTables, isPending } = useCreateTables()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (count < 1 || count > 50) {
      setError("Le nombre de tables doit être entre 1 et 50")
      return
    }

    createTables(
      { restaurantId, count },
      {
        onSuccess: () => {
          setOpen(false)
          setCount(1)
          setError("")
        },
        onError: (error) => {
          setError(error.message || "Impossible de créer les tables")
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
            <DialogTitle>Créer de nouvelles tables</DialogTitle>
            <DialogDescription>
              {existingTableCount > 0
                ? `Vous avez déjà ${existingTableCount} table(s). Les nouvelles tables commenceront au numéro ${existingTableCount + 1}.`
                : "Créez vos premières tables avec des codes QR uniques."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="count">Nombre de tables à créer</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                placeholder="Ex: 5"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                {count > 0 && existingTableCount >= 0 && (
                  <>
                    Création des tables {existingTableCount + 1} à{" "}
                    {existingTableCount + count}
                  </>
                )}
              </p>
              {error && (
                <p className="text-xs text-red-500">{error}</p>
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
