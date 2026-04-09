# Reestruturacao do Fluxo de Caixa para React Nativo

## Objetivo

Substituir o modulo atual de `Fluxo de Caixa`, hoje renderizado por `iframe` com HTML/JS embutido, por uma implementacao React nativa que:

- abra instantaneamente como as outras abas do dashboard;
- preserve exatamente a aparencia e os recursos atuais;
- use a mesma persistencia por cliente ja adotada no restante do sistema;
- elimine handshake frágil entre host e iframe, spinner infinito e vazamento de dados entre clientes.

## Problema Atual

O `Fluxo de Caixa` depende de um documento gerado por `buildBPDocument()` e de uma ponte `postMessage` entre host e iframe. Isso introduz:

- carregamento lento ou preso em `Carregando modulo de fluxo...`;
- falhas de reentrada ao sair e voltar para a aba;
- complexidade para exclusoes, confirmacoes e sincronizacao;
- risco de dados aparentarem estar zerados ate forcar troca manual de periodo;
- manutencao mais cara do que o restante das abas React.

## Escopo

Entram nesta migracao:

- matriz mensal do fluxo;
- periodo ativo e lista de anos;
- saldo inicial;
- KPIs principais;
- filtros visuais e controles superiores;
- importacao com preview e confirmacao;
- exclusao de periodo;
- comparativo;
- modo claro/escuro;
- persistencia por cliente em `fluxoData`.

Nao entram:

- redesenho visual do modulo;
- mudanca de estrutura de persistencia no banco alem do formato ja usado;
- alteracao de regras financeiras do modulo alem do necessario para equivalencia.

## Abordagens Consideradas

### 1. Corrigir o iframe com retries e timeouts

Melhora o sintoma, mas mantem a arquitetura fragil. Ainda depende de handshake e de DOM isolado fora do React.

### 2. Modelo hibrido temporario

Moveria so parte da logica para React e deixaria o resto no iframe. Reduz trabalho inicial, mas mantem duplicidade de responsabilidades.

### 3. Reescrita React nativa por camadas

Extrair regras, estado e renderizacao do modulo atual e reconstruir a tela em React sem mudar a experiencia do usuario.

**Recomendacao:** abordagem 3.

## Design Proposto

### 1. Camada de dominio do fluxo

Criar um modulo React/TypeScript com funcoes puras para:

- normalizar periodos;
- manter `activeYear`;
- calcular KPIs;
- montar a matriz mensal;
- gerar visoes do comparativo;
- aplicar importacoes confirmadas;
- remover periodos;
- resetar estado vazio de cliente novo.

Essa camada sera a fonte unica de verdade do fluxo.

### 2. Estado React local + persistencia no contexto

`FluxoCaixaTab.tsx` deixa de hidratar iframe e passa a:

- ler `cliente.fluxoData`;
- montar um estado React local derivado;
- persistir mudancas por `updateFluxoData`;
- reagir a troca de cliente e de tema como qualquer outra aba.

Nao deve haver `postMessage`, `cx-ready`, `cx-hydrate` ou dependencia de `contentWindow`.

### 3. UI com equivalencia visual

A tela React deve copiar a aparencia atual:

- cards de KPIs;
- bloco de periodos;
- barra/filtros superiores;
- tabela matriz;
- comparativo;
- estados vazios;
- confirmacoes de exclusao.

O objetivo e equivalencia visual e funcional, nao redesign.

### 4. Importacao

A importacao passa a usar funcoes TS puras para:

- ler linhas confirmadas;
- aplicar aliases/categorias;
- atualizar o ano ativo;
- refletir o resultado imediatamente na matriz e nos indicadores;
- persistir por cliente.

O preview e a confirmacao continuam existindo, mas controlados por React.

### 5. Exclusao e reentrada

Excluir periodo ou trocar de cliente deve atualizar a aba instantaneamente, sem recarga estrutural do modulo.

Ao voltar para `Fluxo de Caixa`, a aba deve abrir com o estado persistido ja renderizado, sem spinner infinito.

### 6. Tema

O tema claro/escuro deve usar os tokens do dashboard, nao injecao de CSS em HTML embutido.

## Estrutura Esperada

Arquivos provaveis:

- `src/components/tabs/FluxoCaixaTab.tsx`
- `src/components/tabs/fluxo-caixa/*` para componentes menores
- `src/components/tabs/fluxo-caixa/model.ts` para regras puras
- `src/components/tabs/fluxo-caixa/import.ts` para importacao e parsing

Se durante a implementacao a tela crescer demais, dividir os componentes por responsabilidade e manter o tab principal apenas como orquestrador.

## Compatibilidade de Dados

O formato salvo em `cliente.fluxoData` deve continuar compativel com o que o app ja armazena hoje:

- `periods`
- `activeYear`

Assim, clientes que ja tenham fluxo salvo nao perdem dados na migracao.

## Erros e Recuperacao

Ao inves de spinner infinito:

- mostrar estado vazio quando nao houver periodos;
- mostrar erro claro se a importacao falhar;
- permitir retry na importacao, nao no carregamento da aba.

## Testes de Aceite

### Carregamento

- abrir `Fluxo de Caixa` deve ser instantaneo como `Balanco` e `Planejamento`;
- sair e voltar para a aba deve manter a visao correta;
- trocar cliente nao pode reaproveitar dados visuais do cliente anterior.

### Persistencia

- importar e salvar em um cliente nao deve aparecer em outro;
- excluir periodo em um cliente nao deve afetar outro;
- refresh da pagina deve manter os dados do cliente correto.

### Fidelidade funcional

- KPIs batem com a versao anterior;
- matriz mensal bate com a versao anterior;
- comparativo bate com a versao anterior;
- exclusoes e confirmacoes continuam funcionando.

### Tema

- claro e escuro consistentes com o dashboard;
- sem linhas especiais apagadas ou com contraste quebrado.

## Riscos

- regressao em detalhes da matriz e do comparativo, porque o modulo atual concentra muita regra embutida;
- necessidade de extrair regras com cuidado para nao alterar comportamento financeiro;
- risco de arquivo unico grande se nao houver divisao por componentes e dominio.

## Mitigacao

- implementar por equivalencia, comparando o novo componente com o estado salvo atual;
- manter a persistencia compatível;
- dividir regras puras e UI em arquivos separados;
- validar cenarios com clientes ja existentes antes de remover qualquer fallback antigo.
