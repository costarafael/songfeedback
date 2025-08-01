import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvc213dXZzaHB4eWh5bHpzaWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4MjQzOTksImV4cCI6MjA0NTQwMDM5OX0.eHzrP7c3uLqnEoaJq1vH-P0Zjs4I0LCjKz7pYqzNzC8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

      console.log('Starting direct upload to Supabase...', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      })

      // Upload directly to Supabase Storage
      setUploadProgress(50) // Show some progress
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('songs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      setUploadProgress(100) // Complete progress

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error('Erro no upload: ' + uploadError.message)
      }

      console.log('File uploaded successfully:', fileData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('songs')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)

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