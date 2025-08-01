import { useEffect, useRef, useState } from 'react'

interface UseAnimatedWidthOptions {
  duration?: number
  openWidth?: number
  closedWidth?: number
}

export function useAnimatedWidth(
  isOpen: boolean, 
  options: UseAnimatedWidthOptions = {}
) {
  const { 
    duration = 300, 
    openWidth = 0, 
    closedWidth = 250 
  } = options
  
  const [width, setWidth] = useState(closedWidth)
  const animationRef = useRef<number | null>(null)
  const startWidthRef = useRef<number>(closedWidth)

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    const targetWidth = isOpen ? openWidth : closedWidth
    const startWidth = startWidthRef.current
    
    if (Math.abs(targetWidth - startWidth) < 0.1) {
      setWidth(targetWidth)
      return
    }
    
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const currentWidth = startWidth + (targetWidth - startWidth) * progress
      setWidth(currentWidth)
      startWidthRef.current = currentWidth
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        startWidthRef.current = targetWidth
      }
    }

    startWidthRef.current = startWidth
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isOpen, openWidth, closedWidth, duration])

  return width
}