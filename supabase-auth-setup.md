# Configurações Necessárias no Supabase Auth

## 1. Authentication Settings (Dashboard > Authentication > Settings)

### Site URL
- Site URL: `https://songfeedback-d66h.vercel.app`
- Additional Redirect URLs: 
  - `https://songfeedback-d66h.vercel.app/admin`
  - `http://localhost:3000/admin` (para desenvolvimento)

### Email Auth
- ✅ Enable email confirmations: **DISABLE** (para facilitar login direto)
- ✅ Enable secure password change: ✅ Enable
- ✅ Enable signup: ✅ Enable (ou disable se quiser apenas admins específicos)

## 2. RLS (Row Level Security)
Por enquanto, vamos **DESABILITAR** RLS nas tabelas principais para evitar problemas:

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions DISABLE ROW LEVEL SECURITY;
```

## 3. Criar Usuário Admin
No SQL Editor do Supabase, execute:

```sql
-- Verificar se o usuário já existe
SELECT * FROM auth.users WHERE email = 'admin@feedbacksong.com';

-- Se não existir, criar manualmente via Dashboard:
-- Dashboard > Authentication > Users > Add User
-- Email: admin@feedbacksong.com  
-- Password: SuaSenahSegura123!
-- Confirm Password: SuaSenahSegura123!
-- Email Confirm: ✅ (marcar como confirmado)
```

## 4. Verificar Variáveis de Ambiente na Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 5. Domínios Permitidos
Adicionar em Authentication > Settings > Redirect URLs:
- `https://songfeedback-d66h.vercel.app/**`
- `http://localhost:3000/**`