'use client'

import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Typography, Input, Modal, Form, App, Select, Popconfirm, Card, List, Divider } from 'antd'
import { 
  UnorderedListOutlined, 
  DeleteOutlined, 
  ShareAltOutlined,
  EditOutlined,
  PlusOutlined,
  CopyOutlined,
  SoundOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MenuOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/Admin/AdminLayout'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Song {
  id: string
  title: string
  artist?: string
}

interface Playlist {
  id: string
  name: string
  description?: string
  share_token: string
  created_at: string
  songs?: Song[]
}

interface PlaylistSongManagerProps {
  songs: Song[]
  selectedSongs: string[]
  onSongsChange: (songIds: string[]) => void
}

function PlaylistSongManager({ songs, selectedSongs, onSongsChange }: PlaylistSongManagerProps) {
  const [availableSongs, setAvailableSongs] = useState<Song[]>([])
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([])

  useEffect(() => {
    // Separar músicas disponíveis das já selecionadas
    const selected = songs.filter(song => selectedSongs.includes(song.id))
    const available = songs.filter(song => !selectedSongs.includes(song.id))
    
    setPlaylistSongs(selected)
    setAvailableSongs(available)
  }, [songs, selectedSongs])

  const addSong = (song: Song) => {
    const newPlaylistSongs = [...playlistSongs, song]
    const newAvailableSongs = availableSongs.filter(s => s.id !== song.id)
    
    setPlaylistSongs(newPlaylistSongs)
    setAvailableSongs(newAvailableSongs)
    onSongsChange(newPlaylistSongs.map(s => s.id))
  }

  const removeSong = (song: Song) => {
    const newPlaylistSongs = playlistSongs.filter(s => s.id !== song.id)
    const newAvailableSongs = [...availableSongs, song].sort((a, b) => a.title.localeCompare(b.title))
    
    setPlaylistSongs(newPlaylistSongs)
    setAvailableSongs(newAvailableSongs)
    onSongsChange(newPlaylistSongs.map(s => s.id))
  }

  const moveSong = (fromIndex: number, toIndex: number) => {
    const newPlaylistSongs = [...playlistSongs]
    const [movedSong] = newPlaylistSongs.splice(fromIndex, 1)
    newPlaylistSongs.splice(toIndex, 0, movedSong)
    
    setPlaylistSongs(newPlaylistSongs)
    onSongsChange(newPlaylistSongs.map(s => s.id))
  }

  const moveUp = (index: number) => {
    if (index > 0) {
      moveSong(index, index - 1)
    }
  }

  const moveDown = (index: number) => {
    if (index < playlistSongs.length - 1) {
      moveSong(index, index + 1)
    }
  }

  return (
    <div>
      <Form.Item label="Gerenciar Músicas da Playlist">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Músicas Disponíveis */}
          <Card 
            title="Músicas Disponíveis" 
            size="small"
            style={{ maxHeight: 200, overflowY: 'auto' }}
          >
            {availableSongs.length > 0 ? (
              <List
                size="small"
                dataSource={availableSongs}
                renderItem={(song) => (
                  <List.Item
                    actions={[
                      <Button
                        key="add"
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() => addSong(song)}
                        size="small"
                      >
                        Adicionar
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<SoundOutlined />}
                      title={song.title}
                      description={song.artist}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Todas as músicas já foram adicionadas à playlist</Text>
            )}
          </Card>

          {/* Músicas da Playlist */}
          <Card title={`Músicas da Playlist (${playlistSongs.length})`} size="small">
            {playlistSongs.length > 0 ? (
              <List
                size="small"
                dataSource={playlistSongs}
                renderItem={(song, index) => (
                  <List.Item
                    actions={[
                      <Button
                        key="up"
                        type="text"
                        icon={<ArrowUpOutlined />}
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        size="small"
                      />,
                      <Button
                        key="down"
                        type="text"
                        icon={<ArrowDownOutlined />}
                        onClick={() => moveDown(index)}
                        disabled={index === playlistSongs.length - 1}
                        size="small"
                      />,
                      <Button
                        key="remove"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeSong(song)}
                        size="small"
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Tag color="blue" style={{ minWidth: 30, textAlign: 'center' }}>
                          {index + 1}
                        </Tag>
                      }
                      title={song.title}
                      description={song.artist}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Nenhuma música adicionada à playlist</Text>
            )}
          </Card>
        </Space>
      </Form.Item>
    </div>
  )
}

export default function PlaylistsPage() {
  const { message } = App.useApp()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const router = useRouter()

  useEffect(() => {
    fetchPlaylists()
    fetchSongs()
  }, [])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/playlists')
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        setPlaylists(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('Erro na resposta da API:', response.status, errorText)
        message.error(`Erro ao carregar playlists: ${response.status}`)
        setPlaylists([])
      }
    } catch (error) {
      console.error('Erro ao carregar playlists:', error)
      message.error(`Erro ao carregar playlists: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs')
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        setSongs(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('Erro na resposta da API songs:', response.status, errorText)
        setSongs([])
      }
    } catch (error) {
      console.error('Erro ao carregar músicas:', error)
      setSongs([])
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        message.success('Playlist excluída com sucesso')
        fetchPlaylists()
      } else {
        const errorText = await response.text()
        console.error('Erro ao excluir playlist:', response.status, errorText)
        message.error(`Erro ao excluir playlist: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao excluir playlist:', error)
      message.error(`Erro ao excluir playlist: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleEdit = (record: Playlist) => {
    setEditingId(record.id)
    setIsModalVisible(true)
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
      songIds: record.songs?.map(song => song.id) || []
    })
  }

  const handleCreate = () => {
    setEditingId(null)
    setIsModalVisible(true)
    form.resetFields()
    // Initialize songIds as empty array for new playlists
    form.setFieldsValue({ songIds: [] })
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      console.log('Form values to save:', values) // Debug log
      
      const url = editingId ? `/api/playlists/${editingId}` : '/api/playlists'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      if (response.ok) {
        message.success(`Playlist ${editingId ? 'atualizada' : 'criada'} com sucesso`)
        setIsModalVisible(false)
        setEditingId(null)
        fetchPlaylists()
      } else {
        const errorText = await response.text()
        console.error(`Erro ao ${editingId ? 'atualizar' : 'criar'} playlist:`, response.status, errorText)
        message.error(`Erro ao ${editingId ? 'atualizar' : 'criar'} playlist: ${response.status}`)
      }
    } catch (error) {
      console.error(`Erro ao ${editingId ? 'atualizar' : 'criar'} playlist:`, error)
      message.error(`Erro ao ${editingId ? 'atualizar' : 'criar'} playlist: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const copyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/playlist/${shareToken}`
    navigator.clipboard.writeText(shareUrl)
    message.success('Link copiado para a área de transferência!')
  }

  const filteredPlaylists = (playlists || []).filter(playlist =>
    playlist.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (playlist.description && playlist.description.toLowerCase().includes(searchText.toLowerCase()))
  )

  const columns = [
    {
      title: 'Playlist',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Playlist) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.description && <Text type="secondary">{record.description}</Text>}
          <Space>
            <Tag icon={<SoundOutlined />} color="blue">
              {record.songs?.length || 0} música(s)
            </Tag>
          </Space>
        </Space>
      ),
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
      width: 250,
      render: (_: any, record: Playlist) => (
        <Space>
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
            icon={<CopyOutlined />}
            onClick={() => copyShareLink(record.share_token)}
            size="small"
          >
            Copiar Link
          </Button>
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={() => window.open(`/playlist/${record.share_token}`, '_blank')}
            size="small"
          >
            Visualizar
          </Button>
          <Popconfirm
            title="Excluir playlist"
            description="Tem certeza que deseja excluir esta playlist?"
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
      title="Gestão de Playlists"
      breadcrumbs={[{ title: 'Playlists' }]}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="Buscar por nome ou descrição..."
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Nova Playlist
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredPlaylists}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} de ${total} playlists`,
        }}
      />

      <Modal
        title={editingId ? "Editar Playlist" : "Nova Playlist"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nome da Playlist"
            name="name"
            rules={[{ required: true, message: 'Nome é obrigatório' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Descrição"
            name="description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="songIds"
            style={{ display: 'none' }}
          >
            <Input type="hidden" />
          </Form.Item>
          <PlaylistSongManager
            songs={songs}
            selectedSongs={form.getFieldValue('songIds') || []}
            onSongsChange={(songIds) => form.setFieldsValue({ songIds })}
          />
        </Form>
      </Modal>
    </AdminLayout>
  )
}