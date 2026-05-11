# Calculo de Rescisao

Sistema desktop para simulacao e historico de calculos de rescisao usando:

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

- Simulacao manual de rescisao
- Persistencia local em arquivo `calculo-rescisao.sqlite`
- Historico recente de simulacoes
- Importacao de planilhas `.xlsx` e `.xls`
- Regras-base para:
  - saldo de salario
  - 13o proporcional
  - ferias proporcionais e vencidas com 1/3
  - aviso previo
  - deposito de FGTS sobre base rescisoria
  - multa de 40% do FGTS para sem justa causa

## Observacao importante

Esta versao e um MVP tecnico. Sem a planilha real do Mercado Livre e sem revisao trabalhista,
o sistema nao deve ser tratado como calculadora juridica definitiva. A proxima etapa correta e
mapear as colunas e formulas do Excel original, comparar caso a caso e ajustar regras,
convencoes coletivas, descontos legais e excecoes.
