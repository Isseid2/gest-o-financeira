# Setup do Supabase

## 1. Criar o projeto

1. Abra `https://supabase.com/dashboard`
2. Clique em `New project`
3. Escolha a organizacao
4. Dê um nome ao projeto
5. Crie a senha do banco
6. Aguarde a criacao terminar

## 2. Rodar o SQL

1. No painel do projeto, abra `SQL Editor`
2. Crie uma nova query
3. Cole todo o conteudo de `supabase/schema.sql`
4. Execute

## 3. Habilitar login por e-mail

1. Abra `Authentication`
2. Entre em `Providers`
3. Deixe `Email` habilitado
4. Se quiser evitar confirmacao por e-mail no inicio, ajuste isso nas configuracoes de auth

## 4. Copiar as chaves

1. Abra `Project Settings`
2. Entre em `API`
3. Copie:
   - `Project URL`
   - `anon public key`

## 5. Configurar o app

Crie um arquivo `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

## 6. Rodar o app

```powershell
npm install
npm run dev
```

## 7. Primeiro acesso

1. Abra o app
2. Crie sua conta
3. Se aparecer o aviso de dados locais, clique em `Importar dados locais`

## Observacao

Sem `.env.local`, o app vai mostrar a tela de configuracao do Supabase em vez do dashboard.
