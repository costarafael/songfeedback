'use client'

import React, { useState } from 'react'
import { Layout, Menu, Button, Typography, Breadcrumb, Avatar } from 'antd'
import {
  DashboardOutlined,
  SoundOutlined,
  UnorderedListOutlined,
  CloudUploadOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const { Header, Sider, Content } = Layout
const { Title } = Typography

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ title: string; href?: string }>
}

export default function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => router.push('/admin'),
    },
    {
      key: '/admin/songs',
      icon: <SoundOutlined />,
      label: 'Músicas',
      onClick: () => router.push('/admin/songs'),
    },
    {
      key: '/admin/playlists',
      icon: <UnorderedListOutlined />,
      label: 'Playlists',
      onClick: () => router.push('/admin/playlists'),
    },
    {
      key: '/admin/upload',
      icon: <CloudUploadOutlined />,
      label: 'Upload',
      onClick: () => router.push('/admin/upload'),
    },
    {
      key: 'stats',
      icon: <BarChartOutlined />,
      label: 'Estatísticas',
      children: [
        {
          key: '/admin/stats',
          label: 'Visão Geral',
          onClick: () => router.push('/admin/stats'),
        },
      ],
    },
  ]

  const getSelectedKeys = () => {
    if (pathname.startsWith('/admin/stats/')) {
      return ['/admin/stats']
    }
    return [pathname]
  }

  const getOpenKeys = () => {
    if (pathname.startsWith('/admin/stats')) {
      return ['stats']
    }
    return []
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          {collapsed ? (
            <SoundOutlined style={{ fontSize: 24, color: '#8b5cf6' }} />
          ) : (
            <Title level={4} style={{ margin: 0, color: '#8b5cf6' }}>
              Feedback Song
            </Title>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          style={{ borderRight: 0, height: 'calc(100vh - 64px)', overflowY: 'auto' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb 
                style={{ margin: 0 }}
                items={[
                  {
                    title: <Link href="/admin">Admin</Link>
                  },
                  ...breadcrumbs.map((crumb) => ({
                    title: crumb.href ? (
                      <Link href={crumb.href}>{crumb.title}</Link>
                    ) : (
                      crumb.title
                    )
                  }))
                ]}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar icon={<UserOutlined />} />
            <span>Admin</span>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {title && (
            <div style={{ marginBottom: 24 }}>
              <Title level={2} style={{ margin: 0 }}>
                {title}
              </Title>
            </div>
          )}
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}