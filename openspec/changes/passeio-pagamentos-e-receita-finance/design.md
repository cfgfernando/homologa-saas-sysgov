## Context

O Passeio é um módulo por escola (`escola_id`), que depende do Cadastro de Pessoas e já tem o valor do passeio
em `valor_centavos`. O Finance é a contabilidade pública do tenant (`revenues` com `amount_cents`, `pessoa_id`,
`status`, `paid_at`). Ele vem desligado por padrão e é habilitado por tenant ou unidade. A Formatura já
resolve pagamentos parcelados com `formatura_pagamentos` e `SituacaoFinanceira`.

## Goals / Non-Goals

**Goals:** registrar pagamentos reais, em parcelas, com rastreabilidade; não depender do Finance; gerar receita
no Finance quando ele estiver ativo, sem acoplar os módulos diretamente.

**Non-Goals:** cobrança online, boleto, conciliação bancária, desconto ou isenção por aluno (fica para outra
change), empenho ou despesa do passeio.

## Decisions

1. **Pagamentos ficam no Passeio** (`passeio_pagamentos`: `tenant_id`, `escola_id`, `inscricao_id`,
   `valor_centavos`, `data_pagamento`, `forma_pagamento`, `observacao`, `registrado_por`, `estornado_em`,
   `estornado_por`, `motivo_estorno`). *Alternativa descartada:* usar só a `Revenue` do Finance, que obrigaria
   a ligar o Finance e misturaria dinheiro de APM com receita orçamentária.
2. **Estorno em vez de exclusão.** O pagamento nunca é apagado. O estorno marca a data, quem fez e o motivo,
   e o valor sai das somas. Isso preserva a auditoria e a receita espelhada.
3. **A situação é calculada**, não gravada: `devido = valor_centavos do passeio` (se a inscrição vai) e
   `pago = soma dos pagamentos não estornados`. Reaproveita a mesma regra da Formatura. Um enum próprio do
   Passeio evita depender do módulo Formatura.
4. **Não aceitar pagamento acima do devido.** Pagamento maior que o saldo é recusado com 422. Também não se
   registra pagamento para inscrição com `vai = false` nem para passeio cancelado.
5. **Integração por Outbox.** O `PagamentoService` grava o pagamento, chama `AuditLogger` e publica o evento na
   mesma transação. No Finance, um ouvinte de `OutboxMessage` filtra os tipos `passeio.pagamento.*` e, se o
   Finance estiver ativo para o tenant, cria a `Revenue` (`status = paid`, `paid_at`, `pessoa_id` do
   responsável financeiro ou do aluno, `description` "Passeio <nome> — <aluno>") com origem
   (`source_type = passeio_pagamento`, `source_id`), em operação idempotente por origem. No estorno, a receita
   vai para `status = cancelled`. Assim o Passeio não importa nada do Finance.
6. **Migração de dados.** Para cada inscrição com `pago = true` e `vai = true`, cria um pagamento do valor
   cheio com `data_pagamento = updated_at`, `forma = outro` e observação "migrado do campo pago". Depois a
   coluna é removida. Isso não gera eventos no Outbox, para não lançar no Finance receitas antigas.

## Risks / Trade-offs

- Mudar o valor do passeio depois de haver pagamentos altera a situação, e a inscrição pode voltar a parcial →
  avisar na tela de edição quando já houver pagamentos.
- Clientes que leem `pago` no JSON → a resposta mantém `pago` como campo derivado (`situacao = quitado`)
  durante esta versão, marcado como obsoleto.
- Ouvinte do Finance falhar → o Outbox tenta de novo, e a idempotência por origem evita receita duplicada.
