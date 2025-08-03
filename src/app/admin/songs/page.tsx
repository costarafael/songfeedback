'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Table, Button, Space, Tag, Typography, Input, Modal, Form, Upload, Popconfirm, App, Row, Col, Dropdown } from 'antd'
import type { TableProps } from 'antd'
import { 
  SoundOutlined, 
  DeleteOutlined, 
  BarChartOutlined,
  UploadOutlined,
  SearchOutlined,
  EditOutlined,
  PlayCircleOutlined,
  MoreOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/Admin/AdminLayout'
import { useResponsive } from '@/hooks/useResponsive'

const { Title, Text } = Typography
const { Search } = Input

interface Song {
  id: string
  title: string
  artist?: string
  album?: string
  year?: number
  genre?: string
  duration?: number
  created_at: string
  transcription_data?: any
  file_url?: string
  cover_image_url?: string
  cover_image_key?: string
  metadata?: any
}

export default function SongsPage() {
  const { message } = App.useApp()
  const { isMobile, isTablet } = useResponsive()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const router = useRouter()

  useEffect(() => {
    fetchSongs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const getActionDropdown = (record: Song) => ({
    items: [
      {
        key: 'player',
        label: 'Player',
        icon: <PlayCircleOutlined />,
        onClick: () => window.open(`/player/${record.id}`, '_blank'),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: <EditOutlined />,
        onClick: () => handleEdit(record),
      },
      {
        key: 'stats',
        label: 'Estatísticas',
        icon: <BarChartOutlined />,
        onClick: () => router.push(`/admin/stats/${record.id}`),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: 'Excluir música',
            content: 'Tem certeza que deseja excluir esta música?',
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => handleDelete(record.id),
          })
        },
      },
    ],
  })

  const columns: TableProps<Song>['columns'] = [
    {
      title: 'Música',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Song) => (
        <Space size={isMobile ? "small" : "middle"}>
          {record.cover_image_url && (
            <Image 
              src={record.cover_image_url} 
              alt={`Capa de ${text}`}
              width={isMobile ? 32 : 40}
              height={isMobile ? 32 : 40}
              style={{ 
                width: isMobile ? 32 : 40, 
                height: isMobile ? 32 : 40, 
                borderRadius: 4, 
                objectFit: 'cover',
                border: '1px solid #d9d9d9'
              }}
            />
          )}
          <Space direction="vertical" size="small">
            <Text strong={!isMobile} style={{ fontSize: isMobile ? 14 : undefined }}>
              {text}
            </Text>
            {record.artist && (
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : undefined }}>
                {record.artist}
              </Text>
            )}
            {!isMobile && (
              <Space size="small" wrap>
                {record.album && <Tag color="green" style={{ fontSize: '11px' }}>{record.album}</Tag>}
                {record.year && <Tag color="blue" style={{ fontSize: '11px' }}>{record.year}</Tag>}
                {record.genre && <Tag color="purple" style={{ fontSize: '11px' }}>{record.genre}</Tag>}
                {record.transcription_data && <Tag color="orange" style={{ fontSize: '11px' }}>COM LETRA</Tag>}
              </Space>
            )}
            {isMobile && record.duration && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {formatDuration(record.duration)}
              </Text>
            )}
          </Space>
        </Space>
      ),
    },
    ...(!isMobile ? [
      {
        title: 'Duração',
        dataIndex: 'duration',
        key: 'duration',
        render: (duration: number) => formatDuration(duration),
        width: 100,
        responsive: ['sm' as const],
      },
      {
        title: 'Criado em',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
        responsive: ['md' as const],
      }
    ] : []),
    {
      title: 'Ações',
      key: 'actions',
      width: isMobile ? 60 : 200,
      render: (_: any, record: Song) => (
        isMobile ? (
          <Dropdown
            menu={getActionDropdown(record)}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
            />
          </Dropdown>
        ) : (
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
        )
      ),
    },
  ]

  return (
    <AdminLayout 
      title="Gestão de Músicas"
      breadcrumbs={[{ title: 'Músicas' }]}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={16} md={12} lg={8}>
          <Search
            placeholder="Buscar por título ou artista..."
            allowClear
            style={{ width: '100%' }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
            size={isMobile ? 'large' : 'middle'}
          />
        </Col>
        <Col xs={24} sm={8} md={12} lg={16} style={{ textAlign: isMobile ? 'left' : 'right' }}>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={() => router.push('/admin/upload')}
            block={isMobile}
            size={isMobile ? 'large' : 'middle'}
          >
            Nova Música
          </Button>
        </Col>
      </Row>

      <Table
        dataSource={filteredSongs}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: isMobile ? 10 : 20,
          showSizeChanger: !isMobile,
          showQuickJumper: !isMobile,
          simple: isMobile,
          showTotal: !isMobile ? (total, range) => 
            `${range[0]}-${range[1]} de ${total} músicas` : undefined,
        }}
        size={isMobile ? 'small' : 'middle'}
        style={{ background: '#fff' }}
      />

      <Modal
        title="Editar Música"
        open={!!editingId}
        onOk={handleSave}
        onCancel={() => setEditingId(null)}
        okText="Salvar"
        cancelText="Cancelar"
        width={isMobile ? '95vw' : 520}
        style={isMobile ? { top: 20 } : {}}
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