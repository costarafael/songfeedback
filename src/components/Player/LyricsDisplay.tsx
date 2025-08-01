'use client'

import { useState, useEffect, useRef } from 'react'
import { ElevenLabsWord, ElevenLabsTranscription } from '@/lib/types'
import { ListeningSegment } from '@/hooks/useListeningTrackerSimple'

interface LyricsDisplayProps {
  transcriptionData?: ElevenLabsTranscription
  currentTime: number
  isVisible: boolean
  listeningSegments?: ListeningSegment[]
}

export default function LyricsDisplay({ 
  transcriptionData, 
  currentTime, 
  isVisible,
  listeningSegments = []
}: LyricsDisplayProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [lastValidWordIndex, setLastValidWordIndex] = useState(0) // Para manter última posição válida
  const [lastActiveWordIndex, setLastActiveWordIndex] = useState(-1) // Para manter palavra em foco sem piscar
  
  useEffect(() => {
    if (!transcriptionData?.words) return
    
    // Encontrar a palavra atual baseada no tempo
    const timeInSeconds = currentTime
    const activeWordIndex = transcriptionData.words.findIndex((word, index) => {
      const nextWord = transcriptionData.words[index + 1]
      return word.type === 'word' && 
             timeInSeconds >= word.start && 
             (!nextWord || timeInSeconds < nextWord.start)
    })
    
    setCurrentWordIndex(activeWordIndex)
    
    // Manter registro da última palavra válida encontrada
    if (activeWordIndex >= 0) {
      setLastValidWordIndex(activeWordIndex)
      setLastActiveWordIndex(activeWordIndex) // Manter em foco até próxima palavra
    }
  }, [currentTime, transcriptionData])

  // Função para determinar o tipo de segmento de uma palavra
  const getWordSegmentType = (wordTime: number): 'not_heard' | 'sequential' | 'navigated' => {
    const segment = listeningSegments.find(s => 
      wordTime >= s.startTime && wordTime <= s.endTime
    )
    
    if (!segment) return 'not_heard'
    return segment.isSequential ? 'sequential' : 'navigated'
  }

  if (!isVisible || !transcriptionData) return null

  // Exibir blocos de 10 palavras com esmaecimento gradual
  const getTenWordsBlock = () => {
    if (!transcriptionData?.words) return []
    
    const words = transcriptionData.words.filter(w => w.type === 'word')
    const blockSize = 10
    
    // Usar palavra ativa atual ou última válida se não há palavra ativa
    const targetWordIndex = currentWordIndex >= 0 ? currentWordIndex : lastValidWordIndex
    
    // Encontrar índice da palavra alvo no array filtrado
    const targetWordInFiltered = words.findIndex((_, index) => {
      const originalIndex = transcriptionData.words.findIndex(w => w === words[index])
      return originalIndex === targetWordIndex
    })
    
    // Se não encontrou, usar início
    const activeIndex = targetWordInFiltered >= 0 ? targetWordInFiltered : 0
    
    // Calcular início do bloco baseado na palavra ativa
    // O bloco se move quando chegamos na palavra 7 (índice 6 dentro do bloco)
    const blockStart = Math.floor(activeIndex / blockSize) * blockSize
    const end = Math.min(words.length, blockStart + blockSize)
    
    return words.slice(blockStart, end).map((word, index) => {
      const actualIndex = blockStart + index
      
      // Para evitar piscar, usar lastActiveWordIndex quando currentWordIndex é -1
      const displayActiveIndex = currentWordIndex >= 0 ? targetWordInFiltered : 
                                (lastActiveWordIndex >= 0 ? words.findIndex((_, idx) => {
                                  const origIdx = transcriptionData.words.findIndex(w => w === words[idx])
                                  return origIdx === lastActiveWordIndex
                                }) : -1)
      
      const isActive = displayActiveIndex >= 0 && actualIndex === displayActiveIndex
      
      // Calcular posição relativa dentro do bloco (0-9)
      const positionInBlock = index
      
      // Esmaecimento gradual: palavras mais antigas ficam mais transparentes
      let opacity = 1
      
      if (displayActiveIndex >= 0) {
        const activePositionInBlock = displayActiveIndex - blockStart
        const distanceFromActive = activePositionInBlock - positionInBlock
        
        // Se a palavra está antes da ativa, aplicar esmaecimento
        if (distanceFromActive > 0) {
          opacity = Math.max(0.1, 1 - (distanceFromActive * 0.15))
        }
      }
      
      // Determinar tipo de segmento para cores
      const segmentType = getWordSegmentType(word.start)
      
      return {
        word,
        isActive,
        opacity,
        segmentType,
        index: actualIndex,
        positionInBlock
      }
    })
  }
  
  const blockWords = getTenWordsBlock()

  return (
    <div className="w-full max-w-[600px] mt-4 bg-background rounded-xl p-4 shadow-[inset_8px_8px_20px_#46464635,inset_-8px_-8px_20px_#ffffff60] dark:shadow-[inset_8px_8px_20px_#00000050,inset_-8px_-8px_20px_#ffffff15]">
      <div className="text-center leading-relaxed flex items-center justify-center" style={{ height: '60px' }}>
        <div className="px-4 max-w-full">
          {blockWords.map((wordData) => (
            <span
              key={wordData.index}
              className={`
                font-ibm-plex-mono text-sm transition-all duration-500 inline
                ${wordData.isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : wordData.segmentType === 'not_heard'
                  ? 'text-gray-400 dark:text-gray-600'
                  : wordData.segmentType === 'navigated'
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-foreground'
                }
              `}
              style={{
                opacity: wordData.opacity,
                transition: 'opacity 500ms ease-in-out, color 300ms ease-in-out'
              }}
            >
              {wordData.word.text}{' '}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}