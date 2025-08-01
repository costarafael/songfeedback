'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runSetup = async () => {
    setLoading(true)
    setStatus('Configurando Supabase...')

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        setStatus('✅ Setup concluído com sucesso!')
      } else {
        setStatus(`❌ Erro no setup: ${result.error}`)
        console.error('Setup failed:', result.details)
      }
    } catch (error) {
      setStatus(`❌ Erro de conexão: ${error}`)
      console.error('Setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Setup Supabase
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            Configure automaticamente o banco de dados e storage do Supabase.
          </p>
          
          <button
            onClick={runSetup}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Configurando...' : 'Executar Setup'}
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-lg text-center ${
            status.includes('✅') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">O que será criado:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Tabela <code>songs</code></li>
            <li>Tabela <code>reactions</code></li>
            <li>Tabela <code>listening_sessions</code></li>
            <li>Bucket de storage <code>songs</code></li>
            <li>Índices para performance</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}