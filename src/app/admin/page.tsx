'use client'

import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, List, Avatar, Button, Space, Typography, Tag, Empty } from 'antd'
import {
  MusicOutlined,
  UnorderedListOutlined,
  UserOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/Admin/AdminLayout'
import { Song } from '@/lib/types'

const { Title, Text } = Typography

interface DashboardStats {
  totalSongs: number
  totalPlaylists: number
  totalPlays: number
  recentSongs: Song[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSongs: 0,
    totalPlaylists: 0,
    totalPlays: 0,
    recentSongs: []
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch songs
      const songsResponse = await fetch('/api/songs')
      const songsData = await songsResponse.json()
      const songs = songsData.songs || []
      
      // Fetch playlists
      const playlistsResponse = await fetch('/api/playlists')
      const playlistsData = await playlistsResponse.json()
      const playlists = playlistsData.playlists || []
      
      // Calculate stats
      const totalPlays = songs.reduce((sum: number, song: Song) => sum + (song.listen_count || 0), 0)
      const recentSongs = songs.slice(0, 5) // Most recent 5 songs
      
      setStats({
        totalSongs: songs.length,
        totalPlaylists: playlists.length,
        totalPlays,
        recentSongs
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const quickActions = [
    {
      title: 'Nova Música',
      description: 'Fazer upload de uma nova música',
      icon: <CloudUploadOutlined />,
      color: '#52c41a',
      action: () => router.push('/admin/upload')
    },
    {
      title: 'Nova Playlist',
      description: 'Criar uma nova playlist',
      icon: <PlusOutlined />,
      color: '#1890ff',
      action: () => router.push('/admin/playlists')
    },
    {
      title: 'Ver Estatísticas',
      description: 'Visualizar analytics gerais',
      icon: <BarChartOutlined />,
      color: '#722ed1',
      action: () => router.push('/admin/stats')
    },
    {
      title: 'Gerenciar Músicas',
      description: 'Ver todas as músicas',
      icon: <MusicOutlined />,
      color: '#fa8c16',
      action: () => router.push('/admin/songs')
    }
  ]

  return (
    <AdminLayout title="Dashboard">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total de Músicas"
              value={stats.totalSongs}
              prefix={<MusicOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total de Playlists"
              value={stats.totalPlaylists}
              prefix={<UnorderedListOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total de Plays"
              value={stats.totalPlays}
              prefix={<PlayCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ouvintes Únicos"
              value={Math.floor(stats.totalPlays * 0.7)} // Estimated unique listeners
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card title="Ações Rápidas" style={{ height: 400 }}>
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={24} sm={12} key={index}>
                  <Card
                    size="small"
                    hoverable
                    onClick={action.action}
                    style={{ 
                      height: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ 
                      fontSize: 32, 
                      color: action.color, 
                      marginBottom: 8 
                    }}>
                      {action.icon}
                    </div>
                    <div>
                      <Text strong>{action.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {action.description}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Recent Songs */}
        <Col xs={24} lg={12}>
          <Card 
            title="Músicas Recentes" 
            style={{ height: 400 }}
            extra={
              <Button 
                type="link" 
                size="small"
                onClick={() => router.push('/admin/songs')}
              >
                Ver todas
              </Button>
            }
          >
            {stats.recentSongs.length === 0 ? (
              <Empty
                description="Nenhuma música encontrada"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={() => router.push('/admin/upload')}
                >
                  Fazer Upload
                </Button>
              </Empty>
            ) : (
              <List
                dataSource={stats.recentSongs}
                loading={loading}
                renderItem={(song) => (
                  <List.Item
                    actions={[
                      <Button
                        key="stats"
                        type="text"
                        size="small"
                        icon={<BarChartOutlined />}
                        onClick={() => router.push(`/admin/stats/${song.id}`)}
                      >
                        Stats
                      </Button>,
                      <Button
                        key="play"
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/player/${song.id}`, '_blank')}
                      >
                        Ver
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<MusicOutlined />} 
                          style={{ backgroundColor: '#8b5cf6' }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{song.title}</Text>
                          {song.transcription_data && (
                            <Tag color="blue" size="small">COM LETRA</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space split={<span>•</span>} size="small">
                          {song.artist && <Text type="secondary">{song.artist}</Text>}
                          <Text type="secondary">{song.listen_count || 0} plays</Text>
                          {song.duration && (
                            <Text type="secondary">{formatDuration(song.duration)}</Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  )
}