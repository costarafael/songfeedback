'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Space, Tag, Progress, Timeline, message } from 'antd'
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
        const songResponse = await fetch(`/api/songs`)
        if (songResponse.ok) {
          const songs = await songResponse.json()
          // Garantir que songs seja um array antes de usar find
          const songsArray = Array.isArray(songs) ? songs : []
          const foundSong = songsArray.find((s: Song) => s.id === id)
          if (foundSong) {
            setSong(foundSong)
          } else {
            console.error('Música não encontrada:', id)
          }
        } else {
          const errorText = await songResponse.text()
          console.error('Erro ao carregar dados da música:', songResponse.status, errorText)
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
  }, [params])

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

  const reactionEmojis = {
    love: '❤️',
    like: '👍',
    dislike: '👎',
    angry: '😠'
  }

  const reactionLabels = {
    love: 'Amei',
    like: 'Gostei',
    dislike: 'Não gostei',
    angry: 'Descontente'
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

        {/* Reaction Breakdown */}
        {reactionStats.length > 0 && (
          <Card>
            <Title level={4}>Distribuição de Reações</Title>
            <Row gutter={[16, 16]}>
              {reactionStats.map((stat) => {
                const percentage = totalReactions > 0 ? (stat.count / totalReactions * 100).toFixed(1) : '0'
                
                return (
                  <Col xs={12} sm={6} key={stat.reaction_type}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>
                        {reactionEmojis[stat.reaction_type as keyof typeof reactionEmojis]}
                      </div>
                      <Statistic
                        title={reactionLabels[stat.reaction_type as keyof typeof reactionLabels]}
                        value={stat.count}
                        suffix={<span style={{ fontSize: 12 }}>({percentage}%)</span>}
                      />
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </Card>
        )}

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

        {/* Recent Reactions */}
        {reactions.length > 0 && (
          <Card>
            <Title level={4}>Reações Recentes</Title>
            <Timeline>
              {reactions.slice(-10).reverse().map((reaction) => (
                <Timeline.Item 
                  key={reaction.id}
                  dot={<span style={{ fontSize: 16 }}>{reactionEmojis[reaction.reaction_type]}</span>}
                >
                  <Space>
                    <Text strong>
                      {reactionLabels[reaction.reaction_type]}
                    </Text>
                    <Text type="secondary">
                      em {formatTime(reaction.timestamp)}
                    </Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
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