-- Function to update playlist positions after deleting a song
CREATE OR REPLACE FUNCTION update_playlist_positions_after_delete(
  playlist_id UUID,
  deleted_position INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE playlist_songs 
  SET position = position - 1 
  WHERE playlist_id = $1 AND position > $2;
END;
$$ LANGUAGE plpgsql;