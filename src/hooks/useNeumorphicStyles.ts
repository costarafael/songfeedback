import { useTheme } from '@/hooks/useTheme'
import { usePlayerColors } from '@/hooks/usePlayerColors'

export function useNeumorphicStyles() {
  const isDark = useTheme()
  const { getUIColors } = usePlayerColors()
  const { shadow, highlight, textPrimary, textSecondary } = getUIColors(isDark)

  // Generate dynamic neumorphic classes with enhanced shadows
  const getNeumorphicClasses = (size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizes = {
      small: { main: '8px_8px_16px', secondary: '4px_4px_8px' },
      medium: { main: '15px_15px_30px', secondary: '8px_8px_16px' }, 
      large: { main: '25px_25px_50px', secondary: '12px_12px_24px' }
    }
    
    const sizeConfig = sizes[size]
    
    return {
      normal: {
        boxShadow: `${sizeConfig.main.replace(/_/g, ' ')} ${shadow}, -${sizeConfig.secondary.replace(/_/g, ' ')} ${highlight}, inset 1px 1px 2px ${highlight}99`
      },
      inset: {
        boxShadow: `inset ${sizeConfig.main.replace(/_/g, ' ')} ${shadow}, inset -${sizeConfig.secondary.replace(/_/g, ' ')} ${highlight}, inset 2px 2px 4px ${shadow}44`
      },
      // Hover state - inset effect mais suave
      hover: {
        boxShadow: `inset ${sizeConfig.secondary.replace(/_/g, ' ')} ${shadow}, inset -${sizeConfig.secondary.replace(/_/g, ' ')} ${highlight}`
      }
    }
  }

  // Get button styles with proper transitions
  const getButtonStyles = (isPressed = false, size: 'small' | 'medium' | 'large' = 'medium') => {
    const styles = getNeumorphicClasses(size)
    const { background } = getUIColors(isDark)
    
    return {
      backgroundColor: background,
      color: textPrimary,
      transition: 'all 0.2s ease-in-out',
      ...(isPressed ? styles.inset : styles.normal),
      ':hover': styles.hover
    }
  }

  // Get panel/container styles
  const getPanelStyles = (isInset = false) => {
    const styles = getNeumorphicClasses('large')
    const { background } = getUIColors(isDark)
    
    return {
      backgroundColor: background,
      transition: 'all 0.3s ease-in-out',
      ...(isInset ? styles.inset : styles.normal)
    }
  }

  // Get text styles for different text types
  const getTextStyles = (type: 'primary' | 'secondary' = 'primary') => {
    return {
      color: type === 'primary' ? textPrimary : textSecondary
    }
  }

  return {
    getNeumorphicClasses,
    getButtonStyles,
    getPanelStyles,
    getTextStyles,
    colors: getUIColors(isDark)
  }
}