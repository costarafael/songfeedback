'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Space, Tag, Progress, Timeline, App } from 'antd'
import { 
  SoundOutlined, 
  EyeOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import AdminLayout from '@/components/Admin/AdminLayout'
import StatsCharts from '@/components/Admin/StatsCharts'
import ListeningHeatmap from '@/components/Admin/ListeningHeatmap'
import SkippedSegments from '@/components/Admin/SkippedSegments'
import { Reaction, Song, ReactionStats } from '@/lib/types'

const { Title, Text } = Typography

interface AnalyticsData {
  totalSessions: number
  avgCompletionRate: number
  totalSkips: number
  heatmap: any[]
  mostSkippedSegments: any[]
  reactions?: Reaction[]
}

async function fetchSongAnalytics(songId: string) {
  try {
    const response = await fetch(`/api/songs/${songId}/analytics`)
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
  }
  return null
}

function formatTime(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function processReactionStats(reactions: Reaction[]): ReactionStats[] {
  const statsMap = new Map<string, ReactionStats>()

  // Garantir que reactions seja um array válido
  const validReactions = Array.isArray(reactions) ? reactions : []
  
  validReactions.forEach(reaction => {
    if (!statsMap.has(reaction.reaction_type)) {
      statsMap.set(reaction.reaction_type, {
        reaction_type: reaction.reaction_type,
        count: 0,
        timestamps: []
      })
    }
    
    const stats = statsMap.get(reaction.reaction_type)!
    stats.count++
    stats.timestamps.push(reaction.timestamp)
  })

  return Array.from(statsMap.values())
}

export default function SongStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { message } = App.useApp()
  const [song, setSong] = useState<Song | null>(null)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { id } = await params
      
      try {
        setLoading(true)
        
        // Fetch song data
        const songResponse = await fetch(`/api/songs/${id}`)
        if (songResponse.ok) {
          const song = await songResponse.json()
          setSong(song)
        } else {
          const errorText = await songResponse.text()
          console.error('Erro ao carregar dados da música:', songResponse.status, errorText)
          if (songResponse.status === 404) {
            message.error('Música não encontrada')
          } else {
            message.error(`Erro ao carregar música: ${songResponse.status}`)
          }
        }

        // Fetch analytics
        const analyticsData = await fetchSongAnalytics(id)
        if (analyticsData) {
          setAnalytics(analyticsData)
          // Garantir que reactions seja sempre um array
          setReactions(Array.isArray(analyticsData.reactions) ? analyticsData.reactions : [])
        }

      } catch (error) {
        console.error('Error loading song data:', error)
        message.error(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <AdminLayout title="Carregando..." breadcrumbs={[{ title: 'Estatísticas' }, { title: 'Carregando...' }]}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Progress type="circle" />
        </div>
      </AdminLayout>
    )
  }

  if (!song) {
    return (
      <AdminLayout title="Música não encontrada" breadcrumbs={[{ title: 'Estatísticas' }, { title: 'Erro' }]}>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
            <Title level={3}>Música não encontrada</Title>
          </div>
        </Card>
      </AdminLayout>
    )
  }

  const reactionStats = processReactionStats(reactions)
  const totalReactions = reactions.length

  const reactionConfig = {
    love: {
      icon: '❤️',
      label: 'Amei',
      color: '#ff4d4f'
    },
    like: {
      icon: '👍',
      label: 'Gostei', 
      color: '#52c41a'
    },
    dislike: {
      icon: '👎',
      label: 'Não gostei',
      color: '#faad14'
    },
    angry: {
      icon: '😠',
      label: 'Descontente',
      color: '#8c8c8c'
    }
  }

  return (
    <AdminLayout 
      title={`Estatísticas: ${song.title}`}
      breadcrumbs={[
        { title: 'Estatísticas', href: '/admin/stats' }, 
        { title: song.title }
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Song Info */}
        <Card>
          <Space direction="vertical" size="small">
            <Title level={2} style={{ margin: 0 }}>
              <SoundOutlined /> {song.title}
            </Title>
            {song.artist && (
              <Text type="secondary" style={{ fontSize: 16 }}>
                por {song.artist}
              </Text>
            )}
            {song.duration && (
              <Tag icon={<ClockCircleOutlined />} color="blue">
                Duração: {formatTime(song.duration)}
              </Tag>
            )}
          </Space>
        </Card>

        {/* Summary Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Reproduções"
                value={song.listen_count || 0}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total de Reações"
                value={totalReactions}
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          {analytics && (
            <>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Sessões de Escuta"
                    value={analytics.totalSessions}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Taxa de Conclusão"
                    value={analytics.avgCompletionRate}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Card>
              </Col>
            </>
          )}
        </Row>


        {/* Listening Heatmap */}
        {analytics && analytics.heatmap && (
          <Card>
            <Title level={4}>Mapa de Escuta</Title>
            <ListeningHeatmap 
              heatmap={analytics.heatmap}
              duration={song.duration || 0}
            />
          </Card>
        )}

        {/* Skipped Segments */}
        {analytics && analytics.mostSkippedSegments && analytics.mostSkippedSegments.length > 0 && (
          <Card>
            <Title level={4}>Segmentos Mais Pulados</Title>
            <SkippedSegments 
              segments={analytics.mostSkippedSegments}
            />
          </Card>
        )}

        {/* Timeline Visualization */}
        {reactions.length > 0 && (
          <Card>
            <Title level={4}>Timeline de Reações</Title>
            <StatsCharts 
              reactions={reactions} 
              duration={song.duration || 0}
              reactionStats={reactionStats}
            />
          </Card>
        )}


        {/* No Data Message */}
        {totalReactions === 0 && (!analytics || analytics.totalSessions === 0) && (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <Title level={3}>Nenhum dado disponível</Title>
              <Text type="secondary">
                Esta música ainda não recebeu reações ou reproduções.
              </Text>
            </div>
          </Card>
        )}
      </Space>
    </AdminLayout>
  )
}