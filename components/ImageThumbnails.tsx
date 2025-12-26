"use client"

import Image from "next/image"

interface ImageThumbnailsProps {
  images: string[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function ImageThumbnails({ images, selectedIndex, onSelect }: ImageThumbnailsProps) {
  if (images.length <= 1) {
    return null
  }

  return (
    <div className="bg-background border-b border-gray-200 py-3 shadow-sm">
      <div className="container mx-auto px-2 md:px-4">
        <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scroll-smooth">
          <div className="flex gap-2 md:gap-3 pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onSelect(index)}
                className={`relative h-14 w-20 sm:h-16 sm:w-24 md:h-20 md:w-28 rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                  index === selectedIndex
                    ? "ring-4 ring-primary scale-105 shadow-lg"
                    : "opacity-70 hover:opacity-100 hover:scale-105 shadow-md"
                }`}
              >
                {image.startsWith('data:') || image.startsWith('/') ? (
                  <Image
                    src={image}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                )}
                {index === selectedIndex && (
                  <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}
