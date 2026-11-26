## ADDED Requirements

### Requirement: Formatura usável no celular
As telas da Formatura MUST (DEVEM) funcionar em telas estreitas (menos de 768px) sem rolagem horizontal da página. As grades de Formandos, Pagamentos, Relação de Alunos, Turmas e Participantes DEVEM aparecer como lista de cartões, com os mesmos dados, ações, paginação e exportação da tabela.

#### Scenario: Grade vira cartões no celular
- **WHEN** o usuário abre a aba Relação de Alunos numa tela com menos de 768px
- **THEN** cada aluno aparece num cartão com o nome como título e os demais campos como "rótulo: valor"
- **AND** a tabela não é renderizada

#### Scenario: Ação por toque no cartão
- **WHEN** o usuário toca no interruptor "Participa" do cartão de um aluno
- **THEN** a participação é gravada pela API, como na tabela

#### Scenario: Desktop mantém a tabela
- **WHEN** a tela tem 768px ou mais
- **THEN** a grade continua sendo a tabela com colunas ordenáveis

### Requirement: Instalação como aplicativo pelo PWA
A Formatura MUST (DEVE) poder ser usada pelo PWA já existente do painel do cliente, instalado na tela inicial do celular, sem app nativo nem publicação em loja.

#### Scenario: Abrir pelo atalho instalado
- **WHEN** o usuário instalou o painel do cliente como PWA e abre a Formatura
- **THEN** as telas aparecem no layout de celular, com as mesmas permissões do navegador
