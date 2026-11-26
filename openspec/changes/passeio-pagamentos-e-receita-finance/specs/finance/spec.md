## ADDED Requirements

### Requirement: Receita de pagamentos do Passeio
Quando o módulo Finance estiver ativo para o tenant, o sistema SHALL criar, ao consumir
`passeio.pagamento.registrado`, uma receita recebida com valor, data de pagamento, pessoa e origem
(`passeio_pagamento` + id), de forma idempotente por origem. Ao consumir `passeio.pagamento.estornado`, SHALL
cancelar essa receita. Com o Finance inativo, os eventos SHALL ser ignorados sem erro.

#### Scenario: Finance ativo
- **WHEN** o Finance está ativo e chega `passeio.pagamento.registrado` de 5000 centavos
- **THEN** existe uma receita recebida de 5000 centavos com origem no pagamento

#### Scenario: Evento repetido
- **WHEN** o mesmo evento é processado duas vezes
- **THEN** existe apenas uma receita para aquela origem

#### Scenario: Finance inativo
- **WHEN** o Finance não está ativo para o tenant e chega o evento
- **THEN** nenhuma receita é criada e o evento é marcado como processado
