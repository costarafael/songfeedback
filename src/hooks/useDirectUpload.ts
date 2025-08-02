import { useState } from 'react'

export function useDirectUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = async (
    file: File,
    title: string,
    artist: string,
    duration: number | null
  ) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

      console.log('Starting signed URL upload...', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      })

      // Get signed upload URL
      setUploadProgress(10)
      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName,
          fileType: file.type
        })
      })

      if (!urlResponse.ok) {
        const urlError = await urlResponse.json()
        throw new Error('Erro ao obter URL de upload: ' + urlError.error)
      }

      const { uploadUrl, publicUrl } = await urlResponse.json()
      console.log('Signed URL obtained:', uploadUrl)

      // Upload file using signed URL
      setUploadProgress(50)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Cache-Control': '3600'
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`Erro no upload: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      setUploadProgress(80)
      console.log('File uploaded successfully to:', publicUrl)

      // Register in database via API
      const response = await fetch('/api/upload-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName,
          title,
          artist,
          duration: duration?.toString(),
          fileUrl: publicUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao registrar música')
      }

      const result = await response.json()
      console.log('Database registration successful:', result)

      return {
        success: true,
        song: result.song,
        songId: result.songId
      }

    } catch (error) {
      console.error('Direct upload error:', error)
      throw error
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return {
    uploadFile,
    uploading,
    uploadProgress
  }
}