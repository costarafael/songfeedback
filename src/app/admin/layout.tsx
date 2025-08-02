'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={ptBR}
        theme={{
          token: {
            colorPrimary: '#8b5cf6', // violet-500 to match existing theme
            colorInfo: '#8b5cf6',
            borderRadius: 8,
            fontFamily: 'var(--font-ibm-plex-mono), monospace',
          },
          components: {
            Layout: {
              bodyBg: '#f8fafc',
              siderBg: '#ffffff',
              headerBg: '#ffffff',
            },
            Menu: {
              itemSelectedBg: '#f3f4f6',
              itemSelectedColor: '#8b5cf6',
              itemHoverBg: '#f9fafb',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}