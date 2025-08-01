const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nURVjIyUMclbdFZmeifBww.supabase.co'
const supabaseKey = 'sb_publishable_nURVjIyUMclbdFZmeifBww_BTOgbz0V'

console.log('🧪 Testando conexão com Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Teste simples de conexão
    const { data, error } = await supabase.from('songs').select('count').limit(1)
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message)
      console.log('Código:', error.code)
      console.log('Detalhes:', error.details)
    } else {
      console.log('✅ Conexão estabelecida com sucesso!')
      console.log('Resposta:', data)
    }
  } catch (err) {
    console.log('❌ Erro de rede:', err.message)
  }
}

testConnection()