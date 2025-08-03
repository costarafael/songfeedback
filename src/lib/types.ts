export type ReactionType = 'love' | 'like' | 'dislike' | 'angry'

export interface Song {
  id: string
  title: string
  artist?: string
  file_url: string
  duration?: number
  upload_date: string
  listen_count: number
  // Campos de metadados extraídos
  album?: string
  year?: number
  genre?: string
  cover_image_url?: string
  cover_image_key?: string
  metadata?: any
  created_at?: string
  // Campos de transcrição ElevenLabs
  transcription_status?: 'pending' | 'processing' | 'completed' | 'failed'
  transcribed_text?: string
  transcription_data?: ElevenLabsTranscription
  transcription_language?: string
  transcription_confidence?: number
  transcription_job_id?: string
  transcribed_at?: string
}

export interface Reaction {
  id: string
  song_id: string
  reaction_type: ReactionType
  timestamp: number
  session_id: string
  created_at: string
}

export interface ListeningSession {
  id: string
  song_id: string
  session_id: string
  started_at: string
  completed: boolean
}

export interface ReactionStats {
  reaction_type: ReactionType
  count: number
  timestamps: number[]
}

// Tipos para ElevenLabs Transcription
export interface ElevenLabsWord {
  text: string
  start: number    // tempo em segundos
  end: number      // tempo em segundos
  type: 'word' | 'spacing'
  logprob: number
}

export interface ElevenLabsTranscription {
  language_code: string
  language_probability: number
  text: string
  words: ElevenLabsWord[]
}