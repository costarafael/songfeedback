'use client'

import { useState, useEffect } from 'react'

interface BreakpointConfig {
  xs: number  // mobile
  sm: number  // tablet  
  md: number  // small desktop
  lg: number  // large desktop
  xl: number  // extra large
  xxl: number // extra extra large
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 576,
  md: 768, 
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

export type BreakpointKey = keyof BreakpointConfig

export function useResponsive(breakpoints: BreakpointConfig = defaultBreakpoints) {
  const [screenSize, setScreenSize] = useState<BreakpointKey>('lg')
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      
      let currentSize: BreakpointKey = 'xs'
      
      if (width >= breakpoints.xxl) {
        currentSize = 'xxl'
      } else if (width >= breakpoints.xl) {
        currentSize = 'xl'
      } else if (width >= breakpoints.lg) {
        currentSize = 'lg'
      } else if (width >= breakpoints.md) {
        currentSize = 'md'
      } else if (width >= breakpoints.sm) {
        currentSize = 'sm'
      } else {
        currentSize = 'xs'
      }
      
      setScreenSize(currentSize)
      setIsMobile(width < breakpoints.md) // Mobile: < 768px
      setIsTablet(width >= breakpoints.sm && width < breakpoints.lg) // Tablet: 576px - 991px
      setIsDesktop(width >= breakpoints.lg) // Desktop: >= 992px
    }

    // Check on mount
    updateScreenSize()

    // Add resize listener
    window.addEventListener('resize', updateScreenSize)
    
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [breakpoints])

  return {
    screenSize,
    isMobile,
    isTablet, 
    isDesktop,
    breakpoints,
  }
}