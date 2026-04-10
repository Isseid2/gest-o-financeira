# Dashboard Security Hardening Design

## Objetivo

Fortalecer a primeira fase do dashboard em duas frentes:

1. seguranca de acesso e isolamento de dados;
2. seguranca operacional, recuperacao e reducao de perda acidental.

O foco desta rodada e endurecer o produto sem alterar a experiencia principal do consultor nem criar atrito desnecessario no uso diario.

## Escopo

Esta rodada cobre:

- autenticacao e sessao;
- configuracao do Supabase e ambiente;
- persistencia e isolamento de dados por usuario e por cliente;
- exclusoes e operacoes destrutivas;
- backup e exportacao;
- trilha minima de eventos criticos;
- mensagens e estados de erro relacionados a seguranca.

Esta rodada nao cobre:

- perfis internos com multiplos niveis de permissao dentro da mesma conta;
- compartilhamento de clientes entre usuarios;
- SIEM, SOC, alertas externos ou monitoramento corporativo;
- criptografia customizada de campo no frontend.

## Estado Atual

Pontos positivos ja existentes:

- autenticacao por Supabase;
- sessao limitada por aba;
- RLS em `profiles`, `clients` e `client_year_data`;
- separacao basica por `user_id`;
- confirmacoes customizadas no dashboard para exclusoes.

Pontos que ainda representam risco:

- fallback hardcoded da `Project URL` e `publishable key` em `src/lib/supabase/client.ts`;
- exclusoes permanentes sem camada de recuperacao;
- ausencia de backup/exportacao guiada pelo produto;
- ausencia de log funcional minimo para saber quem fez importacao, exclusao ou salvamento;
- mensagens e estados de sessao ainda pouco orientados a seguranca;
- risco de residuos locais antigos no navegador continuarem influenciando o comportamento.

## Abordagens Consideradas

### Opcao 1 - Endurecimento essencial

- remover fallback hardcoded do Supabase;
- reforcar sessao, logout e recovery;
- endurecer exclusoes;
- adicionar exportacao de backup;
- adicionar trilha minima de auditoria.

Vantagens:

- melhor equilibrio entre seguranca, prazo e baixo risco funcional;
- reduz exposicao de ambiente;
- melhora confiabilidade operacional sem refatoracao grande.

Limites:

- ainda nao introduz restauracao completa self-service;
- auditoria permanece enxuta.

### Opcao 2 - Endurecimento forte

Tudo da opcao 1, mais:

- soft delete para clientes e periodos;
- recuperacao em janela curta;
- tabela dedicada de auditoria;
- protecoes extras por operacao.

Vantagens:

- melhor recuperacao e rastreabilidade;
- reduz impacto de erro humano.

Limites:

- aumenta migracoes, complexidade e superficie de teste.

### Opcao 3 - Endurecimento empresarial

Tudo da opcao 2, mais:

- papeis internos;
- versionamento mais formal;
- observabilidade e alertas externos.

Vantagens:

- base mais corporativa.

Limites:

- acima do necessario para a fase atual.

## Recomendacao

Seguir com a **Opcao 1**, mas preparando a modelagem para crescer para a Opcao 2 sem retrabalho estrutural.

## Design

### 1. Ambiente e Supabase

Objetivo: eliminar ambiguidade de ambiente e reduzir dependencia de fallback embutido.

Mudancas:

- remover fallback hardcoded de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `src/lib/supabase/client.ts`;
- manter mensagem clara de configuracao ausente;
- manter `publishable key` apenas via ambiente publicado, nunca como verdade implicita do app;
- revisar `VITE_AUTH_REDIRECT_URL` para garantir consistencia entre login, recovery e troca de senha.

Resultado esperado:

- cada ambiente passa a depender de configuracao explicita;
- reducao de risco de apontar build errada para a base real.

### 2. Sessao e autenticacao

Objetivo: fortalecer previsibilidade da sessao e reduzir comportamento ambiguo.

Mudancas:

- manter sessao por aba;
- revisar logout para garantir limpeza completa do estado local sensivel;
- revisar fluxo de recovery para impedir acesso residual sem troca de senha;
- tratar expiracao de sessao com feedback claro e retorno limpo para login;
- unificar mensagens de cadastro/reset para nao induzir interpretacoes erradas.

Resultado esperado:

- sessao mais previsivel;
- menos confusao em reset, login e reentrada.

### 3. Isolamento de dados

Objetivo: garantir separacao real entre usuarios, clientes e contexto visual.

Mudancas:

- revisar todos os pontos que ainda usem residuos locais antigos para hidratar UI;
- reforcar que cliente novo nasca limpo no dashboard inteiro;
- revisar componentes embutidos remanescentes para reset explicito ao trocar cliente;
- manter persistencia sempre vinculada a `clienteAtivo`, `anoSelecionado` e `user_id`.

Resultado esperado:

- nenhuma importacao ou exclusao em um cliente pode afetar outro;
- nenhuma aba deve reaproveitar estado visual de outro cliente.

### 4. Exclusoes e operacoes destrutivas

Objetivo: reduzir perda acidental sem criar atrito exagerado.

Mudancas:

- padronizar todos os fluxos destrutivos com modal do dashboard;
- reforcar texto de risco para exclusoes permanentes;
- adicionar camada de confirmacao forte para exclusao de cliente, exigindo contexto mais claro;
- preparar arquitetura para evoluir para soft delete depois, sem precisar refazer a UI.

Resultado esperado:

- menos erro humano;
- linguagem mais segura nas operacoes criticas.

### 5. Backup e exportacao

Objetivo: dar ao consultor uma forma pratica de preservar dados antes de mudancas relevantes.

Mudancas:

- criar exportacao manual do estado por cliente;
- permitir exportacao estruturada dos dados relevantes do cliente atual;
- posicionar isso em area de configuracoes/cliente, nao no fluxo principal;
- manter formato facil de armazenar externamente.

Resultado esperado:

- usuario consegue gerar backup antes de operacoes arriscadas;
- melhora a recuperacao operacional sem depender de suporte.

### 6. Auditoria funcional minima

Objetivo: registrar eventos criticos suficientes para investigacao operacional.

Escopo minimo de eventos:

- criacao de cliente;
- exclusao de cliente;
- importacao de DRE;
- importacao de Balanco;
- importacao de Fluxo;
- salvamento de historico;
- exclusao de periodo salvo.

Modelagem recomendada:

- nova tabela simples de auditoria no Supabase;
- cada evento registra `user_id`, `client_id`, tipo de acao, alvo, timestamp e metadados minimos.

Resultado esperado:

- trilha basica para entender o que foi feito e quando.

### 7. UX de seguranca

Objetivo: tornar seguranca mais clara sem deixar o produto pesado.

Mudancas:

- mensagens de sessao expirada;
- mensagens de recovery mais objetivas;
- banner de dados locais com comportamento previsivel;
- estados de carregamento/erro em operacoes de persistencia;
- feedback claro quando uma operacao critica falha no banco.

Resultado esperado:

- menos ambiguidade para o usuario;
- menor risco de interpretar falha como sucesso.

## Ordem de Implementacao

1. endurecer ambiente do Supabase e sessao;
2. revisar isolamento de estado local e remanescente;
3. padronizar operacoes destrutivas restantes;
4. adicionar exportacao de backup;
5. adicionar auditoria funcional minima;
6. revisar mensagens e estados de erro.

## Migracoes Previstas

Esta rodada pode exigir:

- tabela de auditoria funcional;
- indices basicos por `user_id`, `client_id` e `created_at`;
- nenhuma quebra de schema atual de clientes/anos, salvo inclusao de novos objetos auxiliares.

## Testes de Aceite

### Acesso e sessao

- login, logout e recovery funcionam nos ambientes configurados;
- sem variaveis de ambiente corretas, o app nao conecta silenciosamente;
- sessao expirada nao deixa tela branca nem estado ambiguo.

### Isolamento

- cliente novo nasce limpo;
- importar em um cliente nao afeta outro;
- excluir em um cliente nao altera outro;
- reentrar nas abas nao reaproveita dados de outro contexto.

### Operacao

- exclusoes sempre passam por modal do dashboard;
- exportacao de backup gera um artefato consistente;
- eventos criticos aparecem na auditoria;
- falhas do banco geram feedback claro.

## Riscos e Mitigacoes

### Risco: endurecer ambiente e quebrar o deploy atual

Mitigacao:

- introduzir validacao clara de configuracao;
- alinhar checklist de ambiente publicado antes da remocao final do fallback.

### Risco: adicionar auditoria e aumentar numero de writes

Mitigacao:

- registrar apenas eventos criticos;
- payload pequeno e indexado.

### Risco: backup ser confundido com restauracao automatica

Mitigacao:

- nomear claramente como exportacao de seguranca;
- manter escopo explicito nesta fase.

## Criterio de Sucesso

Esta rodada sera considerada bem-sucedida quando:

- o dashboard exigir configuracao de ambiente explicita;
- sessao, login e recovery estiverem previsiveis;
- clientes e periodos estiverem isolados de forma confiavel;
- operacoes destrutivas estiverem protegidas por UX consistente;
- o usuario conseguir exportar backup do cliente;
- eventos criticos estiverem minimamente auditados no banco.
