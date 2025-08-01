'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UploadForm() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [enableTranscription, setEnableTranscription] = useState(true)
  const [message, setMessage] = useState('')
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const router = useRouter()

  // Função para extrair duração do arquivo de áudio
  const extractAudioDuration = (audioFile: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const objectUrl = URL.createObjectURL(audioFile)
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl)
        resolve(audio.duration)
      })
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Erro ao carregar áudio para extrair duração'))
      })
      
      audio.src = objectUrl
    })
  }

  // Função para lidar com seleção de arquivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setDuration(null)
    
    if (selectedFile) {
      try {
        const audioDuration = await extractAudioDuration(selectedFile)
        setDuration(audioDuration)
        console.log('Duração extraída:', audioDuration, 'segundos')
      } catch (error) {
        console.error('Erro ao extrair duração:', error)
        setMessage('Aviso: Não foi possível extrair a duração do áudio')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !title) {
      setMessage('Por favor, preencha o título e selecione um arquivo')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('artist', artist)
      
      // Adicionar duração se foi extraída
      if (duration !== null) {
        formData.append('duration', duration.toString())
      }

      // Upload via API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      // Log detailed response information
      console.log('Upload response status:', response.status)
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()))
      
      let result
      let responseText = ''
      try {
        const clonedResponse = response.clone()
        responseText = await clonedResponse.text()
        console.log('Raw response text (first 500 chars):', responseText.substring(0, 500))
        
        result = await response.json()
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError)
        console.error('Full response text:', responseText)
        
        // Check if it's a Vercel error page
        if (responseText.includes('Request Entity Too Large') || responseText.includes('413')) {
          throw new Error('Arquivo muito grande para upload (limite: 20MB)')
        }
        if (responseText.includes('Timeout') || responseText.includes('timeout')) {
          throw new Error('Timeout no upload - tente um arquivo menor')
        }
        if (responseText.includes('Internal Server Error') || responseText.includes('500')) {
          throw new Error('Erro interno do servidor - tente novamente')
        }
        
        throw new Error(`Erro no servidor (${response.status}): ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP ${response.status}`)
      }

      setMessage('Música enviada com sucesso!')
      
      // Se transcrição está habilitada, processar automaticamente
      if (enableTranscription && result.songId) {
        setTranscribing(true)
        setMessage('Música enviada! Iniciando transcrição automática...')
        
        try {
          const transcriptionData = new FormData()
          transcriptionData.append('songId', result.songId)
          transcriptionData.append('audioFile', file)
          
          const transcriptionResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: transcriptionData
          })
          
          let transcriptionResult: any = {}
          
          try {
            transcriptionResult = await transcriptionResponse.json()
          } catch (jsonError) {
            console.error('Error parsing transcription response:', jsonError)
            transcriptionResult = { error: 'Erro ao processar resposta da transcrição' }
          }
          
          if (transcriptionResponse.ok) {
            setTranscriptionResult(transcriptionResult.transcription?.text || 'Transcrição concluída')
            setMessage('Música enviada e transcrita com sucesso!')
          } else {
            const errorMsg = transcriptionResult.error || `Erro HTTP ${transcriptionResponse.status}`
            setMessage('Música enviada, mas erro na transcrição: ' + errorMsg)
            console.error('Transcription API error:', {
              status: transcriptionResponse.status,
              error: transcriptionResult
            })
          }
        } catch (transcriptionError) {
          console.error('Transcription error:', transcriptionError)
          setMessage('Música enviada, mas erro na transcrição automática')
        } finally {
          setTranscribing(false)
        }
      }
      
      setTitle('')
      setArtist('')
      setFile(null)
      setDuration(null)
      setEnableTranscription(true)
      setTranscriptionResult('')
      
      // Reset form
      const form = e.target as HTMLFormElement
      form.reset()
      
      // Refresh page to show new song
      router.refresh()

    } catch (error) {
      console.error('Upload error:', error)
      setMessage(`Erro ao enviar música: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título da Música *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Digite o título da música"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Artista (opcional)
        </label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Digite o nome do artista"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Arquivo de Áudio *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="w-full"
            required
          />
          <div className="text-center mt-4">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Selecione um arquivo de áudio (MP3, WAV, etc.)
            </p>
            {file && (
              <div className="text-sm mt-2">
                <p className="text-green-600">
                  Arquivo selecionado: {file.name}
                </p>
                {duration !== null && (
                  <p className="text-blue-600">
                    Duração: {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={enableTranscription}
            onChange={(e) => setEnableTranscription(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Transcrever letra automaticamente (ElevenLabs)
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          A transcrição será processada após o upload e salvará a letra com timestamps
        </p>
      </div>

      {transcriptionResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Letra Transcrita:</h4>
          <p className="text-sm text-blue-800 whitespace-pre-wrap">{transcriptionResult}</p>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('sucesso') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || transcribing || !file || !title}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? 'Enviando...' : 
         transcribing ? 'Transcrevendo...' : 
         'Enviar Música'}
      </button>
    </form>
  )
}