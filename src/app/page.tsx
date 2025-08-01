import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Song } from '@/lib/types'

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

export default async function Home() {
  const songs = await getSongs()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Feedback Song</h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Músicas Disponíveis</h2>
            <Link 
              href="/admin" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Admin
            </Link>
          </div>

          {songs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Nenhuma música disponível</p>
              <Link 
                href="/admin" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Adicionar Primeira Música
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {songs.map((song) => (
                <div key={song.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold">{song.title}</h3>
                      {song.artist && (
                        <p className="text-gray-600">por {song.artist}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {song.listen_count} reproduções
                      </p>
                    </div>
                    <Link
                      href={`/player/${song.id}`}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      Escutar & Reagir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}