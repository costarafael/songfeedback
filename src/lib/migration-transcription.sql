-- Migration para adicionar campos de transcrição ElevenLabs na tabela songs
-- Execute este script no SQL Editor do Supabase

ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS transcription_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS transcribed_text text,
ADD COLUMN IF NOT EXISTS transcription_data jsonb,
ADD COLUMN IF NOT EXISTS transcription_language text,
ADD COLUMN IF NOT EXISTS transcription_confidence real,
ADD COLUMN IF NOT EXISTS transcription_job_id text,
ADD COLUMN IF NOT EXISTS transcribed_at timestamp;

-- Adicionar constraint para transcription_status
ALTER TABLE songs 
ADD CONSTRAINT check_transcription_status 
CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed'));

-- Comentários para documentação
COMMENT ON COLUMN songs.transcription_status IS 'Status da transcrição: pending, processing, completed, failed';
COMMENT ON COLUMN songs.transcribed_text IS 'Texto completo transcrito pela ElevenLabs';
COMMENT ON COLUMN songs.transcription_data IS 'Dados JSON completos da API ElevenLabs com timestamps de palavras';
COMMENT ON COLUMN songs.transcription_language IS 'Idioma detectado pela transcrição';
COMMENT ON COLUMN songs.transcription_confidence IS 'Confiança da transcrição (0-1)';
COMMENT ON COLUMN songs.transcription_job_id IS 'ID do job de transcrição para tracking';
COMMENT ON COLUMN songs.transcribed_at IS 'Timestamp quando a transcrição foi completada';