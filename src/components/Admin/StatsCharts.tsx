'use client'

import { Card, Typography, Row, Col, Progress, Tooltip, Space, Tag } from 'antd'
import { 
  HeartFilled, 
  LikeFilled, 
  DislikeFilled, 
  FrownFilled,
  ClockCircleOutlined,
  BarChartOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { Reaction, ReactionStats } from '@/lib/types'

const { Title, Text } = Typography

interface StatsChartsProps {
  reactions: Reaction[]
  duration: number
  reactionStats: ReactionStats[]
}

export default function StatsCharts({ reactions, duration, reactionStats }: StatsChartsProps) {
  // Calculate intelligent duration
  const maxReactionTime = reactions.length > 0 ? Math.max(...reactions.map(r => r.timestamp)) : 0
  
  // Use the larger of: saved duration OR max reaction time + 30s buffer
  // This ensures we show the full timeline even if reactions happened near the end
  const safeDuration = Math.max(
    duration || 0,
    maxReactionTime + 30, // Add 30 seconds buffer after last reaction
    60 // Minimum 1 minute
  )

  // Create timeline visualization
  const timelineSegments = 50 // Divide song into 50 segments
  const segmentDuration = safeDuration / timelineSegments
  
  // Count reactions per segment
  const segmentCounts = new Array(timelineSegments).fill(0).map(() => ({
    love: 0,
    like: 0,
    dislike: 0,
    angry: 0,
    total: 0
  }))

  reactions.forEach((reaction) => {
    const segmentIndex = Math.min(
      Math.floor(reaction.timestamp / segmentDuration),
      timelineSegments - 1
    )
    
    if (segmentIndex >= 0 && segmentIndex < timelineSegments) {
      segmentCounts[segmentIndex][reaction.reaction_type]++
      segmentCounts[segmentIndex].total++
    }
  })

  const maxCount = Math.max(...segmentCounts.map(s => s.total))
  
  const reactionConfig = {
    love: {
      color: '#ff4d4f',
      icon: HeartFilled,
      label: 'Amei'
    },
    like: {
      color: '#52c41a', 
      icon: LikeFilled,
      label: 'Gostei'
    },
    dislike: {
      color: '#faad14',
      icon: DislikeFilled, 
      label: 'Não gostei'
    },
    angry: {
      color: '#8c8c8c',
      icon: FrownFilled,
      label: 'Descontente'
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Debug Info */}
      <Card size="small" title={
        <Space>
          <BarChartOutlined />
          <Text strong>Análise da Timeline</Text>
        </Space>
      }>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Tag icon={<ClockCircleOutlined />} color="blue">
              Duração: {duration ? `${duration}s` : 'Não definida'}
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tag icon={<ThunderboltOutlined />} color="volcano">
              Última reação: {maxReactionTime.toFixed(1)}s
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tag color="green">
              Duração calculada: {safeDuration}s
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tag color="purple">
              Total reações: {reactions.length}
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tag color="cyan">
              Segmentos ativos: {segmentCounts.filter(s => s.total > 0).length}/{timelineSegments}
            </Tag>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tag color="orange">
              Resolução: {segmentDuration.toFixed(1)}s/segmento
            </Tag>
          </Col>
        </Row>
        {reactions.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              <strong>Range de reações:</strong> {' '}
              {Math.min(...reactions.map(r => r.timestamp)).toFixed(1)}s - {' '}
              {Math.max(...reactions.map(r => r.timestamp)).toFixed(1)}s
            </Text>
          </div>
        )}
      </Card>

      {/* Timeline Heatmap */}
      <Card title={
        <Space>
          <BarChartOutlined />
          <Text strong>Intensidade de Reações ao Longo do Tempo</Text>
        </Space>
      }>
        <div style={{ padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
            {segmentCounts.map((segment, index) => {
              const height = maxCount > 0 ? (segment.total / maxCount) * 100 : 0
              const timeInSong = (index * segmentDuration)
              const timeLabel = `${Math.floor(timeInSong / 60)}:${Math.floor(timeInSong % 60).toString().padStart(2, '0')}`
              
              const tooltipContent = (
                <div>
                  <div><strong>{timeLabel}</strong></div>
                  <div>{segment.total} reações</div>
                  {segment.love > 0 && (
                    <div style={{ color: reactionConfig.love.color }}>
                      <HeartFilled /> {segment.love}
                    </div>
                  )}
                  {segment.like > 0 && (
                    <div style={{ color: reactionConfig.like.color }}>
                      <LikeFilled /> {segment.like}
                    </div>
                  )}
                  {segment.dislike > 0 && (
                    <div style={{ color: reactionConfig.dislike.color }}>
                      <DislikeFilled /> {segment.dislike}
                    </div>
                  )}
                  {segment.angry > 0 && (
                    <div style={{ color: reactionConfig.angry.color }}>
                      <FrownFilled /> {segment.angry}
                    </div>
                  )}
                </div>
              )
              
              return (
                <Tooltip key={index} title={tooltipContent} placement="top">
                  <div
                    style={{
                      flex: 1,
                      height: `${height}%`,
                      minHeight: 4,
                      backgroundColor: '#1890ff',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      opacity: segment.total > 0 ? 1 : 0.3
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#40a9ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1890ff'
                    }}
                  />
                </Tooltip>
              )
            })}
          </div>
          
          {/* Time labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>0:00</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {Math.floor(safeDuration / 60)}:{(Math.floor(safeDuration % 60)).toString().padStart(2, '0')}
            </Text>
          </div>
        </div>
        
        {/* Legend - moved here to be attached to the main chart */}
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 6 }}>
          <Title level={5} style={{ margin: '0 0 8px 0' }}>Como interpretar este gráfico</Title>
          <Space direction="vertical" size="small">
            <Text style={{ fontSize: 12 }}>• A altura das barras representa a quantidade total de reações naquele momento</Text>
            <Text style={{ fontSize: 12 }}>• Passe o mouse sobre as barras para ver detalhes específicos de tempo e contagem</Text>
            <Text style={{ fontSize: 12 }}>• Barras mais opacas indicam maior concentração de reações</Text>
          </Space>
        </div>
      </Card>

      {/* Reaction Distribution by Time */}
      <Card title={
        <Space>
          <HeartFilled style={{ color: '#ff4d4f' }} />
          <Text strong>Distribuição por Tipo de Reação</Text>
        </Space>
      }>
        <Row gutter={[0, 16]}>
          {reactionStats.map((stat) => {
            const config = reactionConfig[stat.reaction_type]
            const IconComponent = config.icon
            const percentage = reactions.length > 0 ? ((stat.count / reactions.length) * 100).toFixed(1) : '0'
            
            return (
              <Col xs={24} key={stat.reaction_type}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <div style={{ marginBottom: 12 }}>
                    <Space>
                      <IconComponent style={{ color: config.color, fontSize: 20 }} />
                      <Text strong>{config.label}</Text>
                      <Tag color={config.color.includes('#ff') ? 'red' : config.color.includes('#52') ? 'green' : config.color.includes('#fa') ? 'orange' : 'default'}>
                        {stat.count} reações ({percentage}%)
                      </Tag>
                    </Space>
                  </div>
                  
                  {/* Timeline for this reaction type */}
                  <div style={{ display: 'flex', gap: 1, height: 32, alignItems: 'flex-end' }}>
                    {segmentCounts.map((segment, index) => {
                      const count = segment[stat.reaction_type]
                      const opacity = count > 0 ? Math.min(count / 3, 1) : 0.1 // Max opacity at 3+ reactions
                      const timeInSong = index * segmentDuration
                      const timeLabel = `${Math.floor(timeInSong / 60)}:${Math.floor(timeInSong % 60).toString().padStart(2, '0')}`
                      
                      return (
                        <Tooltip 
                          key={index}
                          title={count > 0 ? `${timeLabel} - ${count} reação(ões)` : `${timeLabel} - sem reações`}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: '100%',
                              backgroundColor: config.color,
                              opacity: opacity,
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                          />
                        </Tooltip>
                      )
                    })}
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

    </Space>
  )
}