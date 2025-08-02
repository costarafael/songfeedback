'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

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

  useEffect(() => {
    if (isOpen && steps[currentStep]?.targetSelector) {
      const element = document.querySelector(steps[currentStep].targetSelector!)
      setTargetElement(element)
    }
  }, [isOpen, currentStep, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
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
        className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Highlight do elemento alvo */}
      {targetElement && (
        <div
          className="fixed z-[51] border-4 border-violet-400 rounded-lg shadow-lg shadow-violet-400/50 pointer-events-none transition-all duration-300"
          style={{
            top: targetElement.getBoundingClientRect().top - 8,
            left: targetElement.getBoundingClientRect().left - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
          }}
        />
      )}

      {/* Modal de conteúdo */}
      <div className="fixed inset-0 z-[52] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {currentStepData.description}
            </p>

            {/* Indicador de progresso */}
            <div className="flex space-x-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-colors duration-200 ${
                    index <= currentStep
                      ? 'bg-violet-500'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  style={{ width: `${100 / steps.length}%` }}
                />
              ))}
            </div>

            {/* Botões de ação */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep + 1} de {steps.length}
              </span>
              
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                <span>{isLastStep ? 'Entendi!' : 'Próximo'}</span>
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}