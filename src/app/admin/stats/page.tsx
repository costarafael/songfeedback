'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Typography, Space, Tag, Button, App } from 'antd'
import { 
  SoundOutlined, 
  UnorderedListOutlined, 
  EyeOutlined,
  HeartOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/Admin/AdminLayout'

const { Title, Text } = Typography

interface SongStats {
  id: string
  title: string
  artist?: string
  total_listens: number
  total_reactions: number
  avg_completion_rate: number
  created_at: string
  transcription_data?: any
}

interface OverallStats {
  total_songs: number
  total_playlists: number
  total_listens: number
  total_reactions: number
}

export default function StatsOverviewPage() {
  const { message } = App.useApp()
  const [overallStats, setOverallStats] = useState<OverallStats>({
    total_songs: 0,
    total_playlists: 0,
    total_listens: 0,
    total_reactions: 0
  })
  const [topSongs, setTopSongs] = useState<SongStats[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch songs count
      const songsResponse = await fetch('/api/songs')
      const songsData = songsResponse.ok ? await songsResponse.json() : []
      const songs = Array.isArray(songsData) ? songsData : []
      
      // Fetch playlists count
      const playlistsResponse = await fetch('/api/playlists')
      const playlistsData = playlistsResponse.ok ? await playlistsResponse.json() : []
      const playlists = Array.isArray(playlistsData) ? playlistsData : []

      // Calculate stats from songs data
      let totalListens = 0
      let totalReactions = 0
      const songsWithStats: SongStats[] = []

      for (const song of songs) {
        try {
          const analyticsResponse = await fetch(`/api/songs/${song.id}/analytics`)
          if (analyticsResponse.ok) {
            const analytics = await analyticsResponse.json()
            const songStats: SongStats = {
              id: song.id,
              title: song.title,
              artist: song.artist,
              total_listens: analytics.totalListens || 0,
              total_reactions: analytics.totalReactions || 0,
              avg_completion_rate: analytics.avgCompletionRate || 0,
              created_at: song.created_at,
              transcription_data: song.transcription_data
            }
            songsWithStats.push(songStats)
            totalListens += songStats.total_listens
            totalReactions += songStats.total_reactions
          }
        } catch (error) {
          // If analytics fail, include song with zero stats
          songsWithStats.push({
            id: song.id,
            title: song.title,
            artist: song.artist,
            total_listens: 0,
            total_reactions: 0,
            avg_completion_rate: 0,
            created_at: song.created_at,
            transcription_data: song.transcription_data
          })
        }
      }

      setOverallStats({
        total_songs: songs.length,
        total_playlists: playlists.length,
        total_listens: totalListens,
        total_reactions: totalReactions
      })

      // Sort by total listens and get top 10
      const sortedSongs = songsWithStats
        .sort((a, b) => b.total_listens - a.total_listens)
        .slice(0, 10)
      
      setTopSongs(sortedSongs)

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      message.error(`Erro ao carregar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Text strong style={{ fontSize: 16 }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: 'Música',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: SongStats) => (
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
      title: 'Reproduções',
      dataIndex: 'total_listens',
      key: 'total_listens',
      render: (value: number) => (
        <Statistic 
          value={value} 
          valueStyle={{ fontSize: 14 }}
          prefix={<EyeOutlined />}
        />
      ),
      sorter: (a: SongStats, b: SongStats) => a.total_listens - b.total_listens,
      width: 140,
    },
    {
      title: 'Reações',
      dataIndex: 'total_reactions',
      key: 'total_reactions',
      render: (value: number) => (
        <Statistic 
          value={value} 
          valueStyle={{ fontSize: 14 }}
          prefix={<HeartOutlined />}
        />
      ),
      sorter: (a: SongStats, b: SongStats) => a.total_reactions - b.total_reactions,
      width: 120,
    },
    {
      title: 'Taxa de Conclusão',
      dataIndex: 'avg_completion_rate',
      key: 'avg_completion_rate',
      render: (value: number) => (
        <Text>{Math.round(value)}%</Text>
      ),
      sorter: (a: SongStats, b: SongStats) => a.avg_completion_rate - b.avg_completion_rate,
      width: 140,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (_: any, record: SongStats) => (
        <Button
          type="text"
          icon={<BarChartOutlined />}
          onClick={() => router.push(`/admin/stats/${record.id}`)}
          size="small"
        >
          Detalhes
        </Button>
      ),
    },
  ]

  return (
    <AdminLayout 
      title="Estatísticas Gerais"
      breadcrumbs={[{ title: 'Estatísticas' }]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Overall Stats Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total de Músicas"
                value={overallStats.total_songs}
                prefix={<SoundOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total de Playlists"
                value={overallStats.total_playlists}
                prefix={<UnorderedListOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total de Reproduções"
                value={overallStats.total_listens}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total de Reações"
                value={overallStats.total_reactions}
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Top Songs Table */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>
              <BarChartOutlined /> Top 10 Músicas Mais Ouvidas
            </Title>
          </div>
          
          <Table
            dataSource={topSongs}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
          />
        </Card>
      </Space>
    </AdminLayout>
  )
}