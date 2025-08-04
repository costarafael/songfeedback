'use client'

import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, List, Avatar, Button, Space, Typography, Tag, Empty } from 'antd'
import {
  SoundOutlined,
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
import { useResponsive } from '@/hooks/useResponsive'
import { Song } from '@/lib/types'

const { Title, Text } = Typography

interface DashboardStats {
  totalSongs: number
  totalPlaylists: number
  totalPlays: number
  totalUniqueListeners: number
  recentSongs: Song[]
}

export default function AdminDashboard() {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const [stats, setStats] = useState<DashboardStats>({
    totalSongs: 0,
    totalPlaylists: 0,
    totalPlays: 0,
    totalUniqueListeners: 0,
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
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/stats/dashboard')
      const statsData = await statsResponse.json()
      
      // Fetch songs for recent songs list
      const songsResponse = await fetch('/api/songs')
      const songsData = await songsResponse.json()
      const songs = songsData.songs || []
      
      const recentSongs = songs.slice(0, 5) // Most recent 5 songs
      
      setStats({
        totalSongs: statsData.totalSongs || 0,
        totalPlaylists: statsData.totalPlaylists || 0,
        totalPlays: statsData.totalPlays || 0,
        totalUniqueListeners: statsData.totalUniqueListeners || 0,
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
      icon: <SoundOutlined />,
      color: '#fa8c16',
      action: () => router.push('/admin/songs')
    }
  ]

  return (
    <AdminLayout title="Dashboard">
      {/* Welcome Message - Mobile Friendly */}
      <div style={{ 
        marginBottom: isMobile ? 16 : 24,
        textAlign: isMobile ? 'center' : 'left'
      }}>
        <Title 
          level={isMobile ? 3 : 2} 
          style={{ margin: 0, marginBottom: isMobile ? 4 : 8 }}
        >
          Bem-vindo ao Dashboard
        </Title>
        <Text 
          type="secondary" 
          style={{ 
            fontSize: isMobile ? 14 : 16,
            display: 'block'
          }}
        >
          Gerencie suas músicas e visualize estatísticas
        </Text>
      </div>

      {/* Statistics Cards - Responsive */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title="Total de Músicas"
              value={stats.totalSongs}
              prefix={<SoundOutlined />}
              loading={loading}
              valueStyle={{ 
                fontSize: isMobile ? 20 : 24,
                fontWeight: 'bold'
              }}
              style={{ textAlign: 'center' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title="Total de Playlists"
              value={stats.totalPlaylists}
              prefix={<UnorderedListOutlined />}
              loading={loading}
              valueStyle={{ 
                fontSize: isMobile ? 20 : 24,
                fontWeight: 'bold'
              }}
              style={{ textAlign: 'center' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title="Total de Plays"
              value={stats.totalPlays}
              prefix={<PlayCircleOutlined />}
              loading={loading}
              valueStyle={{ 
                fontSize: isMobile ? 20 : 24,
                fontWeight: 'bold'
              }}
              style={{ textAlign: 'center' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title="Ouvintes Únicos"
              value={stats.totalUniqueListeners}
              prefix={<UserOutlined />}
              loading={loading}
              valueStyle={{ 
                fontSize: isMobile ? 20 : 24,
                fontWeight: 'bold'
              }}
              style={{ textAlign: 'center' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
        {/* Quick Actions - Responsive */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Text 
                strong 
                style={{ 
                  fontSize: isMobile ? 16 : 18 
                }}
              >
                Ações Rápidas
              </Text>
            } 
            size={isMobile ? 'small' : 'default'}
            style={{ 
              height: isMobile ? 'auto' : (isTablet ? 350 : 400),
              marginBottom: isMobile ? 16 : 0
            }}
          >
            <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]}>
              {quickActions.map((action, index) => (
                <Col xs={12} sm={12} md={12} lg={12} key={index}>
                  <Card
                    size="small"
                    hoverable
                    onClick={action.action}
                    style={{ 
                      height: isMobile ? 80 : (isTablet ? 100 : 120),
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    bodyStyle={{
                      padding: isMobile ? '8px' : '12px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ 
                      fontSize: isMobile ? 20 : (isTablet ? 26 : 32), 
                      color: action.color, 
                      marginBottom: isMobile ? 4 : 8 
                    }}>
                      {action.icon}
                    </div>
                    <div>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: isMobile ? 11 : (isTablet ? 12 : 14)
                        }}
                      >
                        {action.title}
                      </Text>
                      {!isMobile && (
                        <>
                          <br />
                          <Text 
                            type="secondary" 
                            style={{ 
                              fontSize: isMobile ? 9 : (isTablet ? 10 : 12)
                            }}
                          >
                            {action.description}
                          </Text>
                        </>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Recent Songs - Responsive */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Text 
                strong 
                style={{ 
                  fontSize: isMobile ? 16 : 18 
                }}
              >
                Fazer upload de música
              </Text>
            }
            size={isMobile ? 'small' : 'default'}
            style={{ 
              height: isMobile ? 'auto' : (isTablet ? 350 : 400)
            }}
            extra={
              <Button 
                type="link" 
                size={isMobile ? 'small' : 'small'}
                onClick={() => router.push('/admin/songs')}
                style={{
                  fontSize: isMobile ? 12 : 14
                }}
              >
                Ver todas
              </Button>
            }
          >
            {stats.recentSongs.length === 0 ? (
              <Empty
                description={
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: isMobile ? 12 : 14 
                    }}
                  >
                    Nenhuma música encontrada
                  </Text>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                imageStyle={{
                  height: isMobile ? 40 : 60
                }}
              >
                <Button 
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={() => router.push('/admin/upload')}
                  size={isMobile ? 'small' : 'middle'}
                >
                  Fazer Upload
                </Button>
              </Empty>
            ) : (
              <List
                dataSource={stats.recentSongs}
                loading={loading}
                size={isMobile ? 'small' : 'default'}
                renderItem={(song) => (
                  <List.Item
                    style={{
                      padding: isMobile ? '8px 0' : '12px 0'
                    }}
                    actions={isMobile ? [
                      <Button
                        key="stats"
                        type="text"
                        size="small"
                        icon={<BarChartOutlined />}
                        onClick={() => router.push(`/admin/stats/${song.id}`)}
                        style={{ fontSize: 12 }}
                      />,
                      <Button
                        key="play"
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/player/${song.id}`, '_blank')}
                        style={{ fontSize: 12 }}
                      />
                    ] : [
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
                          icon={<SoundOutlined />} 
                          style={{ 
                            backgroundColor: '#8b5cf6',
                            width: isMobile ? 32 : 40,
                            height: isMobile ? 32 : 40
                          }}
                        />
                      }
                      title={
                        <Space 
                          size="small"
                          wrap={isMobile}
                          style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center'
                          }}
                        >
                          <Text 
                            strong 
                            style={{ 
                              fontSize: isMobile ? 13 : 14 
                            }}
                          >
                            {song.title}
                          </Text>
                          {song.transcription_data && (
                            <Tag 
                              color="blue" 
                              style={{
                                fontSize: isMobile ? 10 : 12,
                                marginTop: isMobile ? 2 : 0
                              }}
                            >
                              COM LETRA
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space 
                          split={<span>•</span>} 
                          size="small"
                          wrap={isMobile}
                          style={{
                            fontSize: isMobile ? 11 : 12
                          }}
                        >
                          {song.artist && (
                            <Text 
                              type="secondary"
                              style={{ fontSize: isMobile ? 11 : 12 }}
                            >
                              {song.artist}
                            </Text>
                          )}
                          <Text 
                            type="secondary"
                            style={{ fontSize: isMobile ? 11 : 12 }}
                          >
                            {song.listen_count || 0} plays
                          </Text>
                          {song.duration && (
                            <Text 
                              type="secondary"
                              style={{ fontSize: isMobile ? 11 : 12 }}
                            >
                              {formatDuration(song.duration)}
                            </Text>
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