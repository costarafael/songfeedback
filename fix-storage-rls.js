const { Client } = require('pg')

const connectionString = 'postgresql://postgres:songfeedback@db.sosmwuvshpxyhylzsiis.supabase.co:5432/postgres'

async function fixStorageRLS() {
  const client = new Client({ connectionString })
  
  try {
    console.log('🔓 Desabilitando RLS no storage...')
    await client.connect()

    // Desabilitar RLS nas tabelas do storage
    await client.query(`
      -- Desabilitar RLS para o bucket storage
      ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
      ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
    `)
    
    console.log('✅ RLS desabilitado no storage')

    // Verificar se as políticas existem e removê-las
    console.log('🧹 Removendo políticas restritivas...')
    
    await client.query(`
      -- Remover políticas existentes se houver
      DROP POLICY IF EXISTS "songs bucket policy" ON storage.objects;
      DROP POLICY IF EXISTS "songs bucket select policy" ON storage.objects;
      DROP POLICY IF EXISTS "songs bucket insert policy" ON storage.objects;
      DROP POLICY IF EXISTS "songs bucket update policy" ON storage.objects;
      DROP POLICY IF EXISTS "songs bucket delete policy" ON storage.objects;
    `)

    console.log('✅ Políticas removidas')

    // Criar políticas permissivas para o bucket songs
    console.log('🔑 Criando políticas permissivas...')
    
    await client.query(`
      -- Política permissiva para SELECT
      CREATE POLICY "Allow public read on songs bucket" ON storage.objects
        FOR SELECT USING (bucket_id = 'songs');
      
      -- Política permissiva para INSERT
      CREATE POLICY "Allow public insert on songs bucket" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'songs');
      
      -- Política permissiva para UPDATE
      CREATE POLICY "Allow public update on songs bucket" ON storage.objects
        FOR UPDATE USING (bucket_id = 'songs');
      
      -- Política permissiva para DELETE
      CREATE POLICY "Allow public delete on songs bucket" ON storage.objects
        FOR DELETE USING (bucket_id = 'songs');
    `)

    console.log('✅ Políticas permissivas criadas')
    console.log('🎉 Storage configurado com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao configurar storage:', error.message)
  } finally {
    await client.end()
  }
}

fixStorageRLS()