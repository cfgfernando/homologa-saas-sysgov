## Why

Hoje a inscrição do Passeio guarda só um booleano `pago`. Não dá para saber quanto foi pago, quando, por qual
forma, nem aceitar pagamento em parcelas. O dinheiro também não aparece no financeiro do tenant. O legado
(`_legado/modulo-passeio`) tinha a mesma limitação.

## What Changes

- Novo registro de **pagamentos da inscrição** no Passeio (`passeio_pagamentos`): valor em centavos, data,
  forma (dinheiro, PIX, cartão, transferência, outro), observação e quem registrou. Aceita várias parcelas.
- A situação financeira da inscrição passa a ser **calculada**: pendente, parcial ou quitado, no mesmo padrão
  de `Formatura\Enums\SituacaoFinanceira`.
- **BREAKING**: o campo `pago` da inscrição deixa de ser editável pela API. A migration converte cada inscrição
  com `pago = true` em um pagamento único do valor cheio do passeio, e a coluna é removida.
- Os indicadores de arrecadado e pendente passam a somar os pagamentos reais.
- Cada pagamento registrado ou estornado publica um evento no Outbox (`passeio.pagamento.registrado` /
  `passeio.pagamento.estornado`).
- **Finance (opcional)**: quando o módulo Finance está ativo para o tenant, um ouvinte do Outbox cria uma receita
  (`Revenue`) já recebida para cada pagamento, ligada à pessoa responsável, e a cancela no estorno. Sem o
  Finance, o Passeio funciona igual.
- Telas: em Alunos & Termos, a coluna "pago" vira a situação com o valor pago e uma ação "Pagamentos" (listar,
  registrar e estornar). O relatório passa a mostrar valor pago e saldo.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `passeio`: pagamentos da inscrição, situação calculada, indicadores e eventos do Outbox.
- `finance`: receita gerada por pagamento de passeio quando o Finance está ativo.

## Impact

- API: `Modules/Passeio` (migration, model `Pagamento`, `PagamentoService`, rotas, policy, requests, indicadores,
  seeder de demonstração) e `Modules/Finance` (ouvinte de `OutboxMessage`, coluna de origem em `revenues`).
- Front: `apps/web-client/src/modules/passeio` (`api.ts`, `formato.ts`, `InscricoesTermos`, `TurmasPasseio`,
  `RelatoriosPasseio`, `PainelPasseio`).
- Dados: migração de `pago` para pagamentos; quem consome `pago` no JSON passa a ler `situacao_financeira`.
