"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Cloud, CheckCircle, Wifi, Upload } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface SyncProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  progress: number
  unsyncedCount: number
  isComplete: boolean
}

export function SyncProgressModal({
  open,
  onOpenChange,
  progress,
  unsyncedCount,
  isComplete
}: SyncProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-none p-0 max-w-md overflow-hidden">
        {/* Header Gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Cloud size={200} />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center space-y-3">
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              {isComplete ? (
                <CheckCircle className="h-10 w-10 text-white animate-in zoom-in duration-500" />
              ) : (
                <Upload className="h-10 w-10 text-white animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                {isComplete ? 'Synchronisation terminée' : 'Synchronisation en cours'}
              </h2>
              <p className="text-white/80 text-sm font-medium mt-1">
                {isComplete
                  ? 'Toutes vos commandes sont à jour'
                  : `${unsyncedCount} commande(s) en cours de téléversement`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-8 space-y-6">
          {!isComplete && (
            <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Progression</span>
                  <span className="font-black text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 rounded-full" />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Wifi className="h-4 w-4 animate-pulse" />
                <span className="font-medium">Connexion stable détectée</span>
              </div>
            </>
          )}

          {isComplete && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-400 text-sm">
                    Données sauvegardées
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500">
                    Vos commandes sont maintenant sur le serveur
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-12 rounded-2xl font-bold shadow-lg"
              >
                Continuer
              </Button>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        {!isComplete && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" />
        )}
      </DialogContent>
    </Dialog>
  )
}
