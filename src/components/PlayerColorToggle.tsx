'use client'

import { Palette } from 'lucide-react'
import { usePlayerColors, PlayerColorTheme } from '@/hooks/usePlayerColors'
import { useNeumorphicStyles } from '@/hooks/useNeumorphicStyles'

export default function PlayerColorToggle() {
  const { colorTheme, setColorTheme, availableThemes } = usePlayerColors()
  const { getButtonStyles } = useNeumorphicStyles()

  const themeLabels = {
    blue: 'Azul',
    purple: 'Púrpura'
  }

  const themeColors = {
    blue: 'text-blue-500',
    purple: 'text-purple-500'
  }

  const cycleColorTheme = () => {
    const currentIndex = availableThemes.indexOf(colorTheme)
    const nextIndex = (currentIndex + 1) % availableThemes.length
    setColorTheme(availableThemes[nextIndex])
  }

  return (
    <button
      onClick={cycleColorTheme}
      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
      style={getButtonStyles(false, 'medium')}
      title={`Cores do Player: ${themeLabels[colorTheme]}`}
    >
      <Palette className={`w-5 h-5 ${themeColors[colorTheme]}`} />
    </button>
  )
}