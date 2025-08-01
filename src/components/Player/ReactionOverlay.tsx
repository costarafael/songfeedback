'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { getReactionColors, getReactionIcon } from '@/utils/reactionColors'
import { ReactionType } from '@/lib/types'
import { ReactionVisual } from '@/hooks/useReactionVisuals'

interface ReactionOverlayProps {
  reactions: ReactionVisual[]
  waveformHeight: number
  onReactionClick?: (reaction: ReactionVisual) => void
}

export default function ReactionOverlay({ 
  reactions, 
  waveformHeight,
  onReactionClick 
}: ReactionOverlayProps) {
  const isDark = useTheme()

  if (!reactions.length) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      <AnimatePresence>
        {reactions.map(reaction => {
          const colors = getReactionColors(reaction.reaction_type as ReactionType, isDark)
          
          return (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: 0.3 
              }}
              className="absolute cursor-pointer pointer-events-auto group"
              style={{
                left: `calc(${reaction.startPercent + (reaction.widthPercent / 2)}% - 8px)`,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30
              }}
              onClick={() => onReactionClick?.(reaction)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Reaction circle */}
              <div 
                className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
                style={{ 
                  backgroundColor: colors.primary,
                  boxShadow: `0 2px 12px ${colors.shadow}`
                }}
              />

              {/* Hover tooltip */}
              <motion.div
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 
                          bg-background/90 backdrop-blur-md rounded-lg px-3 py-1 
                          text-xs font-medium text-foreground border
                          shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap"
                style={{
                  borderColor: colors.primary + '40',
                  boxShadow: `0 4px 16px ${colors.shadow}`
                }}
                initial={{ opacity: 0, y: 5 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <span>{getReactionIcon(reaction.reaction_type as ReactionType)}</span>
                  <span className="capitalize">{reaction.reaction_type}</span>
                  <span className="text-muted-foreground">
                    {Math.round(reaction.timestamp)}s
                  </span>
                </div>
                
                {/* Tooltip arrow */}
                <div 
                  className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                  style={{ borderTopColor: colors.primary + '40' }}
                />
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Add CSS animations for the pulse effect */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        
        .reaction-region-content {
          animation: pulse 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}