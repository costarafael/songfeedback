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
import LyricsDisplay from '@/components/Admin/LyricsDisplay'
import { Reaction, Song, ReactionStats } from '@/lib/types'
import { useResponsive } from '@/hooks/useResponsive'

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
  const { isMobile, isTablet } = useResponsive()
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
        <Card size={isMobile ? 'small' : 'default'}>
          <Space direction="vertical" size="small">
            <Title level={isMobile ? 3 : 2} style={{ 
              margin: 0,
              fontSize: isMobile ? 18 : undefined,
              wordBreak: 'break-word'
            }}>
              <SoundOutlined /> {song.title}
            </Title>
            {song.artist && (
              <Text type="secondary" style={{ 
                fontSize: isMobile ? 14 : 16,
                wordBreak: 'break-word'
              }}>
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
            <Card size={isMobile ? 'small' : 'default'}>
              <Statistic
                title={isMobile ? 'Reproduções' : 'Reproduções'}
                value={song.listen_count || 0}
                prefix={<EyeOutlined />}
                valueStyle={{ 
                  color: '#1890ff',
                  fontSize: isMobile ? 18 : 24
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size={isMobile ? 'small' : 'default'}>
              <Statistic
                title={isMobile ? 'Reações' : 'Total de Reações'}
                value={totalReactions}
                prefix={<HeartOutlined />}
                valueStyle={{ 
                  color: '#722ed1',
                  fontSize: isMobile ? 18 : 24
                }}
              />
            </Card>
          </Col>
          {analytics && (
            <>
              <Col xs={24} sm={12} md={6}>
                <Card size={isMobile ? 'small' : 'default'}>
                  <Statistic
                    title={isMobile ? 'Sessões' : 'Sessões de Escuta'}
                    value={analytics.totalSessions}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ 
                      color: '#52c41a',
                      fontSize: isMobile ? 18 : 24
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size={isMobile ? 'small' : 'default'}>
                  <Statistic
                    title={isMobile ? 'Conclusão' : 'Taxa de Conclusão'}
                    value={analytics.avgCompletionRate}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ 
                      color: '#13c2c2',
                      fontSize: isMobile ? 18 : 24
                    }}
                  />
                </Card>
              </Col>
            </>
          )}
        </Row>


        {/* Listening Heatmap */}
        {analytics && analytics.heatmap && (
          <Card size={isMobile ? 'small' : 'default'}>
            <Title level={isMobile ? 5 : 4}>Mapa de Escuta</Title>
            <div style={{ 
              overflowX: isMobile ? 'auto' : 'hidden',
              padding: isMobile ? '8px 0' : '0'
            }}>
              <ListeningHeatmap 
                heatmap={analytics.heatmap}
                duration={song.duration || 0}
              />
            </div>
          </Card>
        )}

        {/* Skipped Segments */}
        {analytics && analytics.mostSkippedSegments && analytics.mostSkippedSegments.length > 0 && (
          <Card size={isMobile ? 'small' : 'default'}>
            <Title level={isMobile ? 5 : 4}>
              {isMobile ? 'Segmentos Pulados' : 'Segmentos Mais Pulados'}
            </Title>
            <div style={{ 
              overflowX: isMobile ? 'auto' : 'hidden'
            }}>
              <SkippedSegments 
                segments={analytics.mostSkippedSegments}
              />
            </div>
          </Card>
        )}

        {/* Lyrics Display */}
        <LyricsDisplay 
          transcriptionData={song.transcription_data}
          isMobile={isMobile}
          songTitle={song.title}
        />

        {/* Timeline Visualization */}
        {reactions.length > 0 && (
          <Card size={isMobile ? 'small' : 'default'}>
            <Title level={isMobile ? 5 : 4}>
              {isMobile ? 'Timeline' : 'Timeline de Reações'}
            </Title>
            <div style={{ 
              overflowX: isMobile ? 'auto' : 'hidden',
              padding: isMobile ? '8px 0' : '0'
            }}>
              <StatsCharts 
                reactions={reactions} 
                duration={song.duration || 0}
                reactionStats={reactionStats}
              />
            </div>
          </Card>
        )}


        {/* No Data Message */}
        {totalReactions === 0 && (!analytics || analytics.totalSessions === 0) && (
          <Card size={isMobile ? 'small' : 'default'}>
            <div style={{ 
              textAlign: 'center', 
              padding: isMobile ? '30px 20px' : '50px'
            }}>
              <ExclamationCircleOutlined style={{ 
                fontSize: isMobile ? 36 : 48, 
                color: '#faad14' 
              }} />
              <Title level={isMobile ? 4 : 3}>
                {isMobile ? 'Sem dados' : 'Nenhum dado disponível'}
              </Title>
              <Text type="secondary" style={{ 
                fontSize: isMobile ? 14 : 16,
                display: 'block',
                maxWidth: isMobile ? '100%' : '400px',
                margin: '0 auto'
              }}>
                Esta música ainda não recebeu reações ou reproduções.
              </Text>
            </div>
          </Card>
        )}
      </Space>
    </AdminLayout>
  )
}