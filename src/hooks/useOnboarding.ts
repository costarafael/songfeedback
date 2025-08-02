'use client'

import { useState, useEffect } from 'react'

const ONBOARDING_STORAGE_KEY = 'feedback-song-onboarding-completed'

export function useOnboarding() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true) // Start as true to avoid flash

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    const hasCompleted = completed === 'true'
    
    setHasCompletedOnboarding(hasCompleted)
    
    // Show onboarding if not completed
    if (!hasCompleted) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const startOnboarding = () => {
    setIsOnboardingOpen(true)
  }

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    setHasCompletedOnboarding(true)
    setIsOnboardingOpen(false)
  }

  const closeOnboarding = () => {
    setIsOnboardingOpen(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    setHasCompletedOnboarding(false)
  }

  return {
    isOnboardingOpen,
    hasCompletedOnboarding,
    startOnboarding,
    completeOnboarding,
    closeOnboarding,
    resetOnboarding
  }
}