'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-auth'
import { Button, Form, Input, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

const { Title } = Typography

export default function AdminLogin() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/admin')
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    console.log('🔐 Tentando login com:', values.email)
    
    // Debug environment variables
    console.log('🔧 Debug - Environment check:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('- Client created successfully:', !!supabase)
    
    try {
      // Test via API first
      console.log('🧪 Testando via API primeiro...')
      const apiResponse = await fetch('/api/debug-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const apiResult = await apiResponse.json()
      console.log('📡 API result:', apiResult)
      
      // Now test via client
      console.log('🔐 Testando via cliente browser...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      console.log('🔐 Resposta do login:', { data, error })

      if (error) {
        console.error('❌ Erro no login:', error)
        message.error('Erro no login: ' + error.message)
      } else if (data.user) {
        console.log('✅ Login bem-sucedido:', data.user.id)
        message.success('Login realizado com sucesso!')
        router.push('/admin')
      } else {
        console.warn('⚠️ Login sem erro mas sem usuário')
        message.error('Login falhou - usuário não encontrado')
      }
    } catch (error) {
      console.error('💥 Erro inesperado:', error)
      message.error('Erro inesperado durante o login: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Admin Login
          </Title>
          <p style={{ color: '#666', marginTop: 8 }}>
            Acesse o painel administrativo
          </p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Por favor, insira seu email!' },
              { type: 'email', message: 'Email inválido!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Por favor, insira sua senha!' },
              { min: 6, message: 'Senha deve ter pelo menos 6 caracteres!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Senha"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}