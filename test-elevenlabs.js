const fs = require('fs');
const path = require('path');

async function testElevenLabsAPI() {
  console.log('🎵 Testando API da ElevenLabs...');
  
  try {
    // Verificar se o arquivo de teste existe
    const testFile = path.join(__dirname, 'teste-api.m4a');
    if (!fs.existsSync(testFile)) {
      console.error('❌ Arquivo teste-api.m4a não encontrado');
      return;
    }
    
    console.log('✅ Arquivo de teste encontrado:', testFile);
    console.log('📊 Tamanho do arquivo:', fs.statSync(testFile).size, 'bytes');
    
    // Preparar FormData
    const formData = new FormData();
    
    // Criar arquivo Blob a partir do buffer
    const fileBuffer = fs.readFileSync(testFile);
    const audioBlob = new Blob([fileBuffer], { type: 'audio/m4a' });
    
    formData.append('model_id', 'scribe_v1');
    formData.append('file', audioBlob, 'teste-api.m4a');
    formData.append('timestamps', 'true');
    formData.append('word_timestamps', 'true');
    
    console.log('🚀 Enviando para ElevenLabs API...');
    
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': 'sk_2ca0e00e81f8e3a5455f8854874b7f16bbfb71c66a8956d6',
      },
      body: formData
    });
    
    console.log('📡 Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ Transcrição concluída!');
    console.log('🌐 Idioma:', result.language_code);
    console.log('🎯 Confiança:', (result.language_probability * 100).toFixed(2) + '%');
    console.log('📝 Texto:', result.text?.substring(0, 200) + '...');
    console.log('🔢 Palavras com timestamp:', result.words?.length || 0);
    
    if (result.words && result.words.length > 0) {
      console.log('⏱️  Duração calculada:', Math.ceil(result.words[result.words.length - 1].end), 'segundos');
      console.log('🔤 Primeiras 5 palavras (apenas palavras, não espaços):');
      const onlyWords = result.words.filter(word => word.type === 'word');
      onlyWords.slice(0, 5).forEach((word, i) => {
        console.log(`  ${i+1}. "${word.text}" (${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s)`);
      });
    }
    
    // Salvar resultado completo em arquivo para análise
    fs.writeFileSync(
      path.join(__dirname, 'teste-elevenlabs-result.json'), 
      JSON.stringify(result, null, 2)
    );
    console.log('💾 Resultado completo salvo em: teste-elevenlabs-result.json');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testElevenLabsAPI();