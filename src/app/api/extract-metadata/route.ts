import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseBuffer } from 'music-metadata'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Extract metadata
    const metadata = await parseBuffer(buffer, file.type)
    
    let coverImageUrl = null
    let coverImageKey = null
    
    // Extract and upload cover art if exists
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0]
      const imageBuffer = Buffer.from(picture.data)
      
      // Generate unique filename for cover
      const timestamp = Date.now()
      const coverFileName = `cover_${timestamp}.${picture.format === 'image/jpeg' ? 'jpg' : 'png'}`
      
      // Create covers bucket if it doesn't exist
      const { error: bucketError } = await supabaseAdmin.storage.createBucket('covers', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png']
      })
      
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.warn('Could not create covers bucket:', bucketError)
      }

      // Upload cover to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('covers')
        .upload(coverFileName, imageBuffer, {
          contentType: picture.format,
          cacheControl: '3600'
        })
      
      if (uploadError) {
        console.error('Error uploading cover image:', uploadError)
      } else {
        // Get public URL for the cover
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('covers')
          .getPublicUrl(coverFileName)
        
        coverImageUrl = publicUrl
        coverImageKey = coverFileName
      }
    }
    
    // Prepare extracted metadata
    const extractedMetadata = {
      title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ''),
      artist: metadata.common.artist || metadata.common.albumartist,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre ? metadata.common.genre.join(', ') : null,
      duration: metadata.format.duration ? Math.round(metadata.format.duration) : null,
      bitrate: metadata.format.bitrate,
      sampleRate: metadata.format.sampleRate,
      numberOfChannels: metadata.format.numberOfChannels,
      coverImageUrl,
      coverImageKey,
      fullMetadata: {
        common: metadata.common,
        format: metadata.format
      }
    }
    
    return NextResponse.json({
      success: true,
      metadata: extractedMetadata
    })
    
  } catch (error) {
    console.error('Error extracting metadata:', error)
    return NextResponse.json(
      { error: 'Failed to extract metadata: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}