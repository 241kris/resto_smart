"use client"

import { useEffect, useRef } from 'react'

interface OrderNotificationProps {
  hasPendingOrders: boolean
}

export function OrderNotification({ hasPendingOrders }: OrderNotificationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    // Créer l'élément audio une seule fois
    if (!audioRef.current) {
      audioRef.current = new Audio('/sound/notification.mp3')
      audioRef.current.volume = 0.7
    }
  }, [])

  useEffect(() => {
    // Fonction pour jouer le son et programmer le prochain
    const playNotificationLoop = () => {
      if (!audioRef.current || !hasPendingOrders || isPlayingRef.current) return

      isPlayingRef.current = true
      audioRef.current.currentTime = 0

      audioRef.current.play()
        .then(() => {
          // Attendre que le son se termine
          if (audioRef.current) {
            audioRef.current.onended = () => {
              isPlayingRef.current = false
              // Attendre 4 secondes après la fin du son avant de rejouer
              if (hasPendingOrders) {
                timeoutRef.current = setTimeout(() => {
                  playNotificationLoop()
                }, 4000)
              }
            }
          }
        })
        .catch(error => {
          console.error('Erreur lors de la lecture de la notification:', error)
          isPlayingRef.current = false
        })
    }

    if (hasPendingOrders) {
      // Démarrer la boucle
      playNotificationLoop()
    } else {
      // Arrêter la boucle
      isPlayingRef.current = false

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.onended = null
      }
    }

    // Cleanup à la destruction du composant
    return () => {
      isPlayingRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (audioRef.current) {
        audioRef.current.onended = null
      }
    }
  }, [hasPendingOrders])

  return null
}
