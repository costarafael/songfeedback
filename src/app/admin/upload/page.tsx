'use client'

import React, { useState } from 'react'
import { Upload, Button, Form, Input, Card, message, Progress, Space, Typography, Divider } from 'antd'
import { 
  CloudUploadOutlined, 
  SoundOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/Admin/AdminLayout'

const { Title, Text } = Typography
const { Dragger } = Upload

interface UploadFile {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error'
  response?: any
  percent?: number
}

export default function UploadPage() {
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [enableTranscription, setEnableTranscription] = useState(true)
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const router = useRouter()

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options

    try {
      setUploading(true)
      setUploadProgress(0)

      // Get upload URL
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      })

      if (!uploadUrlResponse.ok) {
        throw new Error('Erro ao obter URL de upload')
      }

      const { uploadUrl, key, publicUrl } = await uploadUrlResponse.json()

      // Upload file to Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro no upload do arquivo')
      }

      setUploadProgress(100)

      // Create song record
      const songData = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        file_url: publicUrl // Use correct Supabase public URL
      }

      const createSongResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(songData)
      })

      if (!createSongResponse.ok) {
        const errorText = await createSongResponse.text()
        console.error('Erro ao criar registro da música:', createSongResponse.status, errorText)
        throw new Error(`Erro ao criar registro da música: ${createSongResponse.status} - ${errorText}`)
      }

      const createdSong = await createSongResponse.json()
      setUploadedFile(createdSong)
      
      message.success('Upload realizado com sucesso!')
      onSuccess(createdSong, file)

    } catch (error) {
      console.error('Upload error:', error)
      message.error(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      onError(error)
    } finally {
      setUploading(false)
    }
  }

  const handleFormSubmit = async (values: any) => {
    if (!uploadedFile) {
      message.error('Por favor, faça o upload de um arquivo primeiro')
      return
    }

    try {
      const response = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uploadedFile.id,
          title: values.title,
          artist: values.artist
        })
      })

      if (response.ok) {
        message.success('Informações da música atualizadas com sucesso!')
        
        // Se transcrição está habilitada, processar automaticamente
        if (enableTranscription && uploadedFile.id) {
          setTranscribing(true)
          message.info('Iniciando transcrição automática...')
          
          try {
            const transcriptionData = new FormData()
            transcriptionData.append('songId', uploadedFile.id)
            
            const transcriptionResponse = await fetch('/api/transcribe', {
              method: 'POST',
              body: transcriptionData
            })
            
            const transcriptionResult = await transcriptionResponse.json()
            
            if (transcriptionResponse.ok) {
              setTranscriptionResult(transcriptionResult.transcription?.text || 'Transcrição concluída')
              message.success('Música atualizada e transcrita com sucesso!')
            } else {
              const errorMsg = transcriptionResult.error || `Erro HTTP ${transcriptionResponse.status}`
              message.warning('Música atualizada, mas erro na transcrição: ' + errorMsg)
            }
          } catch (transcriptionError) {
            console.error('Transcription error:', transcriptionError)
            message.warning('Música atualizada, mas erro na transcrição automática')
          } finally {
            setTranscribing(false)
          }
        }
        
        router.push('/admin/songs')
      } else {
        message.error('Erro ao atualizar informações da música')
      }
    } catch (error) {
      message.error('Erro ao atualizar informações da música')
    }
  }

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.mp3,.wav,.m4a,.aac,.ogg',
    customRequest: handleUpload,
    showUploadList: false,
    disabled: uploading || !!uploadedFile
  }

  return (
    <AdminLayout 
      title="Upload de Música"
      breadcrumbs={[{ title: 'Upload' }]}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3}>
                <SoundOutlined /> Adicionar Nova Música
              </Title>
              <Text type="secondary">
                Faça o upload de arquivos de áudio nos formatos MP3, WAV, M4A, AAC ou OGG
              </Text>
            </div>

            <Dragger {...uploadProps}>
              {uploading ? (
                <div>
                  <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  <p>Fazendo upload...</p>
                  <Progress percent={uploadProgress} />
                </div>
              ) : uploadedFile ? (
                <div>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <p>Arquivo enviado com sucesso!</p>
                  <p style={{ color: '#52c41a' }}>{uploadedFile.title}</p>
                </div>
              ) : (
                <div>
                  <CloudUploadOutlined style={{ fontSize: 48 }} />
                  <p>Clique ou arraste arquivos para esta área para fazer upload</p>
                  <p style={{ color: '#999' }}>
                    Suporte para upload único. Arquivos de áudio apenas.
                  </p>
                </div>
              )}
            </Dragger>

            {uploadedFile && (
              <>
                <Divider>Informações da Música</Divider>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleFormSubmit}
                  initialValues={{
                    title: uploadedFile.title,
                    artist: ''
                  }}
                >
                  <Form.Item
                    label="Título da Música"
                    name="title"
                    rules={[{ required: true, message: 'Título é obrigatório' }]}
                  >
                    <Input placeholder="Nome da música" />
                  </Form.Item>

                  <Form.Item
                    label="Artista"
                    name="artist"
                  >
                    <Input placeholder="Nome do artista (opcional)" />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <input
                        type="checkbox"
                        checked={enableTranscription}
                        onChange={(e) => setEnableTranscription(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      <Text>Transcrever letra automaticamente (ElevenLabs)</Text>
                    </Space>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      A transcrição será processada após salvar e salvará a letra com timestamps
                    </div>
                  </Form.Item>

                  {transcriptionResult && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#f0f9ff', 
                      border: '1px solid #bae6fd', 
                      borderRadius: '6px',
                      marginBottom: '16px'
                    }}>
                      <Text strong style={{ color: '#1e40af' }}>Letra Transcrita:</Text>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#1e40af', 
                        whiteSpace: 'pre-wrap',
                        marginTop: '8px'
                      }}>
                        {transcriptionResult}
                      </div>
                    </div>
                  )}

                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={transcribing}
                      >
                        {transcribing ? 'Transcrevendo...' : 'Salvar Informações'}
                      </Button>
                      <Button 
                        onClick={() => {
                          setUploadedFile(null)
                          setUploadProgress(0)
                          setTranscriptionResult('')
                          setEnableTranscription(true)
                          form.resetFields()
                        }}
                      >
                        Enviar Outro Arquivo
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </>
            )}
          </Space>
        </Card>
      </div>
    </AdminLayout>
  )
}