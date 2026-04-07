# Design: CRM Separado com Mesma Stack do Dashboard

## Objetivo

Criar um novo projeto de CRM, separado do dashboard financeiro atual, mas usando a mesma base tecnica de `React + Vite + Supabase`.

O CRM deve nascer como um produto proprio, com frontend independente, estrutura de modulos dedicada e identidade visual inspirada no Metrium, sem copiar a interface literalmente. A direcao aprovada e preservar a linguagem de produto com `sidebar escura + area principal clara + modulos bem definidos`, mas aplicar a identidade visual do ecossistema que ja esta sendo construido.

O objetivo desta fase nao e implementar ainda. A prioridade e fechar a arquitetura, o escopo da v1 e a forma de compartilhamento com a stack atual.

## Decisao Principal

O CRM sera um `projeto novo`, separado do dashboard financeiro.

Ele vai:

- ter frontend proprio
- ter rotas, paginas e componentes proprios
- usar o mesmo Supabase da stack atual
- compartilhar autenticacao e infraestrutura
- manter dominio de dados separado do dominio financeiro

O dashboard financeiro atual nao deve receber a logica do CRM dentro da mesma aplicacao.

## Estado Atual

Hoje o projeto principal ja possui:

- app React/Vite em producao local
- autenticacao com Supabase
- persistencia em Postgres com RLS
- componentes UI baseados em `shadcn`
- estrutura de dashboard com sidebar, tabs e modulos financeiros

Esse estado atual e positivo porque reduz muito o trabalho do CRM novo:

- a autenticacao ja esta validada
- a conexao com Supabase ja existe
- a linguagem visual base do ecossistema ja esta encaminhada
- o CRM pode reutilizar convencoes de design e parte da infraestrutura sem acoplar regras de negocio

## Requisitos

### Funcionais

- o CRM deve existir como aplicacao separada do dashboard financeiro
- o usuario deve entrar com autenticacao baseada no mesmo Supabase
- a v1 deve conter:
  - dashboard inicial
  - modulo de leads
  - pipeline comercial
  - projetos
  - tarefas
  - configuracoes basicas
- leads devem poder evoluir entre etapas do funil
- cada lead deve guardar informacoes basicas, responsavel, tags e historico resumido
- projetos devem poder ser vinculados a clientes ou oportunidades
- tarefas devem permitir status, prioridade, responsavel e prazo
- a aplicacao deve ser preparada para evoluir depois para clientes, propostas e relatorios

### Nao funcionais

- separacao clara entre dominio CRM e dominio financeiro
- reaproveitamento de autenticacao e infraestrutura
- visual consistente com o ecossistema ja existente
- manutencao simples, sem misturar regras de negocio em um unico frontend
- base pronta para multiusuario com seguranca no banco

## Abordagens Consideradas

### 1. Embutir o CRM dentro do app financeiro atual

Vantagens:

- um unico deploy frontend
- reaproveitamento imediato da estrutura existente

Desvantagens:

- mistura dois produtos com objetivos diferentes
- aumenta o risco de regressao no app financeiro
- dificulta manutencao e evolucao do codigo
- sidebar, rotas e contexto ficariam cada vez mais complexos

### 2. Projeto separado com a mesma stack Supabase

Vantagens:

- mantem os produtos isolados
- reaproveita autenticacao, banco e politicas de seguranca
- reduz retrabalho de infraestrutura
- facilita evolucao independente de cada produto

Desvantagens:

- exige novo frontend
- pede disciplina no desenho do banco para nao cruzar dominios sem controle

### 3. Projeto separado com backend e autenticacao proprios

Vantagens:

- isolamento maximo
- liberdade total de arquitetura

Desvantagens:

- custo maior
- duplicacao de esforco em login, usuarios, schema e operacao
- desnecessario para a fase atual

## Recomendacao

Usar `projeto separado com a mesma stack Supabase`.

Essa opcao preserva a organizacao do produto, reduz o risco no dashboard financeiro e ainda aproveita o que ja foi construido de autenticacao, infraestrutura e padroes de interface.

## Direcao de Produto

### Posicionamento da v1

O CRM nasce como um sistema de operacao comercial e acompanhamento de trabalho, com foco em:

- leads
- pipeline
- projetos
- tarefas
- configuracoes de equipe

Nao e um ERP. Nao deve tentar resolver financeiro, faturamento ou analytics avancado nesta primeira fase.

### Fora de escopo da v1

- propostas comerciais completas
- agenda/calendario avancado
- automacoes de CRM
- trilha de auditoria detalhada
- relatatorios complexos
- sincronizacao com WhatsApp, email ou telefone
- regras de cobranca e assinatura avancadas

## Arquitetura Proposta

### Camadas

1. `Frontend CRM`
- novo app React/Vite
- responsavel por layout, navegacao, modulos e estados locais

2. `Supabase Auth`
- mesmo provedor de autenticacao usado no ecossistema atual
- sessao compartilhada por conta

3. `Postgres`
- novas tabelas para CRM
- separadas das tabelas financeiras

4. `RLS`
- isolamento por usuario ou organizacao
- protege os dados do CRM no banco

5. `Camada de repositorio`
- modulos dedicados para leads, pipeline, projetos, tarefas e configuracoes
- centraliza leitura, escrita e mapeamento

## Decisao sobre Compartilhamento

### O que sera compartilhado com o sistema atual

- projeto Supabase
- autenticacao
- perfis de usuario
- possiveis utilitarios comuns de design ou conexao

### O que nao sera compartilhado como dominio

- contextos React do dashboard financeiro
- tabelas financeiras
- logica de importacao de planilhas financeiras
- paginas e componentes do dashboard atual

Essa separacao e importante para evitar acoplamento acidental entre os dois produtos.

## Estrutura do Frontend

### Navegacao principal

A navegacao da v1 deve seguir esta estrutura:

- `Inicio`
- `CRM`
- `Projetos`
- `Tarefas`
- `Configuracoes`

### Layout base

- `sidebar fixa escura` do lado esquerdo
- `conteudo principal claro` com fundo neutro
- `header de contexto` com titulo e subtitulo da pagina
- `acoes principais` alinhadas a direita
- `filtros horizontais` acima de listas, quadros e tabelas

### Racional visual

A referencia do Metrium deve ser reinterpretada, nao clonada. O que sera reaproveitado:

- estrutura de navegacao
- densidade visual baixa
- cards com bordas suaves
- modulos claros e bem separados
- botoes primarios com destaque forte

O que sera adaptado:

- paleta de cores para a identidade do seu ecossistema
- componentes seguindo o design system local
- tipografia e estados visuais ajustados ao projeto

## Sistema Visual Proposto

### Principios

- sidebar escura para criar ancora de produto
- area de trabalho clara para leitura longa
- cards com `border radius` generoso
- sombra discreta e borda leve
- tipografia de titulos forte e objetiva
- acao primaria sempre muito clara no layout

### Aplicacao das cores

- `sidebar`: quase preta ou grafite muito escuro
- `background principal`: branco ou cinza muito claro
- `cor primaria`: a mesma familia do seu produto atual
- `estados`: verde para concluido, amarelo para atencao, vermelho para urgente
- `graficos`: tons alinhados ao sistema existente

### Componentes chave

- `AppShell`
- `SidebarNav`
- `PageHeader`
- `MetricCard`
- `FilterBar`
- `KanbanColumn`
- `LeadCard`
- `ProjectCard`
- `TaskTable`
- `SettingsTabs`

## Paginas da v1

### 1. Inicio

Objetivo:

- oferecer panorama rapido da operacao

Conteudo:

- cards de resumo
- tarefas concluidas
- tarefas urgentes
- prazos proximos
- visao de projetos ativos

### 2. CRM

Objetivo:

- gerir leads e oportunidades

Conteudo:

- busca
- filtros por status, responsavel e tag
- contagem de leads
- botao `Novo Lead`
- quadro em colunas com etapas

Etapas iniciais recomendadas:

- `Lead`
- `Qualificacao`
- `Entrevista`
- `Proposta Enviada`
- `Negociacao`
- `Fechado`

### 3. Projetos

Objetivo:

- acompanhar trabalhos vinculados a clientes ou oportunidades

Conteudo:

- cards de projeto
- status do projeto
- etiquetas
- responsavel
- data de criacao
- contador de tarefas
- atalhos para tarefas e analise futura

### 4. Tarefas

Objetivo:

- centralizar execucao operacional

Conteudo:

- tabela ou lista
- titulo
- status
- responsavel
- prioridade
- prazo
- acoes

### 5. Configuracoes

Objetivo:

- administrar usuarios e preferencias basicas da organizacao

Conteudo:

- usuarios
- personalizacao futura
- regras basicas de operacao

## Modelo de Dados

### Opcao de modelagem

Para a v1, o modelo deve ser relacional e enxuto. A estrutura precisa ser simples o bastante para acelerar implementacao, mas clara o suficiente para nao travar a evolucao.

### Tabela `crm_organizations`

Representa a conta de operacao do CRM.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `owner_user_id uuid not null references auth.users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### Tabela `crm_organization_members`

Relaciona usuarios a organizacoes.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references crm_organizations(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `role text not null default 'member'`
- `created_at timestamptz default now()`

Restricao:

- `unique (organization_id, user_id)`

### Tabela `crm_lead_stages`

Define as etapas do pipeline.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references crm_organizations(id) on delete cascade`
- `name text not null`
- `position integer not null`
- `color text null`
- `created_at timestamptz default now()`

### Tabela `crm_leads`

Representa leads e oportunidades.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references crm_organizations(id) on delete cascade`
- `stage_id uuid not null references crm_lead_stages(id)`
- `owner_user_id uuid null references auth.users(id)`
- `name text not null`
- `company_name text null`
- `email text null`
- `phone text null`
- `source text null`
- `status text not null default 'open'`
- `notes text null`
- `tags text[] not null default '{}'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### Tabela `crm_lead_activities`

Historico leve de interacoes.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references crm_organizations(id) on delete cascade`
- `lead_id uuid not null references crm_leads(id) on delete cascade`
- `user_id uuid null references auth.users(id)`
- `type text not null`
- `content text not null`
- `created_at timestamptz default now()`

### Tabela `crm_projects`

Projetos vinculados ao CRM.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references crm_organizations(id) on delete cascade`
- `lead_id uuid null references crm_leads(id) on delete set null`
- `name text not null`
- `client_name text null`
- `status text not null default 'planning'`
- `category text null`
- `owner_user_id uuid null references auth.users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### Tabela `crm_tasks`

Tarefas operacionais do CRM.

Campos:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references crm_organizations(id) on delete cascade`
- `project_id uuid null references crm_projects(id) on delete set null`
- `lead_id uuid null references crm_leads(id) on delete set null`
- `title text not null`
- `description text null`
- `status text not null default 'pending'`
- `priority text not null default 'normal'`
- `assigned_user_id uuid null references auth.users(id)`
- `due_date date null`
- `created_by uuid null references auth.users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

## Regras de Seguranca

### Estrategia recomendada

Toda leitura e escrita deve ser protegida por `RLS`, preferencialmente com base em pertencimento a `organization_id`.

### Politicas base

Para tabelas do CRM:

- usuario autenticado so acessa registros da organizacao em que e membro
- usuario so insere dados ligados a uma organizacao onde participa
- update e delete devem respeitar a mesma regra

### Motivo

Mesmo que hoje a v1 comece com um time pequeno, modelar por organizacao ja evita refatoracao estrutural quando houver mais de um membro por conta.

## Fluxo de Dados

### Bootstrap

1. usuario faz login
2. frontend resolve sessao atual
3. sistema busca organizacao e membership do usuario
4. carrega dashboard inicial e dados principais
5. monta caches por modulo com `react-query`

### Modulos

- `leadsRepository`
- `pipelineRepository`
- `projectsRepository`
- `tasksRepository`
- `settingsRepository`

Cada modulo deve expor operacoes pequenas e diretas, sem acoplar regras visuais.

## Estrutura de Pastas Recomendada

```text
crm-app/
  src/
    app/
      providers/
      router/
    components/
      shell/
      crm/
      projects/
      tasks/
      dashboard/
      settings/
      ui/
    features/
      auth/
      organizations/
      leads/
      pipeline/
      projects/
      tasks/
      settings/
    lib/
      supabase/
      utils/
      formatters/
    pages/
      Login.tsx
      Home.tsx
      Crm.tsx
      Projects.tsx
      Tasks.tsx
      Settings.tsx
    types/
```

## Comportamento por Pagina

### CRM

- quadro horizontal com scroll, se necessario
- filtro por responsavel, status e tag
- cards de lead com dados essenciais
- movimento entre etapas por acao direta

### Projetos

- cards com status e atalhos
- leitura rapida de responsavel e progresso
- acesso simples a tarefas relacionadas

### Tarefas

- tabela enxuta
- prioridade e status com badges visuais
- filtros no topo

### Configuracoes

- abas internas
- foco inicial em membros da equipe

## Tratamento de Erros

- falha ao carregar modulos: estado de erro com recarga
- falha ao salvar lead ou tarefa: aviso nao bloqueante
- erro de permissao: mensagem clara de acesso negado
- sessao expirada: redirecionar para login

## Testes Esperados

### Minimo da v1

- login com sessao valida
- carregamento do dashboard inicial
- criacao de lead
- mudanca de etapa do lead
- criacao de projeto
- criacao e edicao de tarefa
- usuario fora da organizacao nao acessa dados do CRM

## Fases de Implementacao

### Fase 1

- criar novo frontend CRM
- configurar autenticacao com o mesmo Supabase
- montar AppShell e navegacao base

### Fase 2

- criar schema inicial do CRM
- implementar RLS por organizacao
- criar repositorios de leitura e escrita

### Fase 3

- implementar modulo CRM com pipeline
- implementar projetos
- implementar tarefas

### Fase 4

- implementar dashboard inicial
- implementar configuracoes basicas
- revisar estados de loading e erro

## Decisoes Importantes

- CRM e dashboard financeiro continuam separados no frontend
- o compartilhamento acontece na infraestrutura, nao na logica de negocio
- a referencia do Metrium sera usada como linguagem estrutural, nao como copia visual
- o modelo de dados deve nascer por organizacao para evitar retrabalho

## Resultado Esperado

Ao fim da v1:

- existira um CRM novo, separado do dashboard atual
- o usuario podera entrar no CRM com a mesma stack de autenticacao
- leads, projetos e tarefas estarao operando em um dominio proprio
- a interface tera identidade consistente com o seu ecossistema
- a base tecnica ficara pronta para evoluir sem comprometer o app financeiro
