'use client'

import React from 'react'
import { Card, Typography, Space, Tag, Empty } from 'antd'
import { FileTextOutlined, SoundOutlined } from '@ant-design/icons'
import { ElevenLabsTranscription, ElevenLabsWord } from '@/lib/types'

const { Title, Text, Paragraph } = Typography

interface LyricsDisplayProps {
  transcriptionData?: ElevenLabsTranscription
  isMobile?: boolean
  songTitle?: string
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default function LyricsDisplay({ 
  transcriptionData, 
  isMobile = false,
  songTitle 
}: LyricsDisplayProps) {
  if (!transcriptionData || !transcriptionData.text) {
    return (
      <Card size={isMobile ? 'small' : 'default'}>
        <div style={{ textAlign: 'center', padding: isMobile ? '20px 10px' : '30px' }}>
          <Empty
            image={<SoundOutlined style={{ fontSize: isMobile ? 32 : 48, color: '#d9d9d9' }} />}
            description={
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                Esta música não possui letra transcrita
              </Text>
            }
          />
        </div>
      </Card>
    )
  }

  return (
    <Card 
      size={isMobile ? 'small' : 'default'}
      title={
        <Space>
          <FileTextOutlined />
          <span style={{ fontSize: isMobile ? 16 : 18 }}>
            Letra Completa
          </span>
        </Space>
      }
      extra={
        <Space wrap>
          <Tag color="blue" style={{ fontSize: isMobile ? 11 : 12 }}>
            {transcriptionData.language_code?.toUpperCase() || 'PT'}
          </Tag>
          {transcriptionData.language_probability && (
            <Tag color="green" style={{ fontSize: isMobile ? 11 : 12 }}>
              {Math.round(transcriptionData.language_probability * 100)}% confiança
            </Tag>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Texto completo da letra */}
        <div>
          <Title level={isMobile ? 5 : 4} style={{ marginBottom: 8 }}>
            Transcrição Completa
          </Title>
          <div style={{
            backgroundColor: '#fafafa',
            padding: isMobile ? '12px' : '16px',
            borderRadius: '6px',
            border: '1px solid #f0f0f0',
            maxHeight: isMobile ? '300px' : '400px',
            overflowY: 'auto'
          }}>
            <Paragraph 
              style={{ 
                fontSize: isMobile ? 14 : 16,
                lineHeight: isMobile ? 1.5 : 1.6,
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {transcriptionData.text}
            </Paragraph>
          </div>
        </div>

        {/* Timeline de palavras (se disponível) */}
        {transcriptionData.words && transcriptionData.words.length > 0 && (
          <div>
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: 8 }}>
              Timeline de Palavras
            </Title>
            <div style={{
              backgroundColor: '#f6f8ff',
              padding: isMobile ? '12px' : '16px',
              borderRadius: '6px',
              border: '1px solid #e6f0ff',
              maxHeight: isMobile ? '200px' : '250px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {transcriptionData.words.map((word: ElevenLabsWord, index: number) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      backgroundColor: word.type === 'word' ? '#e6f7ff' : 'transparent',
                      borderRadius: '3px',
                      fontSize: isMobile ? 12 : 13,
                      color: word.type === 'word' ? '#1890ff' : '#666',
                      cursor: 'default',
                      border: word.type === 'word' ? '1px solid #91d5ff' : 'none'
                    }}
                    title={word.type === 'word' ? 
                      `${formatTimestamp(word.start)} - ${formatTimestamp(word.end)}` : 
                      undefined
                    }
                  >
                    {word.text}
                  </span>
                ))}
              </div>
            </div>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: isMobile ? 11 : 12,
                display: 'block',
                marginTop: 8
              }}
            >
              💡 Passe o mouse sobre as palavras para ver o timestamp
            </Text>
          </div>
        )}

        {/* Informações técnicas */}
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: isMobile ? '8px 12px' : '12px 16px',
          borderRadius: '6px',
          border: '1px solid #e8e8e8'
        }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: isMobile ? 12 : 13 }}>
              Informações da Transcrição:
            </Text>
            <Space wrap size="small">
              <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                Idioma: {transcriptionData.language_code?.toUpperCase() || 'N/A'}
              </Text>
              {transcriptionData.language_probability && (
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                  • Confiança: {Math.round(transcriptionData.language_probability * 100)}%
                </Text>
              )}
              {transcriptionData.words && (
                <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                  • Palavras: {transcriptionData.words.length}
                </Text>
              )}
            </Space>
          </Space>
        </div>
      </Space>
    </Card>
  )
}