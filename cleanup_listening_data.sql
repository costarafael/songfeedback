-- Script para limpar dados corrompidos de listening segments
-- Execute este script no Supabase SQL Editor

-- 1. Limpar todos os segmentos de escuta (dados corrompidos)
DELETE FROM listening_segments;

-- 2. Resetar estatísticas das sessões de escuta
UPDATE listening_sessions 
SET 
  total_listened_time = 0,
  completion_percentage = 0,
  skip_count = 0
WHERE total_listened_time IS NOT NULL OR completion_percentage IS NOT NULL OR skip_count IS NOT NULL;

-- 3. Verificar quantos registros foram afetados
SELECT 
  'listening_segments' as table_name,
  COUNT(*) as remaining_records
FROM listening_segments

UNION ALL

SELECT 
  'listening_sessions' as table_name,
  COUNT(*) as total_sessions
FROM listening_sessions;

-- 4. Mostrar estatísticas de songs para verificar se outros dados estão OK
SELECT 
  id,
  title,
  duration,
  listen_count
FROM songs 
ORDER BY id DESC 
LIMIT 5;

-- Comentários:
-- - listening_segments: Tabela limpa completamente (dados eram incorretos)
-- - listening_sessions: Estatísticas zeradas mas sessões mantidas
-- - songs: Dados não afetados (listen_count e duração estão corretos)
-- - reactions: Dados não afetados (funcionando corretamente)

COMMIT;