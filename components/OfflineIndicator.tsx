"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi, CloudOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Définir l'état initial
    setIsOnline(navigator.onLine)

    // Gestionnaires d'événements
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Masquer l'indicateur "En ligne" après 3 secondes
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    // Ajouter les écouteurs
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Nettoyer
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Toujours afficher quand hors ligne, afficher temporairement quand de retour en ligne
  if (!showIndicator && isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      {isOnline ? (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg px-4 py-2">
          <Wifi className="h-4 w-4 mr-2" />
          Connexion rétablie
        </Badge>
      ) : (
        <Badge variant="destructive" className="shadow-lg px-4 py-2">
          <WifiOff className="h-4 w-4 mr-2" />
          Mode hors ligne
        </Badge>
      )}
    </div>
  )
}
