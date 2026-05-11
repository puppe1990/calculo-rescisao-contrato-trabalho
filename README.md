# Cálculo de Rescisão

Sistema desktop para simulação e histórico de cálculos de rescisão usando:

- NeutralinoJS
- HTML + Tailwind CSS
- JavaScript modular
- SQLite via `sql.js`
- Vitest para TDD

## Requisitos

- Node.js 22+
- npm 11+

## Scripts

```bash
npm install
npm run test
npm run dev
npm run build
```

## Escopo atual

- Simulação manual de rescisão
- Persistência local em arquivo `calculo-rescisao.sqlite`
- Histórico recente de simulações
- Importação de planilhas `.xlsx` e `.xls`
- Exportação do histórico em planilha `.xlsx`
- Regras-base para:
  - saldo de salário
  - 13º proporcional
  - férias proporcionais e vencidas com 1/3
  - aviso prévio
  - depósito de FGTS sobre base rescisória
  - multa de 40% do FGTS para sem justa causa

## Observação importante

Esta versão é um MVP técnico. Sem a planilha real do Mercado Livre e sem revisão trabalhista,
o sistema não deve ser tratado como calculadora jurídica definitiva. A próxima etapa correta é
mapear as colunas e fórmulas do Excel original, comparar caso a caso e ajustar regras,
convenções coletivas, descontos legais e exceções.
