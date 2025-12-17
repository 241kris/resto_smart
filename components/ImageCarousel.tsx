"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageCarouselProps {
  images: string[]
  alt: string
  className?: string
  onIndexChange?: (index: number) => void
  externalIndex?: number
}

export function ImageCarousel({ images, alt, className = "", onIndexChange, externalIndex }: ImageCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    if (onIndexChange) {
      onIndexChange(index)
    }
  }, [emblaApi, onIndexChange])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  // Synchroniser avec l'index externe (quand on clique sur les miniatures)
  useEffect(() => {
    if (emblaApi && externalIndex !== undefined && externalIndex !== selectedIndex) {
      emblaApi.scrollTo(externalIndex)
    }
  }, [emblaApi, externalIndex, selectedIndex])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  // Si une seule image, affichage simple
  if (images.length <= 1) {
    return (
      <div className={`relative h-64 md:h-80 w-full ${className}`}>
        <div className="absolute inset-0 bg-black/60 z-10" />
        {images.length === 1 ? (
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50" />
        )}
      </div>
    )
  }

  // Carousel multiple images
  return (
    <div className={`relative h-64 md:h-80 w-full ${className}`}>
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Carousel container */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {images.map((image, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
              <Image
                src={image}
                alt={`${alt} - Image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Boutons de navigation */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
        onClick={scrollNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Indicateurs de pagination */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
            onClick={() => scrollTo(index)}
          />
        ))}
      </div>
    </div>
  )
}

// Hook pour utiliser le carousel avec des miniatures séparées
export function useCarouselWithThumbs(images: string[]) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  return {
    emblaRef,
    selectedIndex,
    scrollTo,
  }
}
