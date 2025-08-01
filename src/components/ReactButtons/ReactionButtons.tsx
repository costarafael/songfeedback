'use client'

import { useState, useRef } from 'react'
import { Heart, ThumbsUp, ThumbsDown, Angry } from 'lucide-react'
import { useNeumorphicStyles } from '@/hooks/useNeumorphicStyles'

interface ReactionButtonsProps {
  onReaction: (type: 'love' | 'like' | 'dislike' | 'angry') => void
  disabled?: boolean
}

interface FloatingIcon {
  id: string
  type: 'love' | 'like' | 'dislike' | 'angry'
  x: number
  y: number
  randomX: number
}

export default function ReactionButtons({ onReaction, disabled }: ReactionButtonsProps) {
  const [lastReaction, setLastReaction] = useState<string | null>(null)
  const [floatingIcons, setFloatingIcons] = useState<FloatingIcon[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { getButtonStyles } = useNeumorphicStyles()

  const handleReaction = (type: 'love' | 'like' | 'dislike' | 'angry', event: React.MouseEvent) => {
    if (disabled) return
    
    onReaction(type)
    setLastReaction(type)
    
    // Criar ícone flutuante na posição do botão
    const buttonRect = event.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    
    if (containerRect) {
      const iconId = `${type}-${Date.now()}-${Math.random()}`
      const newIcon: FloatingIcon = {
        id: iconId,
        type,
        x: buttonRect.left + buttonRect.width / 2 - containerRect.left,
        y: buttonRect.top + buttonRect.height / 2 - containerRect.top,
        randomX: (Math.random() - 0.5) * 100 // -50px a +50px de variação horizontal
      }
      
      setFloatingIcons(prev => [...prev, newIcon])
      
      // Remover ícone após animação
      setTimeout(() => {
        setFloatingIcons(prev => prev.filter(icon => icon.id !== iconId))
      }, 2000)
    }
    
    // Reset botão após 500ms
    setTimeout(() => setLastReaction(null), 500)
  }

  const reactions = [
    {
      type: 'love' as const,
      icon: Heart,
      label: 'Amei',
      color: 'text-green-400 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300',
      activeColor: 'text-green-500',
      bgColor: 'bg-green-500'
    },
    {
      type: 'like' as const,
      icon: ThumbsUp,
      label: 'Gostei',
      color: 'text-blue-400 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300',
      activeColor: 'text-blue-500',
      bgColor: 'bg-blue-500'
    },
    {
      type: 'dislike' as const,
      icon: ThumbsDown,
      label: 'Não gostei',
      color: 'text-yellow-400 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300',
      activeColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500'
    },
    {
      type: 'angry' as const,
      icon: Angry,
      label: 'Descontente',
      color: 'text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300',
      activeColor: 'text-gray-500',
      bgColor: 'bg-gray-500'
    }
  ]

  const getReactionIcon = (type: string, isActive: boolean = false) => {
    const normalProps = { 
      className: 'w-7 h-7',
      strokeWidth: 2
    }

    // Tentar diferentes abordagens para cada ícone
    switch (type) {
      case 'love':
        // Heart funciona bem com fill + stroke
        return <Heart 
          className="w-7 h-7"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
        />
      case 'like':
        // ThumbsUp pode funcionar melhor apenas com stroke mais grosso
        return <ThumbsUp 
          className="w-7 h-7"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={isActive ? 2 : 2}
        />
      case 'dislike':
        // ThumbsDown similar ao like
        return <ThumbsDown 
          className="w-7 h-7"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={isActive ? 2 : 2}
        />
      case 'angry':
        // Angry pode precisar apenas stroke mais grosso
        return <Angry 
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? 3 : 2}
        />
      default:
        return null
    }
  }

  return (
    <div ref={containerRef} className="relative flex justify-center space-x-8 mt-6">
      {reactions.map(({ type, label, color, activeColor }) => (
        <button
          key={type}
          onClick={(e) => handleReaction(type, e)}
          disabled={disabled}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
            hover:scale-110 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${lastReaction === type ? 'button-press-animation' : ''}
          `}
          style={getButtonStyles(lastReaction === type, 'medium')}
          title={label}
        >
          {lastReaction === type && (
            <div className={`pulse-ring ${activeColor}`} />
          )}
          {getReactionIcon(type, lastReaction === type)}
        </button>
      ))}
      
      {/* Ícones flutuantes */}
      {floatingIcons.map((floatingIcon) => {
        const reaction = reactions.find(r => r.type === floatingIcon.type)
        return (
          <div
            key={floatingIcon.id}
            className={`absolute pointer-events-none z-50 ${reaction?.activeColor} float-up-animation`}
            style={{
              left: floatingIcon.x + floatingIcon.randomX,
              top: floatingIcon.y,
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
            }}
          >
            {getReactionIcon(floatingIcon.type, true)}
          </div>
        )
      })}
    </div>
  )
}