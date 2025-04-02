"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface ImageModalProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

export function ImageModal({ images, currentIndex, isOpen, onClose, onNavigate }: ImageModalProps) {
  if (currentIndex < 0 || !images.length) return null
  
  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length
    onNavigate(newIndex)
  }

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % images.length
    onNavigate(newIndex)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 z-10" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="relative h-[80vh] flex items-center justify-center">
            <img 
              src={images[currentIndex]} 
              alt={`Image ${currentIndex + 1}`} 
              className="max-h-full max-w-full object-contain"
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-2 top-1/2 -translate-y-1/2" 
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2" 
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}