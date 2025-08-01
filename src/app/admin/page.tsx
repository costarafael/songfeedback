import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Song } from '@/lib/types'
import UploadForm from '@/components/Admin/UploadForm'
import PlaylistManager from '@/components/Admin/PlaylistManager'

async function getSongs() {
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .order('upload_date', { ascending: false })

  if (error) {
    console.error('Error fetching songs:', error)
    return []
  }

  return songs as Song[]
}

export default async function AdminPage() {
  const songs = await getSongs()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin - Feedback Song</h1>
          <Link 
            href="/" 
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Voltar ao Site
          </Link>
        </div>

        <div className="space-y-8">
          {/* Playlist Manager */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <PlaylistManager />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Upload de Música</h2>
              <UploadForm />
            </div>

            {/* Songs List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Músicas ({songs.length})</h2>
              
              {songs.length === 0 ? (
                <p className="text-gray-600">Nenhuma música enviada ainda</p>
              ) : (
                <div className="space-y-4">
                  {songs.map((song) => (
                    <div key={song.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{song.title}</h3>
                          {song.artist && (
                            <p className="text-gray-600">por {song.artist}</p>
                          )}
                          <div className="flex space-x-4 text-sm text-gray-500 mt-2">
                            <span>{song.listen_count} reproduções</span>
                            {song.duration && (
                              <span>{Math.floor(song.duration)}s</span>
                            )}
                            <span>
                              {new Date(song.upload_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/stats/${song.id}`}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Estatísticas
                          </Link>
                          <Link
                            href={`/player/${song.id}`}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Tocar
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}