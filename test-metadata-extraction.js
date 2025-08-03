const fs = require('fs');
const { parseBuffer } = require('music-metadata');
const path = require('path');

async function testMetadataExtraction() {
  try {
    console.log('🎵 Testando extração de metadados do arquivo MP3...\n');
    
    const filePath = path.join(__dirname, 'Nao quero me controlar.mp3');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error('❌ Arquivo não encontrado:', filePath);
      return;
    }
    
    console.log('✅ Arquivo encontrado:', filePath);
    console.log('📊 Tamanho do arquivo:', (fs.statSync(filePath).size / 1024 / 1024).toFixed(2), 'MB\n');
    
    // Ler o arquivo
    const buffer = fs.readFileSync(filePath);
    console.log('✅ Arquivo lido em buffer\n');
    
    // Extrair metadados
    console.log('🔍 Extraindo metadados...');
    const metadata = await parseBuffer(buffer, 'audio/mpeg');
    
    // Mostrar informações básicas
    console.log('\n📝 METADADOS EXTRAÍDOS:');
    console.log('='.repeat(50));
    console.log('Título:', metadata.common.title || 'Não disponível');
    console.log('Artista:', metadata.common.artist || 'Não disponível');
    console.log('Álbum:', metadata.common.album || 'Não disponível');
    console.log('Ano:', metadata.common.year || 'Não disponível');
    console.log('Gênero:', metadata.common.genre ? metadata.common.genre.join(', ') : 'Não disponível');
    console.log('Duração:', metadata.format.duration ? `${Math.floor(metadata.format.duration / 60)}:${Math.floor(metadata.format.duration % 60).toString().padStart(2, '0')}` : 'Não disponível');
    
    // Informações técnicas
    console.log('\n🔧 INFORMAÇÕES TÉCNICAS:');
    console.log('='.repeat(50));
    console.log('Formato:', metadata.format.container || 'Desconhecido');
    console.log('Codec:', metadata.format.codec || 'Desconhecido');
    console.log('Bitrate:', metadata.format.bitrate ? `${metadata.format.bitrate} kbps` : 'Não disponível');
    console.log('Sample Rate:', metadata.format.sampleRate ? `${metadata.format.sampleRate} Hz` : 'Não disponível');
    console.log('Canais:', metadata.format.numberOfChannels || 'Não disponível');
    
    // Verificar se há capa/artwork
    console.log('\n🖼️ ARTWORK/CAPA:');
    console.log('='.repeat(50));
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      console.log('✅ Capa encontrada!');
      metadata.common.picture.forEach((pic, index) => {
        console.log(`  Imagem ${index + 1}:`);
        console.log(`    Formato: ${pic.format}`);
        console.log(`    Tamanho: ${(pic.data.length / 1024).toFixed(2)} KB`);
        console.log(`    Tipo: ${pic.type || 'Não especificado'}`);
        console.log(`    Descrição: ${pic.description || 'Não disponível'}`);
      });
      
      // Salvar a primeira imagem como teste
      const firstPicture = metadata.common.picture[0];
      const imageExt = firstPicture.format === 'image/jpeg' ? 'jpg' : 'png';
      const imagePath = path.join(__dirname, `cover_test.${imageExt}`);
      fs.writeFileSync(imagePath, firstPicture.data);
      console.log(`\n💾 Capa salva como: ${imagePath}`);
    } else {
      console.log('❌ Nenhuma capa encontrada no arquivo');
    }
    
    // Mostrar metadados completos (resumido)
    console.log('\n📋 RESUMO COMPLETO:');
    console.log('='.repeat(50));
    console.log('Common metadata keys:', Object.keys(metadata.common));
    console.log('Format metadata keys:', Object.keys(metadata.format));
    
    // Testar o que seria enviado para a API
    const extractedData = {
      title: metadata.common.title || 'Nao quero me controlar',
      artist: metadata.common.artist || metadata.common.albumartist,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre ? metadata.common.genre.join(', ') : null,
      duration: metadata.format.duration ? Math.round(metadata.format.duration) : null,
      bitrate: metadata.format.bitrate,
      sampleRate: metadata.format.sampleRate,
      numberOfChannels: metadata.format.numberOfChannels,
      hasCover: !!(metadata.common.picture && metadata.common.picture.length > 0)
    };
    
    console.log('\n🚀 DADOS PARA API:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(extractedData, null, 2));
    
    console.log('\n✅ Teste de extração concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testMetadataExtraction();