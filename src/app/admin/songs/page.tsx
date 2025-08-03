'use client'

import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Typography, Input, Modal, Form, message, Upload, Popconfirm } from 'antd'
import { 
  SoundOutlined, 
  DeleteOutlined, 
  BarChartOutlined,
  UploadOutlined,
  SearchOutlined,
  EditOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/Admin/AdminLayout'

const { Title, Text } = Typography
const { Search } = Input

interface Song {
  id: string
  title: string
  artist?: string
  duration?: number
  created_at: string
  transcription_data?: any
  file_url?: string
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const router = useRouter()

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/songs')
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        setSongs(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('Erro na resposta da API:', response.status, errorText)
        message.error(`Erro ao carregar músicas: ${response.status}`)
        setSongs([])
      }
    } catch (error) {
      console.error('Erro ao carregar músicas:', error)
      message.error(`Erro ao carregar músicas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setSongs([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/songs/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        message.success('Música excluída com sucesso')
        fetchSongs()
      } else {
        const errorText = await response.text()
        console.error('Erro ao excluir música:', response.status, errorText)
        message.error(`Erro ao excluir música: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao excluir música:', error)
      message.error(`Erro ao excluir música: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleEdit = (record: Song) => {
    setEditingId(record.id)
    form.setFieldsValue({
      title: record.title,
      artist: record.artist || ''
    })
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const response = await fetch(`/api/songs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...values
        })
      })

      if (response.ok) {
        message.success('Música atualizada com sucesso')
        setEditingId(null)
        fetchSongs()
      } else {
        const errorText = await response.text()
        console.error('Erro ao atualizar música:', response.status, errorText)
        message.error(`Erro ao atualizar música: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar música:', error)
      message.error(`Erro ao atualizar música: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const filteredSongs = (songs || []).filter(song =>
    song.title.toLowerCase().includes(searchText.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchText.toLowerCase()))
  )

  const columns = [
    {
      title: 'Música',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Song) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.artist && <Text type="secondary">{record.artist}</Text>}
          {record.transcription_data && (
            <Tag color="blue">COM LETRA</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Duração',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => formatDuration(duration),
      width: 100,
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
      width: 120,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      render: (_: any, record: Song) => (
        <Space>
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            onClick={() => window.open(`/player/${record.id}`, '_blank')}
            size="small"
            title="Ouvir no Player"
          >
            Player
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Editar
          </Button>
          <Button
            type="text"
            icon={<BarChartOutlined />}
            onClick={() => router.push(`/admin/stats/${record.id}`)}
            size="small"
          >
            Stats
          </Button>
          <Popconfirm
            title="Excluir música"
            description="Tem certeza que deseja excluir esta música?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AdminLayout 
      title="Gestão de Músicas"
      breadcrumbs={[{ title: 'Músicas' }]}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="Buscar por título ou artista..."
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={() => router.push('/admin/upload')}
          >
            Nova Música
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredSongs}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} de ${total} músicas`,
        }}
      />

      <Modal
        title="Editar Música"
        open={!!editingId}
        onOk={handleSave}
        onCancel={() => setEditingId(null)}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Título"
            name="title"
            rules={[{ required: true, message: 'Título é obrigatório' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Artista"
            name="artist"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  )
}