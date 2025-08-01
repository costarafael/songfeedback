const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseKey = 'sb_publishable_nURVjIyUMclbdFZmeifBww_BTOgbz0V'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testApp() {
  try {
    console.log('🧪 Testando aplicação...')

    // Testar listagem de músicas
    console.log('📋 Testando listagem de músicas...')
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('*')

    if (songsError) {
      console.error('❌ Erro ao listar músicas:', songsError.message)
    } else {
      console.log(`✅ Músicas encontradas: ${songs.length}`)
    }

    // Testar storage
    console.log('📁 Testando storage...')
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.error('❌ Erro no storage:', storageError.message)
    } else {
      const songsBucket = buckets.find(b => b.name === 'songs')
      console.log(`✅ Storage funcionando. Bucket "songs": ${songsBucket ? 'OK' : 'NÃO ENCONTRADO'}`)
    }

    console.log('🎉 Teste concluído! Aplicação pronta para uso.')
    console.log('👉 Acesse: http://localhost:3000')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testApp()