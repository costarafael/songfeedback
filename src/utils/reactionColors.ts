import { ReactionType } from '@/lib/types'

export interface ReactionThemeColors {
  primary: string
  blur: string
  gradient: string
  shadow: string
}

export interface ReactionColors {
  light: ReactionThemeColors
  dark: ReactionThemeColors
}

export const REACTION_THEME_COLORS: Record<ReactionType, ReactionColors> = {
  love: {
    light: {
      primary: '#16a34a',      // green-600 (VERDE)
      blur: '#bbf7d080',       // green-200/50
      gradient: 'rgba(34, 197, 94, 0.15)',   // green-500/15
      shadow: 'rgba(34, 197, 94, 0.25)'      // green-500/25
    },
    dark: {
      primary: '#4ade80',      // green-400
      blur: '#14532d80',       // green-900/50
      gradient: 'rgba(74, 222, 128, 0.20)',  // green-400/20
      shadow: 'rgba(74, 222, 128, 0.35)'     // green-400/35
    }
  },
  like: {
    light: {
      primary: '#2563eb',      // blue-600 (AZUL)
      blur: '#dbeafe80',       // blue-200/50
      gradient: 'rgba(59, 130, 246, 0.15)', // blue-500/15
      shadow: 'rgba(59, 130, 246, 0.25)'    // blue-500/25
    },
    dark: {
      primary: '#60a5fa',      // blue-400
      blur: '#1e3a8a80',       // blue-900/50  
      gradient: 'rgba(96, 165, 250, 0.20)', // blue-400/20
      shadow: 'rgba(96, 165, 250, 0.35)'    // blue-400/35
    }
  },
  dislike: {
    light: {
      primary: '#ca8a04',      // yellow-600 (AMARELO)
      blur: '#fef3c780',       // yellow-200/50
      gradient: 'rgba(234, 179, 8, 0.15)',   // yellow-500/15
      shadow: 'rgba(234, 179, 8, 0.25)'      // yellow-500/25
    },
    dark: {
      primary: '#facc15',      // yellow-400
      blur: '#451a0380',       // yellow-900/50
      gradient: 'rgba(250, 204, 21, 0.20)',  // yellow-400/20
      shadow: 'rgba(250, 204, 21, 0.35)'     // yellow-400/35
    }
  },
  angry: {
    light: {
      primary: '#6b7280',      // gray-500 (CINZA)
      blur: '#f3f4f680',       // gray-200/50
      gradient: 'rgba(107, 114, 128, 0.15)',  // gray-500/15
      shadow: 'rgba(107, 114, 128, 0.25)'     // gray-500/25
    },
    dark: {
      primary: '#9ca3af',      // gray-400
      blur: '#37415180',       // gray-800/50
      gradient: 'rgba(156, 163, 175, 0.20)',  // gray-400/20
      shadow: 'rgba(156, 163, 175, 0.35)'     // gray-400/35
    }
  }
}

export const getReactionColors = (type: ReactionType, isDark: boolean): ReactionThemeColors => {
  return REACTION_THEME_COLORS[type][isDark ? 'dark' : 'light']
}

export const getReactionIcon = (type: ReactionType): string => {
  const icons: Record<ReactionType, string> = {
    love: '❤️',
    like: '👍',
    dislike: '👎', 
    angry: '😠'
  }
  return icons[type]
}