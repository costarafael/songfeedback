const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  try {
    console.log('📁 Configurando storage bucket no Supabase...')

    // Criar bucket songs
    const { error: bucketError } = await supabase.storage.createBucket('songs', {
      public: true,
      allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Storage bucket já existe')
      } else {
        console.error('❌ Erro ao criar bucket:', bucketError.message)
        return
      }
    } else {
      console.log('✅ Storage bucket criado com sucesso')
    }

    // Verificar se bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message)
    } else {
      const songsBucket = buckets.find(bucket => bucket.name === 'songs')
      if (songsBucket) {
        console.log('✅ Bucket "songs" confirmado:', {
          name: songsBucket.name,
          public: songsBucket.public,
          id: songsBucket.id
        })
      } else {
        console.log('❌ Bucket "songs" não encontrado')
      }
    }

    console.log('🎉 Setup do storage concluído!')
    
  } catch (error) {
    console.error('❌ Erro no setup do storage:', error.message)
  }
}

setupStorage()