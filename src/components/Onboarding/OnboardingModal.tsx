'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface OnboardingStep {
  title: string
  description: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface OnboardingModalProps {
  steps: OnboardingStep[]
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingModal({ steps, isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<Element | null>(null)
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })

  useEffect(() => {
    if (isOpen && steps[currentStep]?.targetSelector) {
      const element = document.querySelector(steps[currentStep].targetSelector!)
      setTargetElement(element)
      
      if (element) {
        const rect = element.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const modalWidth = 320 // Estimated modal width
        const modalHeight = 200 // Estimated modal height
        const padding = 20
        
        let top = '50%'
        let left = '50%'
        let transform = 'translate(-50%, -50%)'
        
        // Smart positioning logic with mobile viewport constraints
        const spaceAbove = rect.top
        const spaceBelow = viewportHeight - rect.bottom
        const spaceLeft = rect.left
        const spaceRight = viewportWidth - rect.right
        
        // Check if we're on mobile (narrow viewport)
        const isMobile = viewportWidth < 640
        
        if (isMobile) {
          // On mobile, prioritize vertical positioning to avoid horizontal overflow
          if (spaceBelow > modalHeight + padding) {
            // Position below, centered horizontally with viewport constraints
            top = `${rect.bottom + padding}px`
            left = '50%'
            transform = 'translateX(-50%)'
          } else if (spaceAbove > modalHeight + padding) {
            // Position above, centered horizontally with viewport constraints  
            top = `${rect.top - modalHeight - padding}px`
            left = '50%'
            transform = 'translateX(-50%)'
          } else {
            // Fall back to center with safe margins
            top = '50%'
            left = '50%'
            transform = 'translate(-50%, -50%)'
          }
        } else {
          // Desktop positioning logic (original)
          if (spaceBelow > modalHeight + padding && spaceBelow > spaceAbove) {
            // Position below
            top = `${rect.bottom + padding}px`
            left = `${Math.min(Math.max(rect.left + rect.width / 2, modalWidth / 2 + padding), viewportWidth - modalWidth / 2 - padding)}px`
            transform = 'translateX(-50%)'
          } else if (spaceAbove > modalHeight + padding) {
            // Position above
            top = `${rect.top - modalHeight - padding}px`
            left = `${Math.min(Math.max(rect.left + rect.width / 2, modalWidth / 2 + padding), viewportWidth - modalWidth / 2 - padding)}px`
            transform = 'translateX(-50%)'
          } else if (spaceRight > modalWidth + padding) {
            // Position to the right
            top = `${Math.min(Math.max(rect.top + rect.height / 2, modalHeight / 2 + padding), viewportHeight - modalHeight / 2 - padding)}px`
            left = `${rect.right + padding}px`
            transform = 'translateY(-50%)'
          } else if (spaceLeft > modalWidth + padding) {
            // Position to the left
            top = `${Math.min(Math.max(rect.top + rect.height / 2, modalHeight / 2 + padding), viewportHeight - modalHeight / 2 - padding)}px`
            left = `${rect.left - modalWidth - padding}px`
            transform = 'translateY(-50%)'
          }
        }
        
        setModalPosition({ top, left, transform })
      }
    }
  }, [isOpen, currentStep, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    onClose()
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Highlight do elemento alvo */}
      {targetElement && (
        <div
          className="fixed z-[51] border-2 border-violet-400 rounded-lg shadow-lg shadow-violet-400/30 pointer-events-none transition-all duration-300"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Modal de conteúdo - menor e mais elegante */}
      <div 
        className="fixed z-[52] w-80 max-w-[90vw]"
        style={modalPosition}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header compacto */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conteúdo compacto */}
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {currentStepData.description}
            </p>

            {/* Indicador de progresso compacto */}
            <div className="flex space-x-1 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-colors duration-200 ${
                    index <= currentStep
                      ? 'bg-violet-500'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  style={{ width: `${100 / steps.length}%` }}
                />
              ))}
            </div>

            {/* Botões de ação compactos */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="flex items-center space-x-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Voltar</span>
                  </button>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentStep + 1} de {steps.length}
                </span>
              </div>
              
              <button
                onClick={handleNext}
                className="flex items-center space-x-1 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <span>{isLastStep ? 'Entendi!' : 'Próximo'}</span>
                {!isLastStep && <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}