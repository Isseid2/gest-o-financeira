# Design: Supabase Multiusuario para Gestao Financeira

## Objetivo

Substituir a persistencia atual baseada em `localStorage` por uma persistencia remota com `Supabase Auth + Postgres + RLS`, permitindo:

- login por usuario
- isolamento total dos dados de cada conta
- acesso aos mesmos clientes em dispositivos diferentes
- evolucao futura para recursos de backup, auditoria e operacao multiusuario

O objetivo desta fase nao e reescrever o dashboard. A prioridade e manter as telas atuais e trocar a camada de persistencia com o minimo de ruptura.

## Estado Atual

Hoje o app concentra todo o estado em [FinancialContext.tsx](/C:/Users/Pablo%20Sena/Documents/New%20project/src/context/FinancialContext.tsx).

Caracteristicas atuais:

- o estado inteiro fica em memoria no React
- a persistencia oficial e `localStorage`
- os dados sao estruturados como `clientes -> anos -> orcMes/realMes`
- nao existe autenticacao
- nao existe backend

Essa estrutura e boa para a migracao porque o modelo de dados atual ja separa claramente:

- cliente
- configuracoes do cliente
- dados por ano
- orcamento mensal e realizado mensal

## Requisitos

### Funcionais

- usuario deve criar conta e entrar com email/senha
- cada usuario deve visualizar apenas os proprios clientes
- um cliente novo deve continuar nascendo zerado para o ano ativo
- importacoes e edicoes devem continuar funcionando nas telas atuais
- o app deve carregar os clientes do banco apos login
- o app deve salvar alteracoes no banco

### Nao funcionais

- seguranca de acesso garantida no banco, nao apenas no frontend
- baixo impacto sobre o layout existente
- migracao incremental, sem interromper o app atual
- suporte a futura extensao para compartilhamento, sem precisar redesenhar tudo

## Abordagens Consideradas

### 1. Supabase Auth + Postgres + RLS

Vantagens:

- encaixa bem com React
- Postgres e adequado para dados financeiros estruturados
- RLS resolve o isolamento por usuario no proprio banco
- reduz a necessidade de um backend customizado agora

Desvantagens:

- exige schema SQL e politicas de seguranca bem definidas
- adiciona fluxo assincorno de carregamento no contexto atual

### 2. Firebase Auth + Firestore

Vantagens:

- setup rapido
- autenticacao simples

Desvantagens:

- menos natural para consultas e consolidacoes futuras
- estrutura documental nao conversa tao bem com os dados tabulares do app

### 3. Backend proprio + PostgreSQL

Vantagens:

- maximo controle
- bom para regras mais complexas

Desvantagens:

- custo de implementacao maior
- excesso de estrutura para a necessidade atual

## Recomendacao

Usar `Supabase Auth + Postgres + RLS`.

Essa opcao entrega autenticacao e banco agora, preserva o modelo atual do app e evita criar uma API propria antes de ela ser realmente necessaria.

## Arquitetura Proposta

### Camadas

1. `Supabase Auth`
- responsavel por cadastro, login, logout e sessao

2. `Postgres`
- armazenamento persistente de clientes e dados anuais

3. `RLS`
- garante que cada usuario leia e escreva apenas os dados que pertencem ao seu `user_id`

4. `Camada de acesso`
- novo modulo em `src/lib/supabase/*`
- centraliza leitura, escrita e transformacao de dados

5. `FinancialContext`
- deixa de usar `localStorage` como fonte principal
- passa a consumir a camada de acesso
- continua oferecendo a mesma interface para as tabs, reduzindo o impacto nas telas

## Modelo de Dados

### Tabela `profiles`

Guarda dados basicos do usuario autenticado.

Campos:

- `id uuid primary key references auth.users(id)`
- `email text not null`
- `created_at timestamptz default now()`

### Tabela `clients`

Representa um cliente pertencente a um usuario.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `nome text not null default ''`
- `segmento text not null default ''`
- `moeda text not null default 'R$'`
- `premissas jsonb not null`
- `cenarios jsonb not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### Tabela `client_year_data`

Armazena o estado anual do cliente.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `client_id uuid not null references clients(id) on delete cascade`
- `user_id uuid not null references auth.users(id)`
- `year text not null`
- `orc_mes jsonb not null default '{}'::jsonb`
- `real_mes jsonb not null default '{}'::jsonb`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Restricao:

- `unique (client_id, year)`

### Motivo para manter `jsonb` em `orc_mes` e `real_mes`

- reduz o numero de tabelas nesta primeira fase
- combina com o formato atual do contexto
- simplifica a migracao do `localStorage`
- permite evoluir depois para uma granularidade maior se necessario

## Regras de Seguranca

### Politicas RLS

Para `clients`:

- `select`: usuario so le linhas com `user_id = auth.uid()`
- `insert`: usuario so insere linhas com `user_id = auth.uid()`
- `update`: usuario so altera linhas com `user_id = auth.uid()`
- `delete`: usuario so remove linhas com `user_id = auth.uid()`

Para `client_year_data`:

- mesmas regras baseadas em `user_id = auth.uid()`

Para `profiles`:

- usuario le e atualiza apenas o proprio perfil

### Observacao

Mesmo que o frontend tenha erro, as politicas do banco devem impedir vazamento entre contas. Essa e a principal razao para usar RLS desde o inicio.

## Integracao no Frontend

### Novos modulos

- `src/lib/supabase/client.ts`
- `src/lib/supabase/auth.ts`
- `src/lib/supabase/financialRepository.ts`
- `src/lib/supabase/mappers.ts`

### Responsabilidades

`client.ts`
- instancia do Supabase

`auth.ts`
- login
- cadastro
- logout
- leitura da sessao atual

`financialRepository.ts`
- listar clientes do usuario
- criar cliente
- renomear cliente
- excluir cliente
- carregar dados anuais
- salvar `empresa`, `premissas`, `cenarios`
- salvar `orcMes` e `realMes`

`mappers.ts`
- traduz banco <-> tipos do app

## Mudancas no `FinancialContext`

### Estado novo

O contexto passa a ter:

- `status de autenticacao`
- `status de carregamento`
- `erro de sincronizacao`
- `fullState` carregado a partir do banco

### Comportamento

1. ao iniciar, verificar sessao
2. se nao houver sessao, mostrar tela de autenticacao
3. se houver sessao, carregar clientes do usuario
4. montar `fullState` em memoria com o mesmo formato atual
5. ao editar dados, refletir na UI imediatamente
6. persistir mudancas no Supabase

### Estrategia de salvamento

Recomendacao:

- manter atualizacao otimista na UI
- salvar no banco logo apos a mudanca
- usar `debounce` curto apenas em campos de digitacao continua, se necessario

Isso preserva a sensacao de app local, mas com persistencia remota.

## Migracao do `localStorage`

### Fluxo recomendado

Quando um usuario logar e o navegador tiver dados locais antigos:

1. detectar dados no `localStorage`
2. perguntar se deseja importar para a conta atual
3. converter o estado local para o formato do banco
4. criar clientes e anos no Supabase
5. limpar ou marcar a migracao como concluida

### Motivo

Isso evita perda de dados e reduz friccao na transicao.

## Impacto na UI

### Nova tela necessaria

Adicionar tela simples de autenticacao:

- login
- cadastro
- logout

### Telas existentes

As tabs principais devem continuar iguais:

- Planejamento
- Lancamento Mensal
- Realizado vs. Orcado
- Evolucao
- Balanco
- Fluxo de Caixa

O objetivo e trocar a fonte dos dados, nao redesenhar a experiencia agora.

## Tratamento de Erros

- falha de login: mensagem clara no formulario
- falha ao carregar clientes: estado de erro com tentativa de recarga
- falha ao salvar: aviso nao bloqueante e opcao de tentar novamente
- perda de conectividade: manter estado local da sessao e sinalizar que ha sincronizacao pendente

## Testes

### Minimo necessario

- login bem-sucedido
- usuario nao autenticado nao acessa dados
- usuario A nao le cliente do usuario B
- criar cliente gera registro zerado no ano ativo
- importar valores e trocar mes continua refletindo os dados corretos
- exclusao de cliente remove anos associados
- migracao de `localStorage` cria registros corretos

## Fases de Implementacao

### Fase 1

- configurar Supabase no projeto
- adicionar variaveis de ambiente
- criar schema e RLS
- criar tela de autenticacao

### Fase 2

- criar camada `financialRepository`
- carregar clientes reais no `FinancialContext`
- substituir `localStorage` como fonte principal

### Fase 3

- salvar alteracoes de cliente e dados anuais no banco
- implementar migracao opcional do `localStorage`

### Fase 4

- endurecer tratamento de erro
- adicionar testes de integracao basicos

## Decisoes Fora de Escopo Agora

- compartilhamento de clientes entre usuarios
- papeis e permissoes por equipe
- trilha de auditoria detalhada
- historico de revisoes por campo
- backend proprio

## Resultado Esperado

Ao fim da primeira implementacao:

- usuario cria conta e faz login
- cada usuario ve apenas os proprios clientes
- clientes e anos ficam persistidos no banco
- importacoes e edicoes atuais continuam funcionando
- o app deixa de depender exclusivamente do navegador onde foi usado
