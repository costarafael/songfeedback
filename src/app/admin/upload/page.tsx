'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Upload, Button, Form, Input, Card, Progress, Space, Typography, Divider, Tag, App, Row, Col, Grid } from 'antd'
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
const { useBreakpoint } = Grid

interface UploadFile {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error'
  response?: any
  percent?: number
}

export default function UploadPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [enableTranscription, setEnableTranscription] = useState(true)
  const [transcriptionResult, setTranscriptionResult] = useState<string>('')
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null)
  const [extractingMetadata, setExtractingMetadata] = useState(false)
  const router = useRouter()
  const screens = useBreakpoint()

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

      // Extract metadata from the file
      setExtractingMetadata(true)
      let metadata = null
      
      try {
        const metadataFormData = new FormData()
        metadataFormData.append('file', file)
        
        const metadataResponse = await fetch('/api/extract-metadata', {
          method: 'POST',
          body: metadataFormData
        })
        
        if (metadataResponse.ok) {
          const metadataResult = await metadataResponse.json()
          metadata = metadataResult.metadata
          setExtractedMetadata(metadata)
          message.success('Metadados extraídos com sucesso!')
        } else {
          console.warn('Erro ao extrair metadados, continuando com upload básico')
        }
      } catch (metadataError) {
        console.warn('Erro ao extrair metadados:', metadataError)
      } finally {
        setExtractingMetadata(false)
      }

      // Create song record with metadata
      const songData = {
        title: metadata?.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata?.artist || null,
        album: metadata?.album || null,
        year: metadata?.year || null,
        genre: metadata?.genre || null,
        duration: metadata?.duration || null,
        cover_image_url: metadata?.coverImageUrl || null,
        cover_image_key: metadata?.coverImageKey || null,
        metadata: metadata?.fullMetadata || null,
        file_url: publicUrl
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
      <Row justify="center">
        <Col xs={24} sm={24} md={20} lg={16} xl={14}>
          <Card size={screens.xs ? 'small' : 'default'}>
            <Space 
              direction="vertical" 
              size={screens.xs ? 'middle' : 'large'} 
              style={{ width: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={screens.xs ? 4 : 3}>
                  <SoundOutlined /> Adicionar Nova Música
                </Title>
                <Text type="secondary" style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                  Faça o upload de arquivos de áudio nos formatos MP3, WAV, M4A, AAC ou OGG
                </Text>
              </div>

            <Dragger 
              {...uploadProps}
              style={{ 
                padding: screens.xs ? '16px 8px' : '24px 16px',
                minHeight: screens.xs ? '120px' : '180px'
              }}
            >
              {uploading || extractingMetadata ? (
                <div>
                  <LoadingOutlined style={{ 
                    fontSize: screens.xs ? 32 : 48, 
                    color: '#1890ff' 
                  }} />
                  <p style={{ 
                    fontSize: screens.xs ? '14px' : '16px',
                    margin: screens.xs ? '8px 0 4px' : '16px 0 8px'
                  }}>
                    {extractingMetadata ? 'Extraindo metadados...' : 'Fazendo upload...'}
                  </p>
                  <Progress 
                    percent={uploadProgress} 
                    size={screens.xs ? 'small' : 'default'}
                    style={{ maxWidth: screens.xs ? '200px' : '300px', margin: '0 auto' }}
                  />
                </div>
              ) : uploadedFile ? (
                <div>
                  <CheckCircleOutlined style={{ 
                    fontSize: screens.xs ? 32 : 48, 
                    color: '#52c41a' 
                  }} />
                  <p style={{ 
                    fontSize: screens.xs ? '14px' : '16px',
                    margin: screens.xs ? '8px 0 4px' : '16px 0 8px'
                  }}>
                    Arquivo enviado com sucesso!
                  </p>
                  <p style={{ 
                    color: '#52c41a',
                    fontSize: screens.xs ? '12px' : '14px',
                    wordBreak: 'break-word'
                  }}>
                    {uploadedFile.title}
                  </p>
                </div>
              ) : (
                <div>
                  <CloudUploadOutlined style={{ 
                    fontSize: screens.xs ? 32 : 48 
                  }} />
                  <p style={{ 
                    fontSize: screens.xs ? '14px' : '16px',
                    margin: screens.xs ? '8px 0 4px' : '16px 0 8px',
                    padding: screens.xs ? '0 8px' : '0 16px'
                  }}>
                    Clique ou arraste arquivos para esta área para fazer upload
                  </p>
                  <p style={{ 
                    color: '#999',
                    fontSize: screens.xs ? '12px' : '14px',
                    padding: screens.xs ? '0 8px' : '0 16px'
                  }}>
                    Suporte para upload único. Arquivos de áudio apenas.
                  </p>
                </div>
              )}
            </Dragger>

            {uploadedFile && (
              <>
                <Divider>Informações da Música</Divider>
                
                {extractedMetadata && (
                  <Card 
                    size="small" 
                    style={{ 
                      marginBottom: screens.xs ? 12 : 16, 
                      backgroundColor: '#f6ffed' 
                    }}
                  >
                    <Space 
                      direction="vertical" 
                      size="small" 
                      style={{ width: '100%' }}
                    >
                      <Text 
                        strong 
                        style={{ 
                          color: '#52c41a',
                          fontSize: screens.xs ? '14px' : '16px'
                        }}
                      >
                        ✓ Metadados extraídos automaticamente:
                      </Text>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: screens.xs ? '4px' : '8px' 
                      }}>
                        {extractedMetadata.artist && (
                          <Tag 
                            color="blue" 
                            style={{ fontSize: screens.xs ? '12px' : '14px' }}
                          >
                            Artista: {extractedMetadata.artist}
                          </Tag>
                        )}
                        {extractedMetadata.album && (
                          <Tag 
                            color="green" 
                            style={{ fontSize: screens.xs ? '12px' : '14px' }}
                          >
                            Álbum: {extractedMetadata.album}
                          </Tag>
                        )}
                        {extractedMetadata.year && (
                          <Tag 
                            color="orange" 
                            style={{ fontSize: screens.xs ? '12px' : '14px' }}
                          >
                            Ano: {extractedMetadata.year}
                          </Tag>
                        )}
                        {extractedMetadata.genre && (
                          <Tag 
                            color="purple" 
                            style={{ fontSize: screens.xs ? '12px' : '14px' }}
                          >
                            Gênero: {extractedMetadata.genre}
                          </Tag>
                        )}
                        {extractedMetadata.duration && (
                          <Tag 
                            color="cyan" 
                            style={{ fontSize: screens.xs ? '12px' : '14px' }}
                          >
                            Duração: {Math.floor(extractedMetadata.duration / 60)}:{(extractedMetadata.duration % 60).toString().padStart(2, '0')}
                          </Tag>
                        )}
                        {extractedMetadata.coverImageUrl && (
                          <Tag 
                            color="magenta" 
                            style={{ fontSize: screens.xs ? '12px' : '14px' }}
                          >
                            Capa extraída ✓
                          </Tag>
                        )}
                      </div>
                      {extractedMetadata.coverImageUrl && (
                        <div style={{ 
                          textAlign: 'center', 
                          marginTop: screens.xs ? 6 : 8 
                        }}>
                          <Image 
                            src={extractedMetadata.coverImageUrl} 
                            alt="Capa do álbum" 
                            width={screens.xs ? 80 : 120}
                            height={screens.xs ? 80 : 120}
                            style={{ 
                              maxWidth: screens.xs ? 80 : 120, 
                              maxHeight: screens.xs ? 80 : 120, 
                              borderRadius: 4, 
                              objectFit: 'cover' 
                            }}
                          />
                        </div>
                      )}
                    </Space>
                  </Card>
                )}
                
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleFormSubmit}
                  initialValues={{
                    title: extractedMetadata?.title || uploadedFile.title,
                    artist: extractedMetadata?.artist || ''
                  }}
                >
                  <Row gutter={screens.xs ? [0, 16] : [16, 16]}>
                    <Col xs={24} sm={24} md={12}>
                      <Form.Item
                        label="Título da Música"
                        name="title"
                        rules={[{ required: true, message: 'Título é obrigatório' }]}
                      >
                        <Input 
                          placeholder="Nome da música" 
                          size={screens.xs ? 'large' : 'middle'}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={24} md={12}>
                      <Form.Item
                        label="Artista"
                        name="artist"
                      >
                        <Input 
                          placeholder="Nome do artista (opcional)" 
                          size={screens.xs ? 'large' : 'middle'}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Space 
                      direction={screens.xs ? 'vertical' : 'horizontal'}
                      align={screens.xs ? 'start' : 'center'}
                      size={screens.xs ? 'small' : 'middle'}
                    >
                      <Space align="center" size="small">
                        <input
                          type="checkbox"
                          checked={enableTranscription}
                          onChange={(e) => setEnableTranscription(e.target.checked)}
                          style={{ 
                            marginRight: '8px',
                            transform: screens.xs ? 'scale(1.2)' : 'scale(1)'
                          }}
                        />
                        <Text style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                          Transcrever letra automaticamente (ElevenLabs)
                        </Text>
                      </Space>
                    </Space>
                    <div style={{ 
                      fontSize: screens.xs ? '11px' : '12px', 
                      color: '#666', 
                      marginTop: screens.xs ? '6px' : '4px',
                      lineHeight: '1.4'
                    }}>
                      A transcrição será processada após salvar e salvará a letra com timestamps
                    </div>
                  </Form.Item>

                  {transcriptionResult && (
                    <div style={{ 
                      padding: screens.xs ? '10px' : '12px', 
                      backgroundColor: '#f0f9ff', 
                      border: '1px solid #bae6fd', 
                      borderRadius: '6px',
                      marginBottom: screens.xs ? '12px' : '16px'
                    }}>
                      <Text 
                        strong 
                        style={{ 
                          color: '#1e40af',
                          fontSize: screens.xs ? '14px' : '16px'
                        }}
                      >
                        Letra Transcrita:
                      </Text>
                      <div style={{ 
                        fontSize: screens.xs ? '13px' : '14px', 
                        color: '#1e40af', 
                        whiteSpace: 'pre-wrap',
                        marginTop: screens.xs ? '6px' : '8px',
                        lineHeight: '1.5',
                        maxHeight: screens.xs ? '200px' : '300px',
                        overflowY: 'auto'
                      }}>
                        {transcriptionResult}
                      </div>
                    </div>
                  )}

                  <Form.Item>
                    <Space 
                      direction={screens.xs ? 'vertical' : 'horizontal'}
                      size={screens.xs ? 'middle' : 'small'}
                      style={{ width: screens.xs ? '100%' : 'auto' }}
                    >
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={transcribing}
                        size={screens.xs ? 'large' : 'middle'}
                        style={{ 
                          width: screens.xs ? '100%' : 'auto',
                          minWidth: screens.xs ? 'auto' : '140px'
                        }}
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
                        size={screens.xs ? 'large' : 'middle'}
                        style={{ 
                          width: screens.xs ? '100%' : 'auto',
                          minWidth: screens.xs ? 'auto' : '140px'
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
        </Col>
      </Row>
    </AdminLayout>
  )
}