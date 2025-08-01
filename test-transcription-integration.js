const fs = require('fs');

async function testTranscriptionIntegration() {
  console.log('🧪 Testando integração completa de transcrição...');
  
  try {
    // 1. Fazer upload da música primeiro
    console.log('📤 Fazendo upload da música...');
    
    const testFile = './teste-api.m4a';
    const fileBuffer = fs.readFileSync(testFile);
    const audioBlob = new Blob([fileBuffer], { type: 'audio/mpeg' }); // Testar com audio/mpeg
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', audioBlob, 'teste-api.m4a');
    uploadFormData.append('title', 'Teste Transcrição');
    uploadFormData.append('artist', 'Teste');
    
    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: uploadFormData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload concluído:', uploadResult.songId);
    
    // 2. Fazer transcrição
    console.log('🎤 Iniciando transcrição...');
    
    const transcriptionFormData = new FormData();
    transcriptionFormData.append('songId', uploadResult.songId);
    transcriptionFormData.append('audioFile', audioBlob, 'teste-api.m4a');
    
    const transcriptionResponse = await fetch('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: transcriptionFormData
    });
    
    console.log('📡 Status da transcrição:', transcriptionResponse.status);
    
    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('❌ Erro na transcrição:', errorText);
      return;
    }
    
    const transcriptionResult = await transcriptionResponse.json();
    console.log('✅ Transcrição concluída!');
    console.log('📝 Resultado:', {
      success: transcriptionResult.success,
      text: transcriptionResult.transcription?.text,
      language: transcriptionResult.transcription?.language,
      confidence: transcriptionResult.transcription?.confidence,
      duration: transcriptionResult.transcription?.duration
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testTranscriptionIntegration();