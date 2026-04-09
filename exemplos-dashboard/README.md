# Kits de teste do dashboard

Esta pasta contem 2 empresas de exemplo para testar o dashboard completo.

Observacao:
- A DRE continua com 1 kit de orcamento e 1 kit de realizado por empresa.
- O `Fluxo de Caixa` e o `Balanco Patrimonial` agora tem arquivos separados para `2025` e `2026`.
- Isso permite importar um ano, trocar o seletor do dashboard e importar o ano seguinte para testar comparativos e evolucao.
- Para `Balanco Patrimonial`, prefira os arquivos com sufixo `_v2`, que seguem a mesma convencao de blocos da planilha validada no sistema.

## Empresa 1
- Pasta: `01_jrh_educacional`
- Perfil: educacao corporativa
- Arquivos:
- `01_jrh_educacional_orcamento_dre.xlsx`
- `01_jrh_educacional_realizado_dre.xlsx`
- `01_jrh_educacional_2025_fluxo_caixa.xlsx`
- `01_jrh_educacional_2025_fluxo_caixa.csv`
- `01_jrh_educacional_2026_fluxo_caixa.xlsx`
- `01_jrh_educacional_2026_fluxo_caixa.csv`
- `01_jrh_educacional_2025_balanco_patrimonial_v2.xlsx`
- `01_jrh_educacional_2025_balanco_patrimonial_v2.csv`
- `01_jrh_educacional_2026_balanco_patrimonial_v2.xlsx`
- `01_jrh_educacional_2026_balanco_patrimonial_v2.csv`
- `01_jrh_educacional_info.md`

## Empresa 2
- Pasta: `02_serra_moda_varejo`
- Perfil: varejo de moda
- Arquivos:
- `02_serra_moda_varejo_orcamento_dre.xlsx`
- `02_serra_moda_varejo_realizado_dre.xlsx`
- `02_serra_moda_varejo_2025_fluxo_caixa.xlsx`
- `02_serra_moda_varejo_2025_fluxo_caixa.csv`
- `02_serra_moda_varejo_2026_fluxo_caixa.xlsx`
- `02_serra_moda_varejo_2026_fluxo_caixa.csv`
- `02_serra_moda_varejo_2025_balanco_patrimonial_v2.xlsx`
- `02_serra_moda_varejo_2025_balanco_patrimonial_v2.csv`
- `02_serra_moda_varejo_2026_balanco_patrimonial_v2.xlsx`
- `02_serra_moda_varejo_2026_balanco_patrimonial_v2.csv`
- `02_serra_moda_varejo_info.md`

## Como testar
1. Crie um cliente novo.
2. Preencha o nome, segmento, moeda e premissas usando a ficha da empresa.
3. Em `Planejamento`, importe o arquivo `orcamento_dre.xlsx`.
4. Em `Lancamento Mensal`, importe o arquivo `realizado_dre.xlsx`.
5. Selecione `2025` no dashboard.
6. Em `Fluxo de Caixa`, importe o arquivo `2025_fluxo_caixa.xlsx` ou `2025_fluxo_caixa.csv`.
7. Em `Balanco Patrimonial`, importe o arquivo `2025_balanco_patrimonial_v2.xlsx` ou `2025_balanco_patrimonial_v2.csv`.
8. Troque o seletor do dashboard para `2026`.
9. Em `Fluxo de Caixa`, importe o arquivo `2026_fluxo_caixa.xlsx` ou `2026_fluxo_caixa.csv`.
10. Em `Balanco Patrimonial`, importe o arquivo `2026_balanco_patrimonial_v2.xlsx` ou `2026_balanco_patrimonial_v2.csv`.
11. Depois revise:
- abas mensais
- comparativos
- evolucao
- balanco patrimonial
- fluxo de caixa
- tela inicial
