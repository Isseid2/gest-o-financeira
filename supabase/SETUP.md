# Setup do Supabase

Este projeto agora tem `dois frontends` usando o mesmo Supabase:

- `dashboard financeiro` na raiz do projeto
- `crm-app` como projeto separado, mas compartilhando autenticação e infraestrutura

O banco precisa receber `dois schemas SQL`:

- [schema.sql](C:/Users/Pablo%20Sena/Documents/New%20project/supabase/schema.sql) para o domínio financeiro
- [crm_schema.sql](C:/Users/Pablo%20Sena/Documents/New%20project/supabase/crm_schema.sql) para o domínio CRM

## 1. Criar o projeto

1. Abra [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique em `New project`
3. Escolha a organização
4. Dê um nome ao projeto
5. Crie a senha do banco
6. Aguarde a criação terminar

## 2. Rodar o SQL do financeiro

1. No painel do projeto, abra `SQL Editor`
2. Crie uma nova query
3. Cole todo o conteúdo de [schema.sql](C:/Users/Pablo%20Sena/Documents/New%20project/supabase/schema.sql)
4. Execute

Esse arquivo cria:

- `profiles`
- `clients`
- `client_year_data`
- triggers e políticas RLS do dashboard financeiro

## 3. Rodar o SQL do CRM

1. Ainda no `SQL Editor`, crie outra query
2. Cole todo o conteúdo de [crm_schema.sql](C:/Users/Pablo%20Sena/Documents/New%20project/supabase/crm_schema.sql)
3. Execute

Esse arquivo cria:

- `crm_organizations`
- `crm_organization_members`
- `crm_lead_stages`
- `crm_leads`
- `crm_lead_activities`
- `crm_projects`
- `crm_tasks`
- triggers e políticas RLS do CRM

## 4. Habilitar login por e-mail

1. Abra `Authentication`
2. Entre em `Providers`
3. Deixe `Email` habilitado
4. Se quiser evitar confirmação por e-mail no início, ajuste isso nas configurações de auth

## 5. Copiar as chaves

1. Abra `Project Settings`
2. Entre em `API`
3. Copie:
   - `Project URL`
   - `anon public key`

## 6. Configurar o dashboard financeiro

Crie um arquivo `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
VITE_AUTH_REDIRECT_URL=https://seu-site-publicado.com
```

## 7. Configurar URL de redirecionamento no Supabase

1. Abra `Authentication`
2. Entre em `URL Configuration`
3. Em `Redirect URLs`, adicione:
   - a URL publicada do dashboard financeiro
   - a URL publicada do CRM, se ele estiver hospedado separadamente
   - a URL local usada no desenvolvimento, se necessário

Exemplos:

```text
https://isseid2consult.lovable.app/
http://127.0.0.1:4218
http://127.0.0.1:8080
```

Sem essa etapa, login e recuperação de senha podem abrir em URLs erradas ou ser recusados.

## 8. Rodar o dashboard financeiro

Na raiz do projeto:

```powershell
npm install
npm run dev
```

## 9. Rodar o CRM separado

Na raiz do projeto:

```powershell
npx vite --config crm-app/vite.config.ts --host 127.0.0.1 --port 4218
```

O CRM usa a mesma `anon key` e a mesma `Project URL`, então não precisa de um `.env.local` separado se as variáveis já estiverem disponíveis no ambiente de build local.

## 10. Primeiro acesso ao financeiro

1. Abra o app financeiro
2. Crie sua conta
3. Se aparecer o aviso de dados locais, clique em `Importar dados locais`

## 11. Primeiro acesso ao CRM

1. Abra o CRM em `http://127.0.0.1:4218`
2. Entre com a mesma conta do Supabase
3. No primeiro login, o app cria automaticamente:
   - uma organização CRM
   - o vínculo do usuário como `owner`
   - as etapas iniciais do pipeline
4. Depois disso, você já pode:
   - criar leads
   - mover leads entre etapas
   - criar projetos
   - criar tarefas
   - editar e excluir registros

## 12. Checklist de validação

Se tudo estiver certo, você deve conseguir validar estes pontos:

### Financeiro

- login funcionando
- clientes carregando
- persistência remota funcionando

### CRM

- login com a mesma conta
- criação automática da organização no primeiro acesso
- etapas do pipeline aparecendo
- criação de lead funcionando
- avanço de lead funcionando
- criação, edição e exclusão de projetos funcionando
- criação, edição e exclusão de tarefas funcionando

## Observações

- Sem `.env.local`, o dashboard financeiro pode mostrar a tela de configuração do Supabase em vez do app
- Sem aplicar [crm_schema.sql](C:/Users/Pablo%20Sena/Documents/New%20project/supabase/crm_schema.sql), o CRM compila, mas não persiste dados reais
- O CRM foi desenhado para compartilhar a infraestrutura, não o domínio de dados do financeiro
