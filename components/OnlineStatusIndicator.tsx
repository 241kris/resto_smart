"use client"

import { Wifi, WifiOff, Cloud, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useOfflineSync } from "@/lib/hooks/useOfflineSync"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function OnlineStatusIndicator() {
  const { isOnline, unsyncedCount, syncOrders, isSyncing } = useOfflineSync()

  if (isOnline && unsyncedCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="gap-2 h-10 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-bold"
            >
              <Wifi className="h-4 w-4" />
              <span>En ligne</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Connexion stable • Toutes les données sont synchronisées</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (isOnline && unsyncedCount > 0) {
    return (
      <Button
        onClick={syncOrders}
        disabled={isSyncing}
        className="gap-2 h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-none font-bold shadow-lg"
      >
        {isSyncing ? (
          <>
            <Cloud className="h-4 w-4 animate-pulse" />
            <span>Synchronisation...</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 animate-bounce" />
            <span>{unsyncedCount} commande(s) à synchroniser</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="gap-2 h-10 px-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 font-bold"
          >
            <WifiOff className="h-4 w-4" />
            <span>Hors ligne</span>
            {unsyncedCount > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center">
                {unsyncedCount}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {unsyncedCount > 0
              ? `${unsyncedCount} commande(s) en attente • Seront synchronisées au retour de la connexion`
              : 'Pas de connexion internet'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
