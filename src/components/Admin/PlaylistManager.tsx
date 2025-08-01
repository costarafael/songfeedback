'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, GripVertical, Trash2, Share, ExternalLink, Edit } from 'lucide-react'
import { Song } from '@/lib/types'

interface Playlist {
  id: string
  name: string
  description?: string
  share_token: string
  created_at: string
  songs?: PlaylistSong[]
}

interface PlaylistSong {
  id: string
  song_id: string
  position: number
  song: Song
}

export default function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')

  useEffect(() => {
    fetchPlaylists()
    fetchSongs()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists')
      const data = await response.json()
      if (response.ok) {
        setPlaylists(data.playlists)
      }
    } catch (error) {
      console.error('Error fetching playlists:', error)
    }
  }

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs')
      const data = await response.json()
      if (response.ok) {
        setSongs(data.songs)
      }
    } catch (error) {
      console.error('Error fetching songs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylistSongs = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs`)
      const data = await response.json()
      if (response.ok) {
        setSelectedPlaylist(prev => prev ? { ...prev, songs: data.songs } : null)
      }
    } catch (error) {
      console.error('Error fetching playlist songs:', error)
    }
  }

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDescription
        })
      })

      if (response.ok) {
        setNewPlaylistName('')
        setNewPlaylistDescription('')
        setIsCreateModalOpen(false)
        fetchPlaylists()
      }
    } catch (error) {
      console.error('Error creating playlist:', error)
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta playlist?')) return

    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPlaylists()
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(null)
        }
      }
    } catch (error) {
      console.error('Error deleting playlist:', error)
    }
  }

  const addSongToPlaylist = async (songId: string) => {
    if (!selectedPlaylist) return

    try {
      const response = await fetch(`/api/playlists/${selectedPlaylist.id}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId })
      })

      if (response.ok) {
        fetchPlaylistSongs(selectedPlaylist.id)
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error)
    }
  }

  const removeSongFromPlaylist = async (playlistSongId: string) => {
    if (!selectedPlaylist) return

    try {
      const response = await fetch(`/api/playlists/${selectedPlaylist.id}/songs/${playlistSongId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPlaylistSongs(selectedPlaylist.id)
      }
    } catch (error) {
      console.error('Error removing song from playlist:', error)
    }
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination || !selectedPlaylist?.songs) return

    const items = Array.from(selectedPlaylist.songs)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update local state immediately
    setSelectedPlaylist(prev => prev ? { ...prev, songs: items } : null)

    // Update positions on server
    try {
      const response = await fetch(`/api/playlists/${selectedPlaylist.id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songIds: items.map(item => item.song_id)
        })
      })

      if (!response.ok) {
        // Revert on error
        fetchPlaylistSongs(selectedPlaylist.id)
      }
    } catch (error) {
      console.error('Error reordering songs:', error)
      fetchPlaylistSongs(selectedPlaylist.id)
    }
  }

  const getShareUrl = (shareToken: string) => {
    return `${window.location.origin}/playlist/${shareToken}`
  }

  const copyShareUrl = (shareToken: string) => {
    navigator.clipboard.writeText(getShareUrl(shareToken))
    alert('Link copiado para a área de transferência!')
  }

  if (loading) {
    return <div className="p-6">Carregando playlists...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gerenciar Playlists</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playlists List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Playlists</h3>
          
          {playlists.length === 0 ? (
            <p className="text-gray-600">Nenhuma playlist criada ainda.</p>
          ) : (
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlaylist?.id === playlist.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedPlaylist(playlist)
                    fetchPlaylistSongs(playlist.id)
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{playlist.name}</h4>
                      {playlist.description && (
                        <p className="text-sm text-gray-600 mt-1">{playlist.description}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyShareUrl(playlist.share_token)
                        }}
                        className="text-gray-500 hover:text-blue-600"
                        title="Copiar link"
                      >
                        <Share className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(getShareUrl(playlist.share_token), '_blank')
                        }}
                        className="text-gray-500 hover:text-green-600"
                        title="Abrir playlist"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePlaylist(playlist.id)
                        }}
                        className="text-gray-500 hover:text-red-600"
                        title="Excluir playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Playlist Editor */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {selectedPlaylist ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedPlaylist.name}</h3>
                <div className="text-sm text-gray-600">
                  {selectedPlaylist.songs?.length || 0} música(s)
                </div>
              </div>

              {/* Add Songs */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Adicionar Músicas</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {songs
                    .filter(song => !selectedPlaylist.songs?.some(ps => ps.song_id === song.id))
                    .map((song) => (
                    <div
                      key={song.id}
                      className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{song.title}</div>
                        {song.artist && <div className="text-sm text-gray-600">{song.artist}</div>}
                      </div>
                      <button
                        onClick={() => addSongToPlaylist(song.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Playlist Songs */}
              <div>
                <h4 className="font-medium mb-3">Músicas da Playlist</h4>
                {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 ? (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="playlist-songs">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {selectedPlaylist.songs.map((playlistSong, index) => (
                            <Draggable key={playlistSong.id} draggableId={playlistSong.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center space-x-3 p-3 border rounded-lg ${
                                    snapshot.isDragging ? 'shadow-lg bg-white' : 'bg-gray-50'
                                  }`}
                                >
                                  <div {...provided.dragHandleProps} className="text-gray-400">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="font-medium">{playlistSong.song.title}</div>
                                    {playlistSong.song.artist && (
                                      <div className="text-sm text-gray-600">{playlistSong.song.artist}</div>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => removeSongFromPlaylist(playlistSong.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <p className="text-gray-600">Nenhuma música na playlist ainda.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-600">Selecione uma playlist para editar.</p>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Playlist</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Playlist *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome da playlist"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição da playlist"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setNewPlaylistName('')
                  setNewPlaylistDescription('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Criar Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}