## MODIFIED Requirements

### Requirement: Inscrições e autorizações
O sistema SHALL registrar a inscrição de um aluno por passeio (no máximo uma), com os indicadores "vai no
passeio" e "autorização entregue", observação e a situação financeira calculada a partir dos pagamentos
(pendente, parcial ou quitado). SHALL também permitir inscrever todos os alunos de uma turma de uma vez sem
duplicar inscrições existentes. O campo "pago" SHALL NOT ser editável diretamente.

#### Scenario: Inscrever turma inteira
- **WHEN** a turma tem 30 alunos, 5 já inscritos, e o usuário inscreve a turma
- **THEN** são criadas 25 inscrições e as 5 existentes permanecem inalteradas

#### Scenario: Tentar marcar pago diretamente
- **WHEN** o usuário envia `pago = true` ao atualizar uma inscrição
- **THEN** o campo é ignorado e a situação financeira continua calculada pelos pagamentos

### Requirement: Indicadores do passeio
O sistema SHALL informar, por passeio e no geral: alunos inscritos, autorizações entregues (quantidade e
percentual), total arrecadado (soma dos pagamentos não estornados) e pendente (devido menos arrecadado) em
centavos, quantidade de inscrições quitadas, parciais e pendentes, quantidade de veículos, capacidade total e
assentos ocupados.

#### Scenario: Arrecadação pendente
- **WHEN** o valor é 5000 centavos e 10 alunos vão ao passeio, 6 quitados
- **THEN** o arrecadado é 30000 e o pendente é 20000 centavos

#### Scenario: Arrecadação com pagamento parcial
- **WHEN** o valor é 5000 centavos, 10 alunos vão ao passeio, 6 quitaram e 1 pagou 2000 centavos
- **THEN** o arrecadado é 32000, o pendente é 18000 centavos, e há 6 quitadas, 1 parcial e 3 pendentes

## ADDED Requirements

### Requirement: Pagamentos da inscrição
O sistema SHALL permitir registrar um ou mais pagamentos para uma inscrição, com valor em centavos (maior que
zero), data, forma de pagamento (dinheiro, pix, cartão, transferência, outro), observação e usuário que
registrou. SHALL recusar o pagamento quando a soma ultrapassar o valor do passeio, quando a inscrição não vai
ao passeio ou quando o passeio está cancelado. Todo registro SHALL passar pelo `AuditLogger`.

#### Scenario: Pagamento em duas parcelas
- **WHEN** o passeio custa 5000 centavos e são registrados pagamentos de 2000 e depois de 3000
- **THEN** a situação passa de parcial para quitado

#### Scenario: Pagamento acima do saldo
- **WHEN** a inscrição já tem 4000 de 5000 pagos e o usuário tenta registrar 2000
- **THEN** a API responde 422 informando o saldo de 1000 centavos

### Requirement: Estorno de pagamento
O sistema SHALL permitir estornar um pagamento informando o motivo, sem apagá-lo, registrando data e
usuário do estorno. Pagamentos estornados SHALL NOT entrar nas somas, e o estorno SHALL ser auditado.

#### Scenario: Estornar parcela
- **WHEN** uma inscrição quitada com parcelas de 2000 e 3000 tem a parcela de 3000 estornada
- **THEN** a situação volta a parcial e o pagamento continua listado como estornado

### Requirement: Eventos financeiros do Passeio no Outbox
O sistema SHALL publicar no Outbox, na mesma transação, o evento `passeio.pagamento.registrado` ao registrar
um pagamento e `passeio.pagamento.estornado` ao estorná-lo. O payload SHALL conter tenant, escola, passeio,
inscrição, pagamento, valor em centavos, data e a pessoa do responsável ou do aluno.

#### Scenario: Evento publicado
- **WHEN** um pagamento de 5000 centavos é registrado
- **THEN** existe um evento `passeio.pagamento.registrado` com `valor_centavos = 5000` no Outbox do tenant

### Requirement: Migração do campo pago
O sistema SHALL converter cada inscrição existente com "pago" verdadeiro e "vai" verdadeiro em um pagamento
único do valor do passeio, com forma "outro", sem publicar eventos no Outbox.

#### Scenario: Inscrição antiga paga
- **WHEN** a migration roda sobre uma inscrição com `pago = true` de um passeio de 5000 centavos
- **THEN** a inscrição fica quitada com um pagamento de 5000 marcado como migrado e nenhum evento novo
