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

      const { uploadUrl, key } = await uploadUrlResponse.json()

      // Upload file to S3
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
        file_key: key,
        file_url: `https://your-s3-bucket.s3.amazonaws.com/${key}` // Adjust this URL
      }

      const createSongResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(songData)
      })

      if (!createSongResponse.ok) {
        throw new Error('Erro ao criar registro da música')
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
          artist: values.artist,
          description: values.description
        })
      })

      if (response.ok) {
        message.success('Informações da música atualizadas com sucesso!')
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
                    artist: '',
                    description: ''
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

                  <Form.Item
                    label="Descrição"
                    name="description"
                  >
                    <Input.TextArea 
                      rows={3} 
                      placeholder="Descrição ou informações adicionais (opcional)" 
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        Salvar Informações
                      </Button>
                      <Button 
                        onClick={() => {
                          setUploadedFile(null)
                          setUploadProgress(0)
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