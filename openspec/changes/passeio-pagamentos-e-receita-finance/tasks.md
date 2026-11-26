## 1. Backend Passeio

- [x] 1.1 Migration `passeio_pagamentos` (tenant_id, escola_id, índices compostos) e migração dos dados de `pago`, removendo a coluna
- [x] 1.2 Model `Pagamento` (TenantAware/EscolaAware) e enums `FormaPagamento` e `SituacaoFinanceira`
- [x] 1.3 `PagamentoService`: registrar e estornar com validações de saldo, vai e cancelado, `AuditLogger` e Outbox na transação
- [x] 1.4 Rotas `GET/POST /inscricoes/{inscricao}/pagamentos` e `POST /pagamentos/{pagamento}/estorno`, com requests e policy (`passeio.pagamentos.manage` no RBAC seeder)
- [x] 1.5 Inscrição: ignorar `pago` na atualização; expor `situacao_financeira`, `pago_centavos`, `saldo_centavos` e `pago` derivado (obsoleto)
- [x] 1.6 Indicadores: arrecadado e pendente pelos pagamentos, mais contagens por situação
- [x] 1.7 Seeder de demonstração com pagamentos parciais e quitados
- [x] 1.8 Testes de feature: parcelas, saldo excedido, estorno, eventos no Outbox, migração e isolamento de tenant e escola

## 2. Finance

- [x] 2.1 Migration: `source_type` e `source_id` em `revenues`, com índice único por tenant e origem
- [x] 2.2 Ouvinte de `OutboxMessage` para `passeio.pagamento.*`, checando se o Finance está ativo para o tenant
- [x] 2.3 Testes: Finance ativo, inativo, idempotência e estorno cancelando a receita

## 3. Frontend

- [x] 3.1 `api.ts`/`formato.ts`: tipos e chamadas de pagamentos e situação financeira
- [x] 3.2 `InscricoesTermos`: coluna de situação e valor pago, modal "Pagamentos" (listar, registrar, estornar) com `@sysgov/ui`
- [x] 3.3 `TurmasPasseio`, `PainelPasseio` e `RelatoriosPasseio`: valor pago, saldo e contagens por situação
- [x] 3.4 Aviso ao editar o valor de um passeio que já tem pagamentos
- [x] 3.5 Testes do front (vitest) e typecheck

## 4. Fechamento

- [x] 4.1 `./sysgov.sh testes --filter Passeio` e `--filter Finance` passando
- [x] 4.2 `openspec validate passeio-pagamentos-e-receita-finance --strict`
