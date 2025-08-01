-- Migração para Sistema de Tracking de Partes Ouvidas

-- 1. Criar tabela listening_segments
CREATE TABLE IF NOT EXISTS listening_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  start_time DECIMAL NOT NULL,
  end_time DECIMAL NOT NULL,
  is_sequential BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_listening_segments_session ON listening_segments(session_id);
CREATE INDEX IF NOT EXISTS idx_listening_segments_song ON listening_segments(song_id);
CREATE INDEX IF NOT EXISTS idx_listening_segments_time ON listening_segments(start_time, end_time);

-- 3. Adicionar colunas à tabela listening_sessions
ALTER TABLE listening_sessions 
ADD COLUMN IF NOT EXISTS total_listened_time DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS skip_count INTEGER DEFAULT 0;

-- 4. Função para atualizar estatísticas da sessão
CREATE OR REPLACE FUNCTION update_session_stats(
  p_session_id TEXT,
  p_duration_to_add DECIMAL,
  p_is_skip BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  -- Atualizar tempo total ouvido
  UPDATE listening_sessions 
  SET 
    total_listened_time = COALESCE(total_listened_time, 0) + p_duration_to_add,
    skip_count = CASE WHEN p_is_skip THEN COALESCE(skip_count, 0) + 1 ELSE COALESCE(skip_count, 0) END,
    updated_at = NOW()
  WHERE session_id = p_session_id;
  
  -- Calcular percentage de completion (precisa da duração da música)
  UPDATE listening_sessions ls
  SET completion_percentage = LEAST(100, (COALESCE(ls.total_listened_time, 0) / COALESCE(s.duration, 1)) * 100)
  FROM songs s
  WHERE ls.session_id = p_session_id 
    AND ls.song_id = s.id
    AND s.duration > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. View para analytics por música
CREATE OR REPLACE VIEW song_listening_analytics AS
SELECT 
  s.id as song_id,
  s.title,
  s.duration,
  COUNT(DISTINCT ls.session_id) as total_sessions,
  AVG(ls.completion_percentage) as avg_completion_rate,
  AVG(ls.total_listened_time) as avg_listened_time,
  SUM(ls.skip_count) as total_skips,
  AVG(ls.skip_count) as avg_skips_per_session
FROM songs s
LEFT JOIN listening_sessions ls ON s.id = ls.song_id
WHERE ls.session_id IS NOT NULL
GROUP BY s.id, s.title, s.duration;

-- 6. Função para gerar heatmap de uma música
CREATE OR REPLACE FUNCTION generate_song_heatmap(p_song_id UUID, p_resolution INTEGER DEFAULT 100)
RETURNS TABLE(time_bucket DECIMAL, listen_count BIGINT, intensity DECIMAL) AS $$
DECLARE
  song_duration DECIMAL;
  bucket_size DECIMAL;
BEGIN
  -- Obter duração da música
  SELECT duration INTO song_duration FROM songs WHERE id = p_song_id;
  
  IF song_duration IS NULL OR song_duration <= 0 THEN
    RETURN;
  END IF;
  
  bucket_size := song_duration / p_resolution;
  
  RETURN QUERY
  WITH time_buckets AS (
    SELECT 
      generate_series(0, p_resolution - 1) as bucket_index,
      generate_series(0, p_resolution - 1) * bucket_size as bucket_start,
      (generate_series(0, p_resolution - 1) + 1) * bucket_size as bucket_end
  ),
  segment_counts AS (
    SELECT 
      tb.bucket_index,
      tb.bucket_start,
      COUNT(seg.id) as listen_count
    FROM time_buckets tb
    LEFT JOIN listening_segments seg ON 
      seg.song_id = p_song_id AND
      seg.start_time < tb.bucket_end AND 
      seg.end_time > tb.bucket_start
    GROUP BY tb.bucket_index, tb.bucket_start
  ),
  max_count AS (
    SELECT MAX(listen_count) as max_listens FROM segment_counts
  )
  SELECT 
    sc.bucket_start,
    sc.listen_count,
    CASE 
      WHEN mc.max_listens > 0 THEN sc.listen_count::DECIMAL / mc.max_listens::DECIMAL
      ELSE 0
    END as intensity
  FROM segment_counts sc
  CROSS JOIN max_count mc
  ORDER BY sc.bucket_start;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para limpeza automática de segmentos antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_segments()
RETURNS VOID AS $$
BEGIN
  -- Manter apenas segmentos dos últimos 30 dias
  DELETE FROM listening_segments 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE listening_segments IS 'Armazena segmentos de tempo que foram efetivamente ouvidos pelos usuários';
COMMENT ON COLUMN listening_segments.is_sequential IS 'TRUE se foi ouvido sequencialmente, FALSE se chegou por navegação';
COMMENT ON FUNCTION update_session_stats IS 'Atualiza estatísticas agregadas da sessão de escuta';
COMMENT ON VIEW song_listening_analytics IS 'View com analytics agregadas por música';
COMMENT ON FUNCTION generate_song_heatmap IS 'Gera heatmap de intensidade de escuta para uma música';